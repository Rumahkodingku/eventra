package notification

import (
	"context"
	"errors"
	"time"

	"github.com/oklog/ulid/v2"
	"gorm.io/gorm"
)

var ErrNotFound = errors.New("notification not found")

type Service struct {
	db  *gorm.DB
	now func() time.Time
}

func NewService(db *gorm.DB) *Service {
	return &Service{db: db, now: time.Now}
}

func (s *Service) CreateTx(ctx context.Context, tx *gorm.DB, userID *string, kind, title, message, targetURL string) error {
	if userID == nil {
		return nil
	}
	var target *string
	if targetURL != "" {
		target = &targetURL
	}
	return tx.WithContext(ctx).Create(&Notification{
		ID: ulid.Make().String(), UserID: userID, Type: kind,
		Title: title, Message: message, TargetURL: target, CreatedAt: s.now(),
	}).Error
}

func (s *Service) List(ctx context.Context, userID string) ([]Notification, error) {
	var items []Notification
	err := s.db.WithContext(ctx).
		Where("user_id = ?", userID).
		Order("created_at DESC").
		Limit(100).
		Find(&items).Error
	return items, err
}

func (s *Service) MarkRead(ctx context.Context, userID, id string) error {
	result := s.db.WithContext(ctx).Model(&Notification{}).
		Where("id = ? AND user_id = ?", id, userID).
		Update("read_at", s.now())
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrNotFound
	}
	return nil
}

func (s *Service) MarkAllRead(ctx context.Context, userID string) error {
	return s.db.WithContext(ctx).Model(&Notification{}).
		Where("user_id = ? AND read_at IS NULL", userID).
		Update("read_at", s.now()).Error
}
