package catalog

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/oklog/ulid/v2"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

type Service struct {
	db *gorm.DB
}

type EventFilter struct {
	Query        string
	CategorySlug string
	City         string
	Mode         string
	Sort         string
	Limit        int
}

func NewService(db *gorm.DB) *Service {
	return &Service{db: db}
}

func (s *Service) ListCategories(ctx context.Context) ([]Category, error) {
	var categories []Category
	err := s.db.WithContext(ctx).Order("name ASC").Find(&categories).Error
	return categories, err
}

func (s *Service) GetVenue(ctx context.Context, id string) (Venue, error) {
	var venue Venue
	err := s.db.WithContext(ctx).Where("id = ?", id).First(&venue).Error
	if err == gorm.ErrRecordNotFound {
		return Venue{}, gorm.ErrRecordNotFound
	}
	return venue, err
}

func (s *Service) ListEvents(ctx context.Context, filter EventFilter) ([]Event, error) {
	query := s.db.WithContext(ctx).
		Preload("TicketTypes").
		Where("status NOT IN ?", []string{"DRAFT", "ENDED"})

	if filter.Query != "" {
		like := "%" + strings.ToLower(filter.Query) + "%"
		query = query.Where(
			"LOWER(title) LIKE ? OR LOWER(description) LIKE ? OR LOWER(subcategory) LIKE ?",
			like, like, like,
		)
	}
	if filter.CategorySlug != "" {
		var category Category
		if err := s.db.WithContext(ctx).Where("slug = ?", filter.CategorySlug).First(&category).Error; err == nil {
			query = query.Where("category_id = ?", category.ID)
		}
	}
	if filter.City != "" {
		var venues []Venue
		if err := s.db.WithContext(ctx).Where("city = ?", filter.City).Find(&venues).Error; err == nil {
			ids := make([]string, 0, len(venues))
			for _, venue := range venues {
				ids = append(ids, venue.ID)
			}
			query = query.Where("venue_id IN ?", ids)
		}
	}
	if filter.Mode != "" {
		query = query.Where("ticketing_mode = ?", filter.Mode)
	}

	switch filter.Sort {
	case "soonest":
		query = query.Order("start_at ASC")
	case "newest":
		query = query.Order("created_at DESC")
	case "popularity":
		query = query.Order("popularity DESC")
	default:
		query = query.Order("is_recommended DESC, popularity DESC")
	}

	limit := filter.Limit
	if limit <= 0 || limit > 100 {
		limit = 50
	}
	var events []Event
	err := query.Limit(limit).Find(&events).Error
	return events, err
}

func (s *Service) GetEventBySlug(ctx context.Context, slug string) (Event, error) {
	var event Event
	err := s.db.WithContext(ctx).
		Preload("TicketTypes").
		Where("slug = ?", slug).
		First(&event).Error
	if err != nil {
		return Event{}, err
	}
	if event.LayoutID != nil {
		layout, err := s.getLayout(ctx, *event.LayoutID)
		if err == nil {
			event.SeatLayout = &layout
		}
	}
	return event, nil
}

func (s *Service) ListTicketTypes(ctx context.Context, eventID string) ([]TicketType, error) {
	var tickets []TicketType
	err := s.db.WithContext(ctx).Where("event_id = ?", eventID).Order("price ASC").Find(&tickets).Error
	return tickets, err
}

func (s *Service) getLayout(ctx context.Context, id string) (VenueLayout, error) {
	var layout VenueLayout
	err := s.db.WithContext(ctx).
		Preload("Sections", func(db *gorm.DB) *gorm.DB { return db.Order("sort_order ASC") }).
		Preload("Sections.Seats", func(db *gorm.DB) *gorm.DB { return db.Order("row_label ASC, seat_number ASC") }).
		Where("id = ?", id).
		First(&layout).Error
	return layout, err
}

func (s *Service) OrganizationIDForUser(ctx context.Context, userID string) (string, error) {
	var member struct{ OrganizationID string }
	err := s.db.WithContext(ctx).
		Table("organization_members").
		Select("organization_id").
		Where("user_id = ?", userID).
		First(&member).Error
	if err != nil {
		return "", err
	}
	return member.OrganizationID, nil
}

func (s *Service) ListOrganizerEvents(ctx context.Context, organizationID string) ([]Event, error) {
	var events []Event
	err := s.db.WithContext(ctx).
		Preload("TicketTypes").
		Where("organization_id = ?", organizationID).
		Order("start_at ASC").
		Find(&events).Error
	return events, err
}

func (s *Service) GetOrganizerEvent(ctx context.Context, organizationID, eventID string) (Event, error) {
	var event Event
	err := s.db.WithContext(ctx).
		Preload("TicketTypes").
		Where("id = ? AND organization_id = ?", eventID, organizationID).
		First(&event).Error
	if err != nil {
		return Event{}, err
	}
	if event.LayoutID != nil {
		if layout, err := s.getLayout(ctx, *event.LayoutID); err == nil {
			event.SeatLayout = &layout
		}
	}
	return event, nil
}

type EventInput struct {
	Title         string    `json:"title"`
	CategoryID    string    `json:"category_id"`
	VenueID       string    `json:"venue_id"`
	StartAt       time.Time `json:"start_at"`
	EndAt         time.Time `json:"end_at"`
	Timezone      string    `json:"timezone"`
	TicketingMode string    `json:"ticketing_mode"`
	Description   string    `json:"description"`
	CoverImage    string    `json:"cover_image"`
	Status        string    `json:"status"`
	BasePrice     int64     `json:"base_price"`
	Subcategory   string    `json:"subcategory"`
	Highlights    []string  `json:"highlights"`
	Terms         []string  `json:"terms"`
	AgeNote       string    `json:"age_note"`
	Accessibility string    `json:"accessibility_note"`
}

