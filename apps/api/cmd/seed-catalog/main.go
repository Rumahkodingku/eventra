package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"os"
	"time"

	"gorm.io/datatypes"
	"gorm.io/gorm"

	"github.com/oklog/ulid/v2"

	"github.com/eventra/eventra/apps/api/internal/modules/catalog"
	"github.com/eventra/eventra/apps/api/internal/modules/identity"
	"github.com/eventra/eventra/apps/api/internal/modules/inventory"
	"github.com/eventra/eventra/apps/api/internal/platform/config"
	"github.com/eventra/eventra/apps/api/internal/platform/database"
)

type seedCategory struct {
	ID            string   `json:"id"`
	Slug          string   `json:"slug"`
	Name          string   `json:"name"`
	Description   string   `json:"description"`
	Image         string   `json:"image"`
	Icon          string   `json:"icon"`
	Subcategories []string `json:"subcategories"`
}

type seedVenue struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Address  string `json:"address"`
	City     string `json:"city"`
	Region   string `json:"region"`
	Country  string `json:"country"`
	Timezone string `json:"timezone"`
	MapURL   string `json:"mapUrl"`
	LayoutID string `json:"layoutId"`
}

type seedSeat struct {
	ID         string `json:"id"`
	SectionID  string `json:"sectionId"`
	Row        string `json:"row"`
	Number     int    `json:"number"`
	Status     string `json:"status"`
	Accessible bool   `json:"accessible"`
}

type seedSection struct {
	ID      string     `json:"id"`
	Name    string     `json:"name"`
	Label   string     `json:"label"`
	TierKey string     `json:"tierKey"`
	Seats   []seedSeat `json:"seats"`
}

type seedLayout struct {
	ID       string        `json:"id"`
	Name     string        `json:"name"`
	Sections []seedSection `json:"sections"`
}

type seedTicketType struct {
	ID           string   `json:"id"`
	EventID      string   `json:"eventId"`
	Name         string   `json:"name"`
	Description  string   `json:"description"`
	Price        int64    `json:"price"`
	Currency     string   `json:"currency"`
	Quota        int      `json:"quota"`
	SoldCount    int      `json:"soldCount"`
	MinPerOrder  int      `json:"minPerOrder"`
	MaxPerOrder  int      `json:"maxPerOrder"`
	SalesStartAt string   `json:"salesStartAt"`
	SalesEndAt   string   `json:"salesEndAt"`
	Benefits     []string `json:"benefits"`
	Status       string   `json:"status"`
	Kind         string   `json:"kind"`
	TierKey      string   `json:"tierKey"`
}

type seedEvent struct {
	ID                  string                 `json:"id"`
	Slug                string                 `json:"slug"`
	Title               string                 `json:"title"`
	CategoryID          string                 `json:"categoryId"`
	Subcategory         string                 `json:"subcategory"`
	Description         string                 `json:"description"`
	CoverImage          string                 `json:"coverImage"`
	Gallery             []string               `json:"gallery"`
	OrganizerID         string                 `json:"organizerId"`
	Status              string                 `json:"status"`
	TicketingMode       string                 `json:"ticketingMode"`
	StartAt             string                 `json:"startAt"`
	EndAt               string                 `json:"endAt"`
	Timezone            string                 `json:"timezone"`
	VenueID             string                 `json:"venueId"`
	Tags                []string               `json:"tags"`
	Highlights          []string               `json:"highlights"`
	Schedule            []catalog.ScheduleItem `json:"schedule"`
	Terms               []string               `json:"terms"`
	AgeNote             string                 `json:"ageNote"`
	AccessibilityNote   string                 `json:"accessibilityNote"`
	CreatedAt           string                 `json:"createdAt"`
	UpdatedAt           string                 `json:"updatedAt"`
	IsFeatured          bool                   `json:"isFeatured"`
	IsTrending          bool                   `json:"isTrending"`
	IsRecommended       bool                   `json:"isRecommended"`
	Popularity          int                    `json:"popularity"`
	LimitedAvailability bool                   `json:"limitedAvailability"`
	IsEarlyBird         bool                   `json:"isEarlyBird"`
	TicketTypes         []seedTicketType       `json:"ticketTypes"`
	LayoutID            string                 `json:"layoutId"`
	SeatLayout          *seedLayout            `json:"seatLayout"`
}

