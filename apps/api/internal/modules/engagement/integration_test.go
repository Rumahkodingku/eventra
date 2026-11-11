//go:build integration

package engagement_test

import (
	"context"
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/oklog/ulid/v2"
	"gorm.io/datatypes"
	"gorm.io/gorm"

	"github.com/eventra/eventra/apps/api/internal/modules/analytics"
	"github.com/eventra/eventra/apps/api/internal/modules/catalog"
	"github.com/eventra/eventra/apps/api/internal/modules/notification"
	"github.com/eventra/eventra/apps/api/internal/modules/organization"
	"github.com/eventra/eventra/apps/api/internal/modules/review"
	"github.com/eventra/eventra/apps/api/internal/modules/wishlist"
	"github.com/eventra/eventra/apps/api/internal/platform/database"
	"github.com/eventra/eventra/apps/api/internal/platform/migrate"
)

func testDB(t *testing.T) *gorm.DB {
	t.Helper()
	dsn := os.Getenv("TEST_ENGAGEMENT_DATABASE_URL")
	if dsn == "" {
		t.Skip("TEST_ENGAGEMENT_DATABASE_URL is not set")
	}
	dir, _ := filepath.Abs("../../../migrations")
	if err := migrate.Up(dsn, dir); err != nil && err.Error() != "no change" {
		t.Fatalf("migrate.Up() error = %v", err)
	}
	db, err := database.Open(context.Background(), dsn)
	if err != nil {
		t.Fatalf("database.Open() error = %v", err)
	}
	t.Cleanup(func() { _ = database.Close(db) })
	return db
}

func id() string { return ulid.Make().String() }

func createOrg(t *testing.T, db *gorm.DB) string {
	t.Helper()
	orgID := id()
	if err := db.Exec("INSERT INTO organizations (id, name, slug) VALUES (?, ?, ?)",
		orgID, "Org "+orgID[:6], "org-"+orgID).Error; err != nil {
		t.Fatalf("create org error = %v", err)
	}
	return orgID
}

func createUser(t *testing.T, db *gorm.DB) string {
	t.Helper()
	userID := id()
	if err := db.Exec("INSERT INTO users (id, email_normalized, name, role, locale) VALUES (?, ?, ?, 'CUSTOMER', 'id')",
		userID, userID+"@test.local", "User "+userID[:6]).Error; err != nil {
		t.Fatalf("create user error = %v", err)
	}
	return userID
}

func createEvent(t *testing.T, db *gorm.DB, orgID string) string {
	t.Helper()
	categoryID, venueID, eventID := id(), id(), id()
	if err := db.Exec("INSERT INTO categories (id, slug, name, description, image, icon, subcategories) VALUES (?, ?, ?, '', '', '', '[]')",
		categoryID, "cat-"+categoryID, "Category").Error; err != nil {
		t.Fatalf("create category error = %v", err)
	}
	if err := db.Exec("INSERT INTO venues (id, name, address, city, region, country, timezone) VALUES (?, ?, ?, ?, ?, ?, ?)",
		venueID, "Venue", "Address", "Jakarta", "DKI", "Indonesia", "Asia/Jakarta").Error; err != nil {
		t.Fatalf("create venue error = %v", err)
	}
	event := catalog.Event{
		ID: eventID, OrganizationID: orgID, CategoryID: categoryID, VenueID: venueID,
		Slug: "event-" + eventID, Title: "Test Event", Status: "PUBLISHED",
		TicketingMode: "GENERAL_ADMISSION", StartAt: time.Now(), EndAt: time.Now().Add(time.Hour),
		Timezone: "Asia/Jakarta", Gallery: datatypes.JSON([]byte("[]")),
		Tags: datatypes.JSON([]byte("[]")), Highlights: datatypes.JSON([]byte("[]")),
		Schedule: datatypes.JSON([]byte("[]")), Terms: datatypes.JSON([]byte("[]")),
	}
	if err := db.Create(&event).Error; err != nil {
		t.Fatalf("create event error = %v", err)
	}
	return eventID
}

func createOrder(t *testing.T, db *gorm.DB, eventID, userID, principal string, quantity int, revenue int64) (string, string) {
	t.Helper()
	orderID, itemID, attendeeID, ticketID := id(), id(), id(), id()
	if err := db.Exec(`INSERT INTO orders
		(id, order_number, principal_key, user_id, reservation_id, buyer_name, buyer_email, buyer_phone,
		 subtotal, service_fee, discount, total, payment_method, payment_status, order_status, paid_at)
		VALUES (?, ?, ?, ?, ?, 'Buyer', 'buyer@test.local', '0812', ?, 0, 0, ?, 'qris', 'PAID', 'CONFIRMED', NOW(6))`,
		orderID, "ORD-"+orderID, principal, userID, id(), revenue, revenue).Error; err != nil {
		t.Fatalf("create order error = %v", err)
	}
	if err := db.Exec(`INSERT INTO order_items
		(id, order_id, event_id, ticket_type_id, ticket_name_snapshot, event_title_snapshot,
		 event_start_at_snapshot, venue_name_snapshot, quantity, unit_price_snapshot, line_subtotal, seat_ids, attendee_ids)
		VALUES (?, ?, ?, 'tt-test', 'Regular', 'Test Event', NOW(6), 'Venue', ?, ?, ?, '[]', ?)`,
		itemID, orderID, eventID, quantity, revenue/int64(quantity), revenue,
		`["`+attendeeID+`"]`).Error; err != nil {
		t.Fatalf("create order item error = %v", err)
	}
	if err := db.Exec(`INSERT INTO attendees (id, order_id, full_name, email, check_in_status)
		VALUES (?, ?, 'Attendee', 'attendee@test.local', 'CHECKED_IN')`, attendeeID, orderID).Error; err != nil {
		t.Fatalf("create attendee error = %v", err)
	}
	if err := db.Exec(`INSERT INTO tickets
		(id, ticket_code, qr_token_hash, order_id, event_id, ticket_type_id, attendee_id, status, issued_at, checked_in_at)
		VALUES (?, ?, ?, ?, ?, 'tt-test', ?, 'USED', NOW(6), NOW(6))`,
		ticketID, "TKT-"+ticketID, id(), orderID, eventID, attendeeID).Error; err != nil {
		t.Fatalf("create ticket error = %v", err)
	}
	return orderID, attendeeID
}