func (s *Service) CreateEvent(ctx context.Context, organizationID string, input EventInput) (Event, error) {
	if input.Title == "" || input.CategoryID == "" || input.VenueID == "" {
		return Event{}, fmt.Errorf("title, category_id, and venue_id are required")
	}
	if input.TicketingMode == "" {
		input.TicketingMode = "GENERAL_ADMISSION"
	}
	if input.Status == "" {
		input.Status = "DRAFT"
	}
	id := ulid.Make().String()
	slug := slugify(input.Title) + "-" + strings.ToLower(id[len(id)-4:])
	event := Event{
		ID: id, OrganizationID: organizationID, CategoryID: input.CategoryID,
		VenueID: input.VenueID, Slug: slug, Title: input.Title,
		Subcategory: input.Subcategory, Description: input.Description,
		CoverImage: input.CoverImage, Status: input.Status,
		TicketingMode: input.TicketingMode, StartAt: input.StartAt, EndAt: input.EndAt,
		Timezone: input.Timezone, IsFeatured: false, IsTrending: false,
		IsRecommended: false, Popularity: 50, LimitedAvailability: false,
		IsEarlyBird: false, CreatedAt: time.Now(), UpdatedAt: time.Now(),
		Gallery:    jsonValueOrEmpty([]string{input.CoverImage}),
		Tags:       jsonValueOrEmpty([]string{}),
		Highlights: jsonValueOrEmpty(input.Highlights),
		Schedule:   jsonValueOrEmpty([]ScheduleItem{}),
		Terms:      jsonValueOrEmpty(input.Terms),
	}
	if input.AgeNote != "" {
		event.AgeNote = &input.AgeNote
	}
	if input.Accessibility != "" {
		event.AccessibilityNote = &input.Accessibility
	}
	ticket := TicketType{
		ID: id + "-regular", EventID: id, Name: "Regular", Description: "General admission",
		Price: input.BasePrice, Currency: "IDR", Quota: 200, SoldCount: 0,
		MinPerOrder: 1, MaxPerOrder: 6, SalesStartAt: time.Now(),
		SalesEndAt: input.StartAt.Add(-48 * time.Hour), Benefits: jsonValueOrEmpty([]string{"Entry"}),
		Status: "ACTIVE", Kind: "GENERAL_ADMISSION",
	}
	if err := s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&event).Error; err != nil {
			return err
		}
		return tx.Create(&ticket).Error
	}); err != nil {
		return Event{}, err
	}
	event.TicketTypes = []TicketType{ticket}
	return event, nil
}

func (s *Service) UpdateEvent(ctx context.Context, organizationID, eventID string, input EventInput) (Event, error) {
	var event Event
	if err := s.db.WithContext(ctx).Where("id = ? AND organization_id = ?", eventID, organizationID).First(&event).Error; err != nil {
		return Event{}, err
	}
	if input.Title != "" {
		event.Title = input.Title
	}
	if input.CategoryID != "" {
		event.CategoryID = input.CategoryID
	}
	if input.VenueID != "" {
		event.VenueID = input.VenueID
	}
	if !input.StartAt.IsZero() {
		event.StartAt = input.StartAt
	}
	if !input.EndAt.IsZero() {
		event.EndAt = input.EndAt
	}
	if input.Timezone != "" {
		event.Timezone = input.Timezone
	}
	if input.TicketingMode != "" {
		event.TicketingMode = input.TicketingMode
	}
	if input.Description != "" {
		event.Description = input.Description
	}
	if input.CoverImage != "" {
		event.CoverImage = input.CoverImage
	}
	if input.Status != "" {
		if !allowedStatusTransition(event.Status, input.Status) {
			return Event{}, fmt.Errorf("invalid event status transition")
		}
		event.Status = input.Status
	}
	event.UpdatedAt = time.Now()
	if err := s.db.WithContext(ctx).Save(&event).Error; err != nil {
		return Event{}, err
	}
	return s.GetOrganizerEvent(ctx, organizationID, eventID)
}

func allowedStatusTransition(from, to string) bool {
	if from == to {
		return true
	}
	switch from {
	case "DRAFT":
		return to == "PUBLISHED" || to == "CANCELLED"
	case "PUBLISHED":
		return to == "PAUSED" || to == "ENDED" || to == "CANCELLED"
	case "PAUSED":
		return to == "PUBLISHED" || to == "CANCELLED"
	case "ENDED":
		return to == "CANCELLED"
	default:
		return false
	}
}

func jsonValueOrEmpty(value any) datatypes.JSON {
	raw, err := json.Marshal(value)
	if err != nil {
		return datatypes.JSON([]byte("[]"))
	}
	return datatypes.JSON(raw)
}

func slugify(value string) string {
	value = strings.ToLower(strings.TrimSpace(value))
	var builder strings.Builder
	lastDash := false
	for _, char := range value {
		switch {
		case char >= 'a' && char <= 'z', char >= '0' && char <= '9':
			builder.WriteRune(char)
			lastDash = false
		case !lastDash:
			builder.WriteByte('-')
			lastDash = true
		}
	}
	return strings.Trim(builder.String(), "-")
}
