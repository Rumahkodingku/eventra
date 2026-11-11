package review

import (
	"context"
	"errors"
	"time"

	"github.com/oklog/ulid/v2"
	"gorm.io/gorm"
)

var (
	ErrNotEligible = errors.New("review requires a ticket")
	ErrDuplicate   = errors.New("review already exists")
	ErrInvalid     = errors.New("invalid review")
)

type Service struct {
	db  *gorm.DB
	now func() time.Time
}

func NewService(db *gorm.DB) *Service {
	return &Service{db: db, now: time.Now}
}

func (s *Service) List(ctx context.Context, eventID, sort string, rating int) ([]Review, error) {
	query := s.db.WithContext(ctx).Where("event_id = ?", eventID)
	if rating >= 1 && rating <= 5 {
		query = query.Where("rating = ?", rating)
	}
	switch sort {
	case "highest":
		query = query.Order("rating DESC, created_at DESC")
	case "lowest":
		query = query.Order("rating ASC, created_at DESC")
	default:
		query = query.Order("created_at DESC")
	}
	var items []Review
	err := query.Limit(100).Find(&items).Error
	return items, err
}

func (s *Service) Create(ctx context.Context, userID, eventID, authorName string, rating int, comment string) (Review, error) {
	if rating < 1 || rating > 5 || comment == "" {
		return Review{}, ErrInvalid
	}
	var ticketCount int64
	err := s.db.WithContext(ctx).
		Table("tickets").
		Joins("JOIN orders ON orders.id = tickets.order_id").
		Where("tickets.event_id = ? AND orders.user_id = ? AND tickets.status IN ?",
			eventID, userID, []string{"VALID", "USED"}).
		Count(&ticketCount).Error
	if err != nil {
		return Review{}, err
	}
	if ticketCount == 0 {
		return Review{}, ErrNotEligible
	}
	var existing int64
	if err := s.db.WithContext(ctx).Model(&Review{}).
		Where("user_id = ? AND event_id = ?", userID, eventID).
		Count(&existing).Error; err != nil {
		return Review{}, err
	}
	if existing > 0 {
		return Review{}, ErrDuplicate
	}
	if authorName == "" {
		var user struct{ Name string }
		if err := s.db.WithContext(ctx).Table("users").Select("name").
			Where("id = ?", userID).Scan(&user).Error; err != nil {
			return Review{}, err
		}
		authorName = user.Name
	}
	item := Review{
		ID: ulid.Make().String(), EventID: eventID, UserID: userID,
		AuthorName: authorName, Rating: rating, Comment: comment, CreatedAt: s.now(),
	}
	if err := s.db.WithContext(ctx).Create(&item).Error; err != nil {
		return Review{}, err
	}
	return item, nil
}
