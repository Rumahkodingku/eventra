package wishlist

import (
	"context"
	"time"

	"github.com/oklog/ulid/v2"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type Service struct {
	db  *gorm.DB
	now func() time.Time
}

func NewService(db *gorm.DB) *Service {
	return &Service{db: db, now: time.Now}
}

func (s *Service) List(ctx context.Context, userID string) ([]string, error) {
	var items []Item
	if err := s.db.WithContext(ctx).Where("user_id = ?", userID).
		Order("created_at DESC").Find(&items).Error; err != nil {
		return nil, err
	}
	eventIDs := make([]string, 0, len(items))
	for _, item := range items {
		eventIDs = append(eventIDs, item.EventID)
	}
	return eventIDs, nil
}

func (s *Service) Add(ctx context.Context, userID, eventID string) error {
	return s.db.WithContext(ctx).Clauses(clause.OnConflict{DoNothing: true}).
		Create(&Item{
			ID: ulid.Make().String(), UserID: userID, EventID: eventID, CreatedAt: s.now(),
		}).Error
}

func (s *Service) Remove(ctx context.Context, userID, eventID string) error {
	return s.db.WithContext(ctx).Where("user_id = ? AND event_id = ?", userID, eventID).
		Delete(&Item{}).Error
}

func (s *Service) Clear(ctx context.Context, userID string) error {
	return s.db.WithContext(ctx).Where("user_id = ?", userID).Delete(&Item{}).Error
}
