package catalog

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/oklog/ulid/v2"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

var ErrEventHasOrders = errors.New("event has orders; cancel it instead")

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

func (s *Service) ListOrganizers(ctx context.Context) ([]Organizer, error) {
	var rows []Organizer
	err := s.db.WithContext(ctx).Table("organizations").
		Select("id, name AS display_name, '' AS description, '' AS logo, '' AS email").
		Order("name ASC").Scan(&rows).Error
	return rows, err
}

func (s *Service) ListVenues(ctx context.Context) ([]Venue, error) {
	var venues []Venue
	err := s.db.WithContext(ctx).Order("name ASC").Find(&venues).Error
	return venues, err
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
	if err := query.Limit(limit).Find(&events).Error; err != nil {
		return nil, err
	}
	s.attachLayouts(ctx, events)
	return events, nil
}

func (s *Service) attachLayouts(ctx context.Context, events []Event) {
	for index := range events {
		if events[index].LayoutID == nil {
			continue
		}
		if layout, err := s.getLayout(ctx, *events[index].LayoutID); err == nil {
			events[index].SeatLayout = &layout
		}
	}
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

func (s *Service) Availability(ctx context.Context, eventID string) (map[string]int, error) {
	type row struct {
		TicketTypeID string
		Remaining    int
	}
	var rows []row
	err := s.db.WithContext(ctx).
		Table("inventory_buckets").
		Select("inventory_buckets.ticket_type_id, GREATEST(inventory_buckets.capacity - inventory_buckets.sold - inventory_buckets.reserved, 0) AS remaining").
		Joins("JOIN ticket_types ON ticket_types.id = inventory_buckets.ticket_type_id").
		Where("ticket_types.event_id = ?", eventID).
		Scan(&rows).Error
	if err != nil {
		return nil, err
	}
	result := make(map[string]int, len(rows))
	for _, item := range rows {
		result[item.TicketTypeID] = item.Remaining
	}
	return result, nil
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
	if err != nil {
		return nil, err
	}
	s.attachLayouts(ctx, events)
	return events, nil
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
	Title         string             `json:"title"`
	CategoryID    string             `json:"category_id"`
	VenueID       string             `json:"venue_id"`
	StartAt       time.Time          `json:"start_at"`
	EndAt         time.Time          `json:"end_at"`
	Timezone      string             `json:"timezone"`
	TicketingMode string             `json:"ticketing_mode"`
	Description   string             `json:"description"`
	CoverImage    string             `json:"cover_image"`
	Status        string             `json:"status"`
	BasePrice     int64              `json:"base_price"`
	Subcategory   string             `json:"subcategory"`
	Gallery       []string           `json:"gallery"`
	Highlights    []string           `json:"highlights"`
	Schedule      []ScheduleItem     `json:"schedule"`
	Terms         []string           `json:"terms"`
	AgeNote       string             `json:"age_note"`
	Accessibility string             `json:"accessibility_note"`
	TicketTypes   *[]TicketTypeInput `json:"ticket_types,omitempty"`
}

type TicketTypeInput struct {
	ID           string    `json:"id"`
	Name         string    `json:"name"`
	Description  string    `json:"description"`
	Price        int64     `json:"price"`
	Quota        int       `json:"quota"`
	MinPerOrder  int       `json:"min_per_order"`
	MaxPerOrder  int       `json:"max_per_order"`
	SalesStartAt time.Time `json:"sales_start_at"`
	SalesEndAt   time.Time `json:"sales_end_at"`
	Benefits     []string  `json:"benefits"`
	Status       string    `json:"status"`
	Kind         string    `json:"kind"`
	TierKey      string    `json:"tier_key"`
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
	if input.Status != "DRAFT" && input.Status != "PUBLISHED" {
		return Event{}, fmt.Errorf("status must be DRAFT or PUBLISHED")
	}
	id := ulid.Make().String()
	slug := slugify(input.Title) + "-" + strings.ToLower(id[len(id)-4:])
	gallery := input.Gallery
	if len(gallery) == 0 && input.CoverImage != "" {
		gallery = []string{input.CoverImage}
	}
	schedule := input.Schedule
	if schedule == nil {
		schedule = []ScheduleItem{}
	}
	event := Event{
		ID: id, OrganizationID: organizationID, CategoryID: input.CategoryID,
		VenueID: input.VenueID, Slug: slug, Title: input.Title,
		Subcategory: input.Subcategory, Description: input.Description,
		CoverImage: input.CoverImage, Status: input.Status,
		TicketingMode: input.TicketingMode, StartAt: input.StartAt, EndAt: input.EndAt,
		Timezone: input.Timezone, IsFeatured: false, IsTrending: false,
		IsRecommended: false, Popularity: 50, LimitedAvailability: false,
		IsEarlyBird: false, CreatedAt: time.Now(), UpdatedAt: time.Now(),
		Gallery:    jsonValueOrEmpty(gallery),
		Tags:       jsonValueOrEmpty([]string{}),
		Highlights: jsonValueOrEmpty(input.Highlights),
		Schedule:   jsonValueOrEmpty(schedule),
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
	err := s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var event Event
		if err := tx.Where("id = ? AND organization_id = ?", eventID, organizationID).First(&event).Error; err != nil {
			return err
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
		if input.Gallery != nil {
			event.Gallery = jsonValueOrEmpty(input.Gallery)
		}
		if input.Highlights != nil {
			event.Highlights = jsonValueOrEmpty(input.Highlights)
		}
		if input.Schedule != nil {
			event.Schedule = jsonValueOrEmpty(input.Schedule)
		}
		if input.Terms != nil {
			event.Terms = jsonValueOrEmpty(input.Terms)
		}
		if input.Subcategory != "" {
			event.Subcategory = input.Subcategory
		}
		if input.AgeNote != "" {
			event.AgeNote = &input.AgeNote
		}
		if input.Accessibility != "" {
			event.AccessibilityNote = &input.Accessibility
		}
		if input.Status != "" {
			if !allowedStatusTransition(event.Status, input.Status) {
				return fmt.Errorf("invalid event status transition")
			}
			event.Status = input.Status
		}
		event.UpdatedAt = time.Now()
		if err := tx.Save(&event).Error; err != nil {
			return err
		}
		if input.TicketTypes != nil {
			return syncTicketTypes(tx, eventID, *input.TicketTypes)
		}
		return nil
	})
	if err != nil {
		return Event{}, err
	}
	return s.GetOrganizerEvent(ctx, organizationID, eventID)
}

func syncTicketTypes(tx *gorm.DB, eventID string, inputs []TicketTypeInput) error {
	var existing []TicketType
	if err := tx.Where("event_id = ?", eventID).Find(&existing).Error; err != nil {
		return err
	}
	existingByID := make(map[string]TicketType, len(existing))
	for _, ticket := range existing {
		existingByID[ticket.ID] = ticket
	}
	kept := make(map[string]bool, len(inputs))
	for _, input := range inputs {
		if input.Name == "" || input.Quota <= 0 {
			return fmt.Errorf("ticket name and quota are required")
		}
		id := input.ID
		if id == "" {
			id = eventID + "-" + strings.ToLower(ulid.Make().String()[:6])
		}
		kept[id] = true
		tierKey := input.TierKey
		var tierKeyPtr *string
		if tierKey != "" {
			tierKeyPtr = &tierKey
		}
		status := input.Status
		if status == "" {
			status = "ACTIVE"
		}
		kind := input.Kind
		if kind == "" {
			kind = "GENERAL_ADMISSION"
		}
		benefits := jsonValueOrEmpty(input.Benefits)
		if current, ok := existingByID[id]; ok {
			if err := tx.Model(&TicketType{}).Where("id = ? AND event_id = ?", id, eventID).Updates(map[string]any{
				"name": input.Name, "description": input.Description, "price": input.Price,
				"quota": input.Quota, "min_per_order": input.MinPerOrder,
				"max_per_order": input.MaxPerOrder, "sales_start_at": input.SalesStartAt,
				"sales_end_at": input.SalesEndAt, "benefits": benefits,
				"status": status, "kind": kind, "tier_key": tierKeyPtr,
			}).Error; err != nil {
				return err
			}
			if err := upsertBucket(tx, id, input.Quota, current.SoldCount); err != nil {
				return err
			}
			continue
		}
		ticket := TicketType{
			ID: id, EventID: eventID, Name: input.Name, Description: input.Description,
			Price: input.Price, Currency: "IDR", Quota: input.Quota, SoldCount: 0,
			MinPerOrder: input.MinPerOrder, MaxPerOrder: input.MaxPerOrder,
			SalesStartAt: input.SalesStartAt, SalesEndAt: input.SalesEndAt,
			Benefits: benefits, Status: status, Kind: kind, TierKey: tierKeyPtr,
		}
		if err := tx.Create(&ticket).Error; err != nil {
			return err
		}
		if err := upsertBucket(tx, id, input.Quota, 0); err != nil {
			return err
		}
	}
	for _, ticket := range existing {
		if kept[ticket.ID] {
			continue
		}
		var references int64
		for _, table := range []string{"order_items", "inventory_reservation_items", "cart_items"} {
			if err := tx.Table(table).Where("ticket_type_id = ?", ticket.ID).Count(&references).Error; err != nil {
				return err
			}
			if references > 0 {
				break
			}
		}
		if references > 0 {
			continue
		}
		if err := tx.Exec("DELETE FROM inventory_buckets WHERE ticket_type_id = ?", ticket.ID).Error; err != nil {
			return err
		}
		if err := tx.Where("id = ? AND event_id = ?", ticket.ID, eventID).Delete(&TicketType{}).Error; err != nil {
			return err
		}
	}
	return nil
}

func upsertBucket(tx *gorm.DB, ticketTypeID string, quota, sold int) error {
	var bucket struct {
		ID       string
		Capacity int
		Sold     int
		Reserved int
	}
	err := tx.Table("inventory_buckets").
		Select("id, capacity, sold, reserved").
		Where("ticket_type_id = ?", ticketTypeID).
		First(&bucket).Error
	if err == gorm.ErrRecordNotFound {
		return tx.Exec(
			"INSERT INTO inventory_buckets (id, ticket_type_id, capacity, reserved, sold) VALUES (?, ?, ?, 0, ?)",
			ulid.Make().String(), ticketTypeID, quota, sold,
		).Error
	}
	if err != nil {
		return err
	}
	if quota < bucket.Sold+bucket.Reserved {
		return fmt.Errorf("ticket quota cannot be lower than sold plus reserved")
	}
	return tx.Exec("UPDATE inventory_buckets SET capacity = ? WHERE id = ?", quota, bucket.ID).Error
}

func (s *Service) DeleteEvent(ctx context.Context, organizationID, eventID string) error {
	return s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var event Event
		if err := tx.Where("id = ? AND organization_id = ?", eventID, organizationID).
			First(&event).Error; err != nil {
			return err
		}
		var orderCount int64
		if err := tx.Table("order_items").
			Joins("JOIN orders ON orders.id = order_items.order_id").
			Where("order_items.event_id = ? AND orders.order_status = ?", eventID, "CONFIRMED").
			Count(&orderCount).Error; err != nil {
			return err
		}
		if orderCount > 0 {
			return ErrEventHasOrders
		}
		var ticketCount int64
		if err := tx.Model(&struct{}{}).Table("tickets").Where("event_id = ?", eventID).
			Count(&ticketCount).Error; err != nil {
			return err
		}
		if ticketCount > 0 {
			return ErrEventHasOrders
		}
		statements := []string{
			"DELETE FROM cart_items WHERE event_id = ?",
			"DELETE FROM inventory_reservation_items WHERE ticket_type_id IN (SELECT id FROM ticket_types WHERE event_id = ?)",
			"DELETE FROM inventory_buckets WHERE ticket_type_id IN (SELECT id FROM ticket_types WHERE event_id = ?)",
			"DELETE FROM seat_claims WHERE event_id = ?",
		}
		for _, statement := range statements {
			if err := tx.Exec(statement, eventID).Error; err != nil {
				return err
			}
		}
		return tx.Where("id = ? AND organization_id = ?", eventID, organizationID).Delete(&Event{}).Error
	})
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
