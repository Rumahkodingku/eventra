//go:build integration

package inventory

import (
	"context"
	"os"
	"path/filepath"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/oklog/ulid/v2"
	"gorm.io/datatypes"
	"gorm.io/gorm"

	"github.com/eventra/eventra/apps/api/internal/modules/catalog"
	"github.com/eventra/eventra/apps/api/internal/modules/identity"
	"github.com/eventra/eventra/apps/api/internal/platform/database"
	"github.com/eventra/eventra/apps/api/internal/platform/migrate"
)

func TestGAAndSeatConcurrency(t *testing.T) {
	dsn := os.Getenv("TEST_INVENTORY_DATABASE_URL")
	if dsn == "" {
		t.Skip("TEST_INVENTORY_DATABASE_URL is not set")
	}
	ctx := context.Background()
	db, err := database.Open(ctx, dsn)
	if err != nil {
		t.Fatalf("database.Open() error = %v", err)
	}
	defer database.Close(db)
	dir, _ := filepath.Abs("../../../migrations")
	if err := migrate.Up(dsn, dir); err != nil && err.Error() != "no change" {
		t.Fatalf("migrate.Up() error = %v", err)
	}

	service := NewService(db, time.Minute)
	event := createTestEvent(t, db, "GA")
	ticket := createTicket(t, db, event.ID, "GENERAL_ADMISSION", "", 100)
	createBucket(t, db, ticket.ID, 1, 0)

	var successes atomic.Int32
	var wg sync.WaitGroup
	for index := 0; index < 20; index++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			if _, err := service.Reserve(ctx, "test-ga", event.ID, []Item{{
				TicketTypeID: ticket.ID, Quantity: 1,
			}}); err == nil {
				successes.Add(1)
			}
		}()
	}
	wg.Wait()
	if successes.Load() != 1 {
		t.Fatalf("GA successes = %d, want 1", successes.Load())
	}

	seatEvent := createTestEvent(t, db, "SEAT")
	seat := createSeatLayout(t, db, seatEvent.ID)
	seatTicket := createTicket(t, db, seatEvent.ID, "SEATED", "front", 100)
	createBucket(t, db, seatTicket.ID, 1, 0)

	successes.Store(0)
	wg = sync.WaitGroup{}
	for index := 0; index < 20; index++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			if _, err := service.Reserve(ctx, "test-seat", seatEvent.ID, []Item{{
				TicketTypeID: seatTicket.ID, Quantity: 1, SeatIDs: []string{seat},
			}}); err == nil {
				successes.Add(1)
			}
		}()
	}
	wg.Wait()
	if successes.Load() != 1 {
		t.Fatalf("seat successes = %d, want 1", successes.Load())
	}
}

func TestExpiryReleasesOnce(t *testing.T) {
	dsn := os.Getenv("TEST_INVENTORY_DATABASE_URL")
	if dsn == "" {
		t.Skip("TEST_INVENTORY_DATABASE_URL is not set")
	}
	ctx := context.Background()
	db, err := database.Open(ctx, dsn)
	if err != nil {
		t.Fatalf("database.Open() error = %v", err)
	}
	defer database.Close(db)
	service := NewService(db, time.Minute)
	event := createTestEvent(t, db, "EXPIRY")
	ticket := createTicket(t, db, event.ID, "GENERAL_ADMISSION", "", 5)
	createBucket(t, db, ticket.ID, 5, 0)

	reservation, err := service.Reserve(ctx, "test-expiry", event.ID, []Item{{TicketTypeID: ticket.ID, Quantity: 2}})
	if err != nil {
		t.Fatalf("Reserve() error = %v", err)
	}
	if err := db.Model(&Reservation{}).Where("id = ?", reservation.ID).Update("expires_at", time.Now().Add(-time.Minute)).Error; err != nil {
		t.Fatalf("expire update error = %v", err)
	}
	if count, err := service.ExpireDue(ctx, 100); err != nil || count < 1 {
		t.Fatalf("ExpireDue() = %d, %v; want at least 1", count, err)
	}
	if count, err := service.ExpireDue(ctx, 100); err != nil || count != 0 {
		t.Fatalf("second ExpireDue() = %d, %v; want 0", count, err)
	}
	var bucket Bucket
	if err := db.Where("ticket_type_id = ?", ticket.ID).First(&bucket).Error; err != nil {
		t.Fatalf("load bucket error = %v", err)
	}
	if bucket.Reserved != 0 {
		t.Fatalf("reserved = %d, want 0", bucket.Reserved)
	}
}