func TestNotificationOwnership(t *testing.T) {
	db := testDB(t)
	service := notification.NewService(db)
	userA, userB := createUser(t, db), createUser(t, db)
	if err := service.CreateTx(context.Background(), db, &userA, "ORDER", "A", "Message", "/orders"); err != nil {
		t.Fatalf("CreateTx() error = %v", err)
	}
	if err := service.CreateTx(context.Background(), db, &userB, "ORDER", "B", "Message", "/orders"); err != nil {
		t.Fatalf("CreateTx() error = %v", err)
	}
	items, err := service.List(context.Background(), userA)
	if err != nil || len(items) != 1 || items[0].Title != "A" {
		t.Fatalf("List(A) = %#v, %v", items, err)
	}
	if err := service.MarkRead(context.Background(), userB, items[0].ID); err != notification.ErrNotFound {
		t.Fatalf("MarkRead(other) = %v, want ErrNotFound", err)
	}
	if err := service.MarkRead(context.Background(), userA, items[0].ID); err != nil {
		t.Fatalf("MarkRead(owner) = %v", err)
	}
}

func TestReviewEligibilityAndDuplicate(t *testing.T) {
	db := testDB(t)
	service := review.NewService(db)
	orgID, userID, eventID := createOrg(t, db), createUser(t, db), ""
	eventID = createEvent(t, db, orgID)
	principal := "user:" + userID
	if _, err := service.Create(context.Background(), userID, eventID, "", 5, "Great"); err != review.ErrNotEligible {
		t.Fatalf("Create(no ticket) = %v, want ErrNotEligible", err)
	}
	createOrder(t, db, eventID, userID, principal, 1, 100000)
	if _, err := service.Create(context.Background(), userID, eventID, "", 5, "Great"); err != nil {
		t.Fatalf("Create(eligible) = %v", err)
	}
	if _, err := service.Create(context.Background(), userID, eventID, "", 4, "Again"); err != review.ErrDuplicate {
		t.Fatalf("Create(duplicate) = %v, want ErrDuplicate", err)
	}
	items, err := service.List(context.Background(), eventID, "highest", 5)
	if err != nil || len(items) != 1 {
		t.Fatalf("List() = %#v, %v", items, err)
	}
}

func TestWishlistOwnership(t *testing.T) {
	db := testDB(t)
	service := wishlist.NewService(db)
	orgID, userA, userB := createOrg(t, db), createUser(t, db), createUser(t, db)
	eventID := createEvent(t, db, orgID)
	if err := service.Add(context.Background(), userA, eventID); err != nil {
		t.Fatalf("Add() error = %v", err)
	}
	items, err := service.List(context.Background(), userA)
	if err != nil || len(items) != 1 || items[0] != eventID {
		t.Fatalf("List(A) = %#v, %v", items, err)
	}
	other, err := service.List(context.Background(), userB)
	if err != nil || len(other) != 0 {
		t.Fatalf("List(B) = %#v, %v", other, err)
	}
	if err := service.Remove(context.Background(), userA, eventID); err != nil {
		t.Fatalf("Remove() error = %v", err)
	}
}

func TestAnalyticsAndSettingsScope(t *testing.T) {
	db := testDB(t)
	analyticsService := analytics.NewService(db)
	settingsService := organization.NewService(db)
	orgA, orgB := createOrg(t, db), createOrg(t, db)
	userA, userB := createUser(t, db), createUser(t, db)
	eventA := createEvent(t, db, orgA)
	createEvent(t, db, orgB)
	createOrder(t, db, eventA, userA, "user:"+userA, 2, 500000)
	if err := db.Exec("INSERT INTO organization_members (organization_id, user_id, role) VALUES (?, ?, 'OWNER')", orgA, userA).Error; err != nil {
		t.Fatalf("create membership error = %v", err)
	}

	reportA, err := analyticsService.Report(context.Background(), orgA, "")
	if err != nil {
		t.Fatalf("Report(A) error = %v", err)
	}
	reportB, err := analyticsService.Report(context.Background(), orgB, "")
	if err != nil {
		t.Fatalf("Report(B) error = %v", err)
	}
	if reportA.Summary.Revenue != 500000 || reportA.Summary.TicketsSold != 2 {
		t.Fatalf("Report(A) summary = %#v", reportA.Summary)
	}
	if reportB.Summary.Revenue != 0 || reportA.Summary.Revenue == reportB.Summary.Revenue {
		t.Fatalf("cross-org analytics leak: A=%#v B=%#v", reportA.Summary, reportB.Summary)
	}

	updated, err := settingsService.Update(context.Background(), orgA, organization.UpdateInput{DisplayName: "Org A Updated"})
	if err != nil || updated.DisplayName != "Org A Updated" || updated.PayoutStatus != "SAMPLE" {
		t.Fatalf("Update(A) = %#v, %v", updated, err)
	}
	settingsB, err := settingsService.Get(context.Background(), orgB)
	if err != nil || settingsB.DisplayName == "Org A Updated" {
		t.Fatalf("Get(B) = %#v, %v", settingsB, err)
	}
	_ = userB
}
