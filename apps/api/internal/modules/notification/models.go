package notification

import "time"

type Notification struct {
	ID        string     `json:"id" gorm:"column:id;primaryKey"`
	UserID    *string    `json:"user_id,omitempty" gorm:"column:user_id"`
	Type      string     `json:"type" gorm:"column:type"`
	Title     string     `json:"title" gorm:"column:title"`
	Message   string     `json:"message" gorm:"column:message"`
	TargetURL *string    `json:"target_url,omitempty" gorm:"column:target_url"`
	ReadAt    *time.Time `json:"read_at,omitempty" gorm:"column:read_at"`
	CreatedAt time.Time  `json:"created_at" gorm:"column:created_at"`
}

func (Notification) TableName() string { return "notifications" }
