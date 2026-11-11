package analytics

import (
	"context"
	"time"

	"gorm.io/gorm"
)

type Summary struct {
	TotalEvents     int64 `json:"total_events"`
	ActiveEvents    int64 `json:"active_events"`
	TicketsSold     int64 `json:"tickets_sold"`
	Revenue         int64 `json:"revenue"`
	Attendees       int64 `json:"attendees"`
	CheckedIn       int64 `json:"checked_in"`
	ConfirmedOrders int64 `json:"confirmed_orders"`
}

type EventRow struct {
	EventID     string    `json:"event_id"`
	Title       string    `json:"title"`
	Status      string    `json:"status"`
	StartAt     time.Time `json:"start_at"`
	TicketsSold int64     `json:"tickets_sold"`
	Revenue     int64     `json:"revenue"`
	Attendees   int64     `json:"attendees"`
	CheckedIn   int64     `json:"checked_in"`
}

type Report struct {
	Summary Summary    `json:"summary"`
	Events  []EventRow `json:"events"`
}

type Service struct {
	db *gorm.DB
}

func NewService(db *gorm.DB) *Service {
	return &Service{db: db}
}

func (s *Service) Report(ctx context.Context, organizationID, eventID string) (Report, error) {
	var eventRows []EventRow
	query := s.db.WithContext(ctx).Table("events").
		Select("events.id AS event_id, events.title, events.status, events.start_at").
		Where("events.organization_id = ?", organizationID)
	if eventID != "" {
		query = query.Where("events.id = ?", eventID)
	}
	if err := query.Order("events.start_at ASC").Scan(&eventRows).Error; err != nil {
		return Report{}, err
	}
	for index := range eventRows {
		if err := s.fillEventStats(ctx, &eventRows[index]); err != nil {
			return Report{}, err
		}
	}
	report := Report{Events: eventRows}
	for _, row := range eventRows {
		report.Summary.TotalEvents++
		if row.Status == "PUBLISHED" {
			report.Summary.ActiveEvents++
		}
		report.Summary.TicketsSold += row.TicketsSold
		report.Summary.Revenue += row.Revenue
		report.Summary.Attendees += row.Attendees
		report.Summary.CheckedIn += row.CheckedIn
	}
	if err := s.db.WithContext(ctx).Table("orders").
		Joins("JOIN order_items ON order_items.order_id = orders.id").
		Joins("JOIN events ON events.id = order_items.event_id").
		Where("events.organization_id = ? AND orders.order_status = ?", organizationID, "CONFIRMED").
		Distinct("orders.id").Count(&report.Summary.ConfirmedOrders).Error; err != nil {
		return Report{}, err
	}
	return report, nil
}

func (s *Service) fillEventStats(ctx context.Context, row *EventRow) error {
	type stats struct {
		TicketsSold int64
		Revenue     int64
	}
	var orderStats stats
	if err := s.db.WithContext(ctx).Table("order_items").
		Select("COALESCE(SUM(order_items.quantity), 0) AS tickets_sold, COALESCE(SUM(order_items.line_subtotal), 0) AS revenue").
		Joins("JOIN orders ON orders.id = order_items.order_id").
		Where("order_items.event_id = ? AND orders.order_status = ?", row.EventID, "CONFIRMED").
		Scan(&orderStats).Error; err != nil {
		return err
	}
	row.TicketsSold = orderStats.TicketsSold
	row.Revenue = orderStats.Revenue
	if err := s.db.WithContext(ctx).Table("attendees").
		Joins("JOIN orders ON orders.id = attendees.order_id").
		Joins("JOIN order_items ON order_items.order_id = orders.id AND order_items.event_id = ?", row.EventID).
		Where("orders.order_status = ?", "CONFIRMED").
		Distinct("attendees.id").Count(&row.Attendees).Error; err != nil {
		return err
	}
	return s.db.WithContext(ctx).Model(&struct{}{}).Table("tickets").
		Where("event_id = ? AND checked_in_at IS NOT NULL", row.EventID).
		Count(&row.CheckedIn).Error
}
