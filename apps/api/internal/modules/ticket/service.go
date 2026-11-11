package ticket

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"time"

	"github.com/oklog/ulid/v2"
	"gorm.io/gorm"
)

var (
	ErrNotFound    = errors.New("ticket not found")
	ErrForbidden   = errors.New("ticket forbidden")
	ErrAlreadyUsed = errors.New("ticket already used")
)

type Service struct {
	db  *gorm.DB
	now func() time.Time
}

func NewService(db *gorm.DB) *Service {
	return &Service{db: db, now: time.Now}
}

func (s *Service) IssueTx(ctx context.Context, tx *gorm.DB, orderID string) error {
	var count int64
	if err := tx.Model(&Ticket{}).Where("order_id = ?", orderID).Count(&count).Error; err != nil {
		return err
	}
	if count > 0 {
		return nil
	}
	var items []orderItem
	if err := tx.Where("order_id = ?", orderID).Find(&items).Error; err != nil {
		return err
	}
	for _, item := range items {
		var attendeeIDs []string
		var seatIDs []string
		_ = json.Unmarshal(item.AttendeeIDs, &attendeeIDs)
		_ = json.Unmarshal(item.SeatIDs, &seatIDs)
		for index, attendeeID := range attendeeIDs {
			code := "TKT-" + ulid.Make().String()
			hash := sha256.Sum256([]byte(code))
			var seatID *string
			if index < len(seatIDs) {
				seatID = &seatIDs[index]
			}
			ticket := Ticket{
				ID: ulid.Make().String(), TicketCode: code,
				QRTokenHash: hex.EncodeToString(hash[:]), OrderID: orderID,
				EventID: item.EventID, TicketTypeID: item.TicketTypeID,
				AttendeeID: attendeeID, SeatID: seatID, Status: "VALID", IssuedAt: s.now(),
			}
			if err := tx.Create(&ticket).Error; err != nil {
				return err
			}
			if err := tx.Model(&attendeeRow{}).Where("id = ?", attendeeID).Update("ticket_id", ticket.ID).Error; err != nil {
				return err
			}
		}
	}
	return nil
}

func (s *Service) List(ctx context.Context, principal string) ([]Ticket, error) {
	var tickets []Ticket
	err := s.db.WithContext(ctx).
		Table("tickets").
		Joins("JOIN orders ON orders.id = tickets.order_id").
		Where("orders.principal_key = ?", principal).
		Order("tickets.issued_at DESC").
		Find(&tickets).Error
	return tickets, err
}

func (s *Service) Get(ctx context.Context, principal, id string) (Ticket, error) {
	var ticket Ticket
	err := s.db.WithContext(ctx).
		Table("tickets").
		Joins("JOIN orders ON orders.id = tickets.order_id").
		Where("tickets.id = ? AND orders.principal_key = ?", id, principal).
		First(&ticket).Error
	if err != nil {
		return Ticket{}, ErrNotFound
	}
	return ticket, nil
}

func (s *Service) CheckIn(ctx context.Context, eventID, organizationID, operatorID, code string) (Ticket, error) {
	var ticket Ticket
	if err := s.db.WithContext(ctx).Where("ticket_code = ? AND event_id = ?", code, eventID).First(&ticket).Error; err != nil {
		return Ticket{}, ErrNotFound
	}
	var count int64
	if err := s.db.WithContext(ctx).Table("events").
		Where("id = ? AND organization_id = ?", eventID, organizationID).
		Count(&count).Error; err != nil || count == 0 {
		return Ticket{}, ErrForbidden
	}
	result := s.db.WithContext(ctx).Model(&Ticket{}).
		Where("id = ? AND status = ?", ticket.ID, "VALID").
		Update("status", "USED")
	if result.Error != nil {
		return Ticket{}, result.Error
	}
	if result.RowsAffected == 0 {
		return Ticket{}, ErrAlreadyUsed
	}
	now := s.now()
	if err := s.db.WithContext(ctx).Model(&Ticket{}).Where("id = ?", ticket.ID).Update("checked_in_at", now).Error; err != nil {
		return Ticket{}, err
	}
	if err := s.db.WithContext(ctx).Create(&CheckIn{
		ID: ulid.Make().String(), TicketID: ticket.ID, EventID: eventID,
		OperatorUserID: operatorID, CheckedInAt: now,
	}).Error; err != nil {
		return Ticket{}, err
	}
	_ = s.db.WithContext(ctx).Model(&attendeeRow{}).Where("ticket_id = ?", ticket.ID).
		Updates(map[string]any{"check_in_status": "CHECKED_IN", "checked_in_at": now}).Error
	return s.GetByID(ctx, ticket.ID)
}

func (s *Service) GetByID(ctx context.Context, id string) (Ticket, error) {
	var ticket Ticket
	if err := s.db.WithContext(ctx).Where("id = ?", id).First(&ticket).Error; err != nil {
		return Ticket{}, ErrNotFound
	}
	return ticket, nil
}
