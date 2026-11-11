package wishlist

import "time"

type Item struct {
	ID        string    `json:"id" gorm:"column:id;primaryKey"`
	UserID    string    `json:"user_id" gorm:"column:user_id"`
	EventID   string    `json:"event_id" gorm:"column:event_id"`
	CreatedAt time.Time `json:"created_at" gorm:"column:created_at"`
}

func (Item) TableName() string { return "wishlist_items" }