type seedFile struct {
	Categories []seedCategory `json:"categories"`
	Venues     []seedVenue    `json:"venues"`
	Events     []seedEvent    `json:"events"`
}

func main() {
	cfg, err := config.Load()
	if err != nil {
		slog.Error("config_error", "error", err)
		os.Exit(1)
	}
	path := os.Getenv("CATALOG_SEED_FILE")
	if path == "" {
		path = "./seed/catalog.json"
	}
	raw, err := os.ReadFile(path)
	if err != nil {
		slog.Error("seed_file_error", "error", err, "path", path)
		os.Exit(1)
	}
	var seed seedFile
	if err := json.Unmarshal(raw, &seed); err != nil {
		slog.Error("seed_parse_error", "error", err)
		os.Exit(1)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()
	db, err := database.Open(ctx, cfg.DatabaseURL)
	if err != nil {
		slog.Error("database_error", "error", err)
		os.Exit(1)
	}
	defer database.Close(db)

	if err := importCatalog(ctx, db, seed); err != nil {
		slog.Error("catalog_import_error", "error", err)
		os.Exit(1)
	}
	slog.Info("catalog_seed_complete", "events", len(seed.Events))
}

func importCatalog(ctx context.Context, db *gorm.DB, seed seedFile) error {
	var org identity.Organization
	if err := db.WithContext(ctx).Where("slug = ?", "rumah-kodingku-live").First(&org).Error; err != nil {
		return fmt.Errorf("demo organization missing; run cmd/seed first: %w", err)
	}

	return db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		for _, table := range []string{
			"seat_claims", "inventory_reservation_items", "inventory_reservations", "inventory_buckets",
			"ticket_types", "events", "seats", "venue_sections", "venue_layouts", "categories", "venues",
		} {
			if err := tx.Exec("DELETE FROM " + table).Error; err != nil {
				return err
			}
		}

		for _, category := range seed.Categories {
			value, err := jsonValue(category.Subcategories)
			if err != nil {
				return err
			}
			if err := tx.Create(&catalog.Category{
				ID: category.ID, Slug: category.Slug, Name: category.Name,
				Description: category.Description, Image: category.Image, Icon: category.Icon,
				Subcategories: value,
			}).Error; err != nil {
				return err
			}
		}
		for _, venue := range seed.Venues {
			var mapURL, layoutID *string
			if venue.MapURL != "" {
				mapURL = &venue.MapURL
			}
			if venue.LayoutID != "" {
				layoutID = &venue.LayoutID
			}
			if err := tx.Create(&catalog.Venue{
				ID: venue.ID, Name: venue.Name, Address: venue.Address, City: venue.City,
				Region: venue.Region, Country: venue.Country, Timezone: venue.Timezone,
				MapURL: mapURL, LayoutID: layoutID,
			}).Error; err != nil {
				return err
			}
		}

		insertedLayouts := map[string]bool{}
		for _, event := range seed.Events {
			if event.SeatLayout == nil || insertedLayouts[event.SeatLayout.ID] {
				continue
			}
			insertedLayouts[event.SeatLayout.ID] = true
			if err := insertLayout(tx, *event.SeatLayout); err != nil {
				return err
			}
		}

		for _, event := range seed.Events {
			gallery, _ := jsonValue(event.Gallery)
			tags, _ := jsonValue(event.Tags)
			highlights, _ := jsonValue(event.Highlights)
			schedule, _ := jsonValue(event.Schedule)
			terms, _ := jsonValue(event.Terms)
			start, err := parseTime(event.StartAt)
			if err != nil {
				return err
			}
			end, err := parseTime(event.EndAt)
			if err != nil {
				return err
			}
			created, _ := parseTime(event.CreatedAt)
			updated, _ := parseTime(event.UpdatedAt)
			var layoutID *string
			if event.LayoutID != "" {
				layoutID = &event.LayoutID
			}
			record := catalog.Event{
				ID: event.ID, OrganizationID: org.ID, CategoryID: event.CategoryID,
				VenueID: event.VenueID, Slug: event.Slug, Title: event.Title,
				Subcategory: event.Subcategory, Description: event.Description,
				CoverImage: event.CoverImage, Gallery: gallery, Tags: tags,
				Highlights: highlights, Schedule: schedule, Terms: terms,
				Status: event.Status, TicketingMode: event.TicketingMode,
				StartAt: start, EndAt: end, Timezone: event.Timezone,
				IsFeatured: event.IsFeatured, IsTrending: event.IsTrending,
				IsRecommended: event.IsRecommended, Popularity: event.Popularity,
				LimitedAvailability: event.LimitedAvailability, IsEarlyBird: event.IsEarlyBird,
				LayoutID: layoutID, CreatedAt: created, UpdatedAt: updated,
			}
			if event.AgeNote != "" {
				record.AgeNote = &event.AgeNote
			}
			if event.AccessibilityNote != "" {
				record.AccessibilityNote = &event.AccessibilityNote
			}
			if err := tx.Create(&record).Error; err != nil {
				return err
			}

			for _, ticket := range event.TicketTypes {
				benefits, _ := jsonValue(ticket.Benefits)
				start, err := parseTime(ticket.SalesStartAt)
				if err != nil {
					return err
				}
				end, err := parseTime(ticket.SalesEndAt)
				if err != nil {
					return err
				}
				var tierKey *string
				if ticket.TierKey != "" {
					tierKey = &ticket.TierKey
				}
				if err := tx.Create(&catalog.TicketType{
					ID: ticket.ID, EventID: ticket.EventID, Name: ticket.Name,
					Description: ticket.Description, Price: ticket.Price, Currency: ticket.Currency,
					Quota: ticket.Quota, SoldCount: ticket.SoldCount, MinPerOrder: ticket.MinPerOrder,
					MaxPerOrder: ticket.MaxPerOrder, SalesStartAt: start, SalesEndAt: end,
					Benefits: benefits, Status: ticket.Status, Kind: ticket.Kind, TierKey: tierKey,
				}).Error; err != nil {
					return err
				}
				if err := tx.Create(&inventory.Bucket{
					ID: ulid.Make().String(), TicketTypeID: ticket.ID,
					Capacity: ticket.Quota, Sold: ticket.SoldCount,
				}).Error; err != nil {
					return err
				}
			}
		}
		return nil
	})
}