func createTestEvent(t *testing.T, db *gorm.DB, prefix string) catalog.Event {
	t.Helper()
	org := identityOrganization(t, db)
	category := catalog.Category{ID: newTestID(), Slug: "cat-" + prefix + "-" + newTestID(), Name: "Category", Description: "d", Image: "/x", Icon: "x", Subcategories: datatypes.JSON([]byte("[]"))}
	venue := catalog.Venue{ID: newTestID(), Name: "Venue", Address: "a", City: "c", Region: "r", Country: "ID", Timezone: "Asia/Jakarta"}
	if err := db.Create(&category).Error; err != nil {
		t.Fatalf("create category error = %v", err)
	}
	if err := db.Create(&venue).Error; err != nil {
		t.Fatalf("create venue error = %v", err)
	}
	now := time.Now().UTC()
	event := catalog.Event{
		ID: newTestID(), OrganizationID: org, CategoryID: category.ID, VenueID: venue.ID,
		Slug: "event-" + prefix + "-" + newTestID(), Title: "Event " + prefix, Subcategory: "s", Description: "d",
		CoverImage: "/x", Gallery: datatypes.JSON([]byte("[]")), Tags: datatypes.JSON([]byte("[]")),
		Highlights: datatypes.JSON([]byte("[]")), Schedule: datatypes.JSON([]byte("[]")),
		Terms: datatypes.JSON([]byte("[]")), Status: "PUBLISHED", TicketingMode: "GENERAL_ADMISSION",
		StartAt: now.Add(24 * time.Hour), EndAt: now.Add(26 * time.Hour), Timezone: "Asia/Jakarta",
		CreatedAt: now, UpdatedAt: now,
	}
	if err := db.Create(&event).Error; err != nil {
		t.Fatalf("create event error = %v", err)
	}
	return event
}

func createTicket(t *testing.T, db *gorm.DB, eventID, kind, tierKey string, quota int) catalog.TicketType {
	t.Helper()
	ticket := catalog.TicketType{
		ID: newTestID(), EventID: eventID, Name: "Ticket", Description: "d", Price: 100000,
		Currency: "IDR", Quota: quota, SoldCount: 0, MinPerOrder: 1, MaxPerOrder: 6,
		SalesStartAt: time.Now().Add(-time.Hour), SalesEndAt: time.Now().Add(24 * time.Hour),
		Benefits: datatypes.JSON([]byte("[]")), Status: "ACTIVE", Kind: kind,
	}
	if tierKey != "" {
		ticket.TierKey = &tierKey
	}
	if err := db.Create(&ticket).Error; err != nil {
		t.Fatalf("create ticket error = %v", err)
	}
	return ticket
}

func createBucket(t *testing.T, db *gorm.DB, ticketID string, capacity, sold int) {
	t.Helper()
	if err := db.Create(&Bucket{ID: newTestID(), TicketTypeID: ticketID, Capacity: capacity, Sold: sold}).Error; err != nil {
		t.Fatalf("create bucket error = %v", err)
	}
}

func createSeatLayout(t *testing.T, db *gorm.DB, eventID string) string {
	t.Helper()
	layoutID, sectionID, seatID := newTestID(), newTestID(), newTestID()
	if err := db.Create(&catalog.VenueLayout{ID: layoutID, Name: "Test"}).Error; err != nil {
		t.Fatalf("create layout error = %v", err)
	}
	if err := db.Create(&catalog.Section{ID: sectionID, LayoutID: layoutID, Name: "Front", Label: "Front", TierKey: "front"}).Error; err != nil {
		t.Fatalf("create section error = %v", err)
	}
	if err := db.Create(&catalog.Seat{ID: seatID, SectionID: sectionID, Row: "A", Number: 1, Status: "AVAILABLE", Accessible: true}).Error; err != nil {
		t.Fatalf("create seat error = %v", err)
	}
	if err := db.Model(&catalog.Event{}).Where("id = ?", eventID).Update("layout_id", layoutID).Error; err != nil {
		t.Fatalf("update event layout error = %v", err)
	}
	return seatID
}

func identityOrganization(t *testing.T, db *gorm.DB) string {
	t.Helper()
	var org identity.Organization
	if err := db.Where("slug = ?", "test-inventory").First(&org).Error; err == nil {
		return org.ID
	}
	org = identity.Organization{ID: newTestID(), Name: "Test", Slug: "test-inventory", CreatedAt: time.Now()}
	if err := db.Create(&org).Error; err != nil {
		t.Fatalf("create org error = %v", err)
	}
	return org.ID
}

func newTestID() string {
	return ulid.Make().String()
}
