package inventory

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/oklog/ulid/v2"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"github.com/eventra/eventra/apps/api/internal/modules/catalog"
)

var (
	ErrConflict = errors.New("inventory conflict")
	ErrNotFound = errors.New("reservation not found")
)

type Item struct {
	TicketTypeID string
	Quantity     int
	SeatIDs      []string
}

type Service struct {
	db  *gorm.DB
	ttl time.Duration
	now func() time.Time
}

func NewService(db *gorm.DB, ttl time.Duration) *Service {
	return &Service{db: db, ttl: ttl, now: time.Now}
}

func (s *Service) Reserve(ctx context.Context, principal string, eventID string, items []Item) (Reservation, error) {
	reservation := Reservation{
		ID:           ulid.Make().String(),
		PrincipalKey: principal,
		Status:       "ACTIVE",
		ExpiresAt:    s.now().Add(s.ttl),
		CreatedAt:    s.now(),
		UpdatedAt:    s.now(),
	}
	err := s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&reservation).Error; err != nil {
			return err
		}
		for _, item := range items {
			if item.Quantity <= 0 {
				return ErrConflict
			}
			var ticket catalog.TicketType
			if err := tx.Where("id = ?", item.TicketTypeID).First(&ticket).Error; err != nil {
				return ErrConflict
			}
			if ticket.Kind == "GENERAL_ADMISSION" {
				var bucket Bucket
				if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
					Where("ticket_type_id = ?", ticket.ID).First(&bucket).Error; err != nil {
					return ErrConflict
				}
				if bucket.Reserved+bucket.Sold+item.Quantity > bucket.Capacity {
					return ErrConflict
				}
				if err := tx.Model(&bucket).Update("reserved", gorm.Expr("reserved + ?", item.Quantity)).Error; err != nil {
					return err
				}
				if err := tx.Create(&ReservationItem{
					ID: ulid.Make().String(), ReservationID: reservation.ID,
					TicketTypeID: ticket.ID, Quantity: item.Quantity,
				}).Error; err != nil {
					return err
				}
				continue
			}

			if len(item.SeatIDs) == 0 {
				return ErrConflict
			}
			for _, seatID := range item.SeatIDs {
				if err := s.ensureSeatBelongsToEvent(tx, eventID, seatID); err != nil {
					return ErrConflict
				}
				claim := SeatClaim{
					ID: ulid.Make().String(), EventID: eventID, SeatID: seatID,
					ReservationID: reservation.ID, Status: "HELD", CreatedAt: s.now(),
				}
				if err := tx.Create(&claim).Error; err != nil {
					return ErrConflict
				}
				if err := tx.Create(&ReservationItem{
					ID: ulid.Make().String(), ReservationID: reservation.ID,
					TicketTypeID: ticket.ID, Quantity: 1, SeatID: &seatID,
				}).Error; err != nil {
					return err
				}
			}
		}
		return nil
	})
	if err != nil {
		return Reservation{}, err
	}
	return s.Get(ctx, reservation.ID)
}

func (s *Service) Get(ctx context.Context, id string) (Reservation, error) {
	var reservation Reservation
	if err := s.db.WithContext(ctx).Preload("Items").Where("id = ?", id).First(&reservation).Error; err != nil {
		return Reservation{}, ErrNotFound
	}
	return reservation, nil
}

func (s *Service) Release(ctx context.Context, id string) error {
	return s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var reservation Reservation
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("id = ?", id).First(&reservation).Error; err != nil {
			return ErrNotFound
		}
		if reservation.Status != "ACTIVE" {
			return nil
		}
		var items []ReservationItem
		if err := tx.Where("reservation_id = ?", id).Find(&items).Error; err != nil {
			return err
		}
		for _, item := range items {
			var ticket catalog.TicketType
			if err := tx.Where("id = ?", item.TicketTypeID).First(&ticket).Error; err != nil {
				continue
			}
			if ticket.Kind == "GENERAL_ADMISSION" {
				if err := tx.Model(&Bucket{}).Where("ticket_type_id = ?", ticket.ID).
					Update("reserved", gorm.Expr("GREATEST(reserved - ?, 0)", item.Quantity)).Error; err != nil {
					return err
				}
			}
		}
		if err := tx.Where("reservation_id = ? AND status = ?", id, "HELD").Delete(&SeatClaim{}).Error; err != nil {
			return err
		}
		return tx.Model(&reservation).Updates(map[string]any{"status": "RELEASED", "updated_at": s.now()}).Error
	})
}

