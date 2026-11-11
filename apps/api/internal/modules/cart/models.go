package cart

import (
	"time"

	"gorm.io/datatypes"
)

type Cart struct {
	ID           string     `json:"id" gorm:"column:id;primaryKey"`
	PrincipalKey string     `json:"-" gorm:"column:principal_key"`
	PromoCode    *string    `json:"promo_code,omitempty" gorm:"column:promo_code"`
	CreatedAt    time.Time  `json:"created_at" gorm:"column:created_at"`
	UpdatedAt    time.Time  `json:"updated_at" gorm:"column:updated_at"`
	Items        []CartItem `json:"items" gorm:"foreignKey:CartID"`
}

func (Cart) TableName() string { return "carts" }

type CartItem struct {
	ID                string         `json:"id" gorm:"column:id;primaryKey"`
	CartID            string         `json:"-" gorm:"column:cart_id"`
	EventID           string         `json:"event_id" gorm:"column:event_id"`
	TicketTypeID      string         `json:"ticket_type_id" gorm:"column:ticket_type_id"`
	Quantity          int            `json:"quantity" gorm:"column:quantity"`
	SeatIDs           datatypes.JSON `json:"seat_ids" gorm:"column:seat_ids"`
	UnitPriceSnapshot int64          `json:"unit_price_snapshot" gorm:"column:unit_price_snapshot"`
	AddedAt           time.Time      `json:"added_at" gorm:"column:added_at"`
}

func (CartItem) TableName() string { return "cart_items" }

type Promotion struct {
	ID                  string         `json:"id" gorm:"column:id;primaryKey"`
	Code                string         `json:"code" gorm:"column:code"`
	Type                string         `json:"type" gorm:"column:type"`
	Value               int64          `json:"value" gorm:"column:value"`
	StartsAt            time.Time      `json:"starts_at" gorm:"column:starts_at"`
	EndsAt              time.Time      `json:"ends_at" gorm:"column:ends_at"`
	MinimumSpend        *int64         `json:"minimum_spend,omitempty" gorm:"column:minimum_spend"`
	MaxDiscount         *int64         `json:"max_discount,omitempty" gorm:"column:max_discount"`
	EligibleEventIDs    datatypes.JSON `json:"eligible_event_ids,omitempty" gorm:"column:eligible_event_ids"`
	EligibleCategoryIDs datatypes.JSON `json:"eligible_category_ids,omitempty" gorm:"column:eligible_category_ids"`
	UsageLimit          *int           `json:"usage_limit,omitempty" gorm:"column:usage_limit"`
	IsActive            bool           `json:"is_active" gorm:"column:is_active"`
}

func (Promotion) TableName() string { return "promotions" }

type ReservationView struct {
	ID        string    `json:"id"`
	Status    string    `json:"status"`
	ExpiresAt time.Time `json:"expires_at"`
}
