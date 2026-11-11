package inventory

import "time"

type Bucket struct {
	ID           string `gorm:"column:id;primaryKey"`
	TicketTypeID string `gorm:"column:ticket_type_id"`
	Capacity     int    `gorm:"column:capacity"`
	Reserved     int    `gorm:"column:reserved"`
	Sold         int    `gorm:"column:sold"`
}

func (Bucket) TableName() string { return "inventory_buckets" }

type Reservation struct {
	ID           string            `json:"id" gorm:"column:id;primaryKey"`
	PrincipalKey string            `json:"principal_key" gorm:"column:principal_key"`
	Status       string            `json:"status" gorm:"column:status"`
	ExpiresAt    time.Time         `json:"expires_at" gorm:"column:expires_at"`
	CreatedAt    time.Time         `json:"created_at" gorm:"column:created_at"`
	UpdatedAt    time.Time         `json:"updated_at" gorm:"column:updated_at"`
	Items        []ReservationItem `json:"items" gorm:"foreignKey:ReservationID"`
}

func (Reservation) TableName() string { return "inventory_reservations" }

type ReservationItem struct {
	ID            string  `json:"id" gorm:"column:id;primaryKey"`
	ReservationID string  `json:"reservation_id" gorm:"column:reservation_id"`
	TicketTypeID  string  `json:"ticket_type_id" gorm:"column:ticket_type_id"`
	Quantity      int     `json:"quantity" gorm:"column:quantity"`
	SeatID        *string `json:"seat_id,omitempty" gorm:"column:seat_id"`
}

func (ReservationItem) TableName() string { return "inventory_reservation_items" }

type SeatClaim struct {
	ID            string    `gorm:"column:id;primaryKey"`
	EventID       string    `gorm:"column:event_id"`
	SeatID        string    `gorm:"column:seat_id"`
	ReservationID string    `gorm:"column:reservation_id"`
	Status        string    `gorm:"column:status"`
	CreatedAt     time.Time `gorm:"column:created_at"`
}

func (SeatClaim) TableName() string { return "seat_claims" }
