package order

import (
	"time"

	"gorm.io/datatypes"
)

type Order struct {
	ID            string      `json:"id" gorm:"column:id;primaryKey"`
	OrderNumber   string      `json:"order_number" gorm:"column:order_number"`
	PrincipalKey  string      `json:"owner_key" gorm:"column:principal_key"`
	UserID        *string     `json:"user_id,omitempty" gorm:"column:user_id"`
	ReservationID string      `json:"-" gorm:"column:reservation_id"`
	BuyerName     string      `json:"buyer_name" gorm:"column:buyer_name"`
	BuyerEmail    string      `json:"buyer_email" gorm:"column:buyer_email"`
	BuyerPhone    string      `json:"buyer_phone" gorm:"column:buyer_phone"`
	Subtotal      int64       `json:"subtotal" gorm:"column:subtotal"`
	ServiceFee    int64       `json:"service_fee" gorm:"column:service_fee"`
	Discount      int64       `json:"discount" gorm:"column:discount"`
	Total         int64       `json:"total" gorm:"column:total"`
	Currency      string      `json:"currency" gorm:"column:currency"`
	PromoCode     *string     `json:"promo_code,omitempty" gorm:"column:promo_code"`
	PaymentMethod string      `json:"payment_method" gorm:"column:payment_method"`
	PaymentStatus string      `json:"payment_status" gorm:"column:payment_status"`
	OrderStatus   string      `json:"order_status" gorm:"column:order_status"`
	CreatedAt     time.Time   `json:"created_at" gorm:"column:created_at"`
	PaidAt        *time.Time  `json:"paid_at,omitempty" gorm:"column:paid_at"`
	Items         []OrderItem `json:"items" gorm:"foreignKey:OrderID"`
}

func (Order) TableName() string { return "orders" }

type OrderItem struct {
	ID                   string         `json:"id" gorm:"column:id;primaryKey"`
	OrderID              string         `json:"-" gorm:"column:order_id"`
	EventID              string         `json:"event_id" gorm:"column:event_id"`
	TicketTypeID         string         `json:"ticket_type_id" gorm:"column:ticket_type_id"`
	TicketNameSnapshot   string         `json:"ticket_name_snapshot" gorm:"column:ticket_name_snapshot"`
	EventTitleSnapshot   string         `json:"event_title_snapshot" gorm:"column:event_title_snapshot"`
	EventStartAtSnapshot time.Time      `json:"event_start_at_snapshot" gorm:"column:event_start_at_snapshot"`
	VenueNameSnapshot    string         `json:"venue_name_snapshot" gorm:"column:venue_name_snapshot"`
	Quantity             int            `json:"quantity" gorm:"column:quantity"`
	UnitPriceSnapshot    int64          `json:"unit_price_snapshot" gorm:"column:unit_price_snapshot"`
	LineSubtotal         int64          `json:"line_subtotal" gorm:"column:line_subtotal"`
	SeatIDs              datatypes.JSON `json:"seat_ids" gorm:"column:seat_ids"`
	AttendeeIDs          datatypes.JSON `json:"attendee_ids" gorm:"column:attendee_ids"`
}

func (OrderItem) TableName() string { return "order_items" }

type Attendee struct {
	ID            string     `json:"id" gorm:"column:id;primaryKey"`
	OrderID       string     `json:"order_id" gorm:"column:order_id"`
	TicketID      *string    `json:"ticket_id,omitempty" gorm:"column:ticket_id"`
	FullName      string     `json:"full_name" gorm:"column:full_name"`
	Email         string     `json:"email" gorm:"column:email"`
	Phone         *string    `json:"phone,omitempty" gorm:"column:phone"`
	CheckInStatus string     `json:"check_in_status" gorm:"column:check_in_status"`
	CheckedInAt   *time.Time `json:"checked_in_at,omitempty" gorm:"column:checked_in_at"`
	CreatedAt     time.Time  `json:"created_at" gorm:"column:created_at"`
}

func (Attendee) TableName() string { return "attendees" }

type Payment struct {
	ID                string    `json:"id" gorm:"column:id;primaryKey"`
	OrderID           string    `json:"order_id" gorm:"column:order_id"`
	Provider          string    `json:"provider" gorm:"column:provider"`
	ProviderReference string    `json:"provider_reference" gorm:"column:provider_reference"`
	Amount            int64     `json:"amount" gorm:"column:amount"`
	Currency          string    `json:"currency" gorm:"column:currency"`
	Status            string    `json:"status" gorm:"column:status"`
	CreatedAt         time.Time `json:"created_at" gorm:"column:created_at"`
	UpdatedAt         time.Time `json:"updated_at" gorm:"column:updated_at"`
}

func (Payment) TableName() string { return "payments" }

type PaymentEvent struct {
	ID              string         `gorm:"column:id;primaryKey"`
	PaymentID       string         `gorm:"column:payment_id"`
	Provider        string         `gorm:"column:provider"`
	ProviderEventID string         `gorm:"column:provider_event_id"`
	Status          string         `gorm:"column:status"`
	Payload         datatypes.JSON `gorm:"column:payload"`
	CreatedAt       time.Time      `gorm:"column:created_at"`
}

func (PaymentEvent) TableName() string { return "payment_events" }

type IdempotencyRecord struct {
	ID             string         `gorm:"column:id;primaryKey"`
	PrincipalKey   string         `gorm:"column:principal_key"`
	IdempotencyKey string         `gorm:"column:idempotency_key"`
	RequestHash    string         `gorm:"column:request_hash"`
	ResponseStatus int            `gorm:"column:response_status"`
	ResponseBody   datatypes.JSON `gorm:"column:response_body"`
	CreatedAt      time.Time      `gorm:"column:created_at"`
	ExpiresAt      time.Time      `gorm:"column:expires_at"`
}

func (IdempotencyRecord) TableName() string { return "idempotency_records" }