func insertLayout(tx *gorm.DB, layout seedLayout) error {
	if err := tx.Create(&catalog.VenueLayout{ID: layout.ID, Name: layout.Name}).Error; err != nil {
		return err
	}
	for index, section := range layout.Sections {
		if err := tx.Create(&catalog.Section{
			ID: section.ID, LayoutID: layout.ID, Name: section.Name,
			Label: section.Label, TierKey: section.TierKey, SortOrder: index,
		}).Error; err != nil {
			return err
		}
		for _, seat := range section.Seats {
			if err := tx.Create(&catalog.Seat{
				ID: seat.ID, SectionID: seat.SectionID, Row: seat.Row,
				Number: seat.Number, Status: seat.Status, Accessible: seat.Accessible,
			}).Error; err != nil {
				return err
			}
		}
	}
	return nil
}

func jsonValue(value any) (datatypes.JSON, error) {
	raw, err := json.Marshal(value)
	if err != nil {
		return nil, err
	}
	return datatypes.JSON(raw), nil
}

func parseTime(value string) (time.Time, error) {
	if value == "" {
		return time.Time{}, nil
	}
	parsed, err := time.Parse(time.RFC3339Nano, value)
	if err != nil {
		return time.Time{}, err
	}
	return parsed.UTC(), nil
}

var _ = errors.Is
var _ = gorm.ErrRecordNotFound