func (s *Service) Confirm(ctx context.Context, id string) error {
	return s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		return s.ConfirmTx(ctx, tx, id)
	})
}

func (s *Service) ConfirmTx(ctx context.Context, tx *gorm.DB, id string) error {
	{
		var reservation Reservation
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("id = ?", id).First(&reservation).Error; err != nil {
			return ErrNotFound
		}
		if reservation.Status == "CONFIRMED" {
			return nil
		}
		if reservation.Status != "ACTIVE" || reservation.ExpiresAt.Before(s.now()) {
			return ErrConflict
		}
		var items []ReservationItem
		if err := tx.Where("reservation_id = ?", id).Find(&items).Error; err != nil {
			return err
		}
		for _, item := range items {
			var ticket catalog.TicketType
			if err := tx.Where("id = ?", item.TicketTypeID).First(&ticket).Error; err != nil {
				return err
			}
			if ticket.Kind == "GENERAL_ADMISSION" {
				if err := tx.Model(&Bucket{}).Where("ticket_type_id = ?", ticket.ID).
					Updates(map[string]any{
						"reserved": gorm.Expr("GREATEST(reserved - ?, 0)", item.Quantity),
						"sold":     gorm.Expr("sold + ?", item.Quantity),
					}).Error; err != nil {
					return err
				}
			}
		}
		if err := tx.Model(&SeatClaim{}).Where("reservation_id = ? AND status = ?", id, "HELD").
			Update("status", "CONFIRMED").Error; err != nil {
			return err
		}
		return tx.Model(&reservation).Updates(map[string]any{"status": "CONFIRMED", "updated_at": s.now()}).Error
	}
}

func (s *Service) ExpireDue(ctx context.Context, limit int) (int, error) {
	if limit <= 0 {
		limit = 100
	}
	var reservations []Reservation
	if err := s.db.WithContext(ctx).
		Where("status = ? AND expires_at <= ?", "ACTIVE", s.now()).
		Limit(limit).
		Find(&reservations).Error; err != nil {
		return 0, err
	}
	count := 0
	for _, reservation := range reservations {
		if err := s.Release(ctx, reservation.ID); err == nil {
			count++
		}
	}
	return count, nil
}

func (s *Service) Available(ctx context.Context, eventID string) (map[string]int, error) {
	var tickets []catalog.TicketType
	if err := s.db.WithContext(ctx).Where("event_id = ?", eventID).Find(&tickets).Error; err != nil {
		return nil, err
	}
	result := map[string]int{}
	for _, ticket := range tickets {
		var bucket Bucket
		if err := s.db.WithContext(ctx).Where("ticket_type_id = ?", ticket.ID).First(&bucket).Error; err != nil {
			result[ticket.ID] = 0
			continue
		}
		result[ticket.ID] = max(0, bucket.Capacity-bucket.Sold-bucket.Reserved)
	}
	return result, nil
}

func (s *Service) ensureSeatBelongsToEvent(tx *gorm.DB, eventID, seatID string) error {
	var count int64
	err := tx.Table("seats").
		Joins("JOIN venue_sections ON venue_sections.id = seats.section_id").
		Joins("JOIN events ON events.layout_id = venue_sections.layout_id").
		Where("seats.id = ? AND events.id = ?", seatID, eventID).
		Count(&count).Error
	if err != nil {
		return err
	}
	if count == 0 {
		return fmt.Errorf("seat not in event layout")
	}
	return nil
}

func max(left, right int) int {
	if left > right {
		return left
	}
	return right
}
