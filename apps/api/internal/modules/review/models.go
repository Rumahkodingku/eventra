package review

import "time"

type Review struct {
	ID         string    `json:"id" gorm:"column:id;primaryKey"`
	EventID    string    `json:"event_id" gorm:"column:event_id"`
	UserID     string    `json:"user_id" gorm:"column:user_id"`
	AuthorName string    `json:"author_name" gorm:"column:author_name"`
	Rating     int       `json:"rating" gorm:"column:rating"`
	Comment    string    `json:"comment" gorm:"column:comment"`
	CreatedAt  time.Time `json:"created_at" gorm:"column:created_at"`
}

func (Review) TableName() string { return "reviews" }
