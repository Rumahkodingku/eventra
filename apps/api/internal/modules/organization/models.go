package organization

import "time"

type Settings struct {
	OrganizationID string    `json:"-" gorm:"column:organization_id;primaryKey"`
	DisplayName    string    `json:"display_name" gorm:"column:display_name"`
	Description    string    `json:"description" gorm:"column:description"`
	Logo           string    `json:"logo" gorm:"column:logo"`
	Email          string    `json:"email" gorm:"column:email"`
	Phone          string    `json:"phone" gorm:"column:phone"`
	Website        string    `json:"website" gorm:"column:website"`
	Instagram      string    `json:"instagram" gorm:"column:instagram"`
	TikTok         string    `json:"tiktok" gorm:"column:tiktok"`
	OrderUpdates   bool      `json:"order_updates" gorm:"column:order_updates"`
	EventReminders bool      `json:"event_reminders" gorm:"column:event_reminders"`
	Newsletter     bool      `json:"newsletter" gorm:"column:newsletter"`
	UpdatedAt      time.Time `json:"updated_at" gorm:"column:updated_at"`
}

func (Settings) TableName() string { return "organization_settings" }

type Response struct {
	Settings
	PayoutStatus  string `json:"payout_status"`
	PayoutBank    string `json:"payout_bank"`
	PayoutAccount string `json:"payout_account"`
}
