package ticket

import "time"

type Ticket struct {
	ID           string     `json:"id" gorm:"column:id;primaryKey"`
	TicketCode   string     `json:"ticket_code" gorm:"column:ticket_code"`
	QRTokenHash  string     `json:"-" gorm:"column:qr_token_hash"`
	OrderID      string     `json:"order_id" gorm:"column:order_id"`
	EventID      string     `json:"event_id" gorm:"column:event_id"`
	TicketTypeID string     `json:"ticket_type_id" gorm:"column:ticket_type_id"`
	AttendeeID   string     `json:"attendee_id" gorm:"column:attendee_id"`
	SeatID       *string    `json:"seat_id,omitempty" gorm:"column:seat_id"`
	Status       string     `json:"status" gorm:"column:status"`
	IssuedAt     time.Time  `json:"issued_at" gorm:"column:issued_at"`
	CheckedInAt  *time.Time `json:"checked_in_at,omitempty" gorm:"column:checked_in_at"`
}

func (Ticket) TableName() string { return "tickets" }

type CheckIn struct {
	ID             string    `json:"id" gorm:"column:id;primaryKey"`
	TicketID       string    `json:"ticket_id" gorm:"column:ticket_id"`
	EventID        string    `json:"event_id" gorm:"column:event_id"`
	OperatorUserID string    `json:"operator_user_id" gorm:"column:operator_user_id"`
	CheckedInAt    time.Time `json:"checked_in_at" gorm:"column:checked_in_at"`
}

func (CheckIn) TableName() string { return "ticket_checkins" }

type orderItem struct {
	ID           string `gorm:"column:id"`
	OrderID      string `gorm:"column:order_id"`
	EventID      string `gorm:"column:event_id"`
	TicketTypeID string `gorm:"column:ticket_type_id"`
	SeatIDs      []byte `gorm:"column:seat_ids"`
	AttendeeIDs  []byte `gorm:"column:attendee_ids"`
}

func (orderItem) TableName() string { return "order_items" }

type attendeeRow struct {
	ID       string  `gorm:"column:id"`
	OrderID  string  `gorm:"column:order_id"`
	TicketID *string `gorm:"column:ticket_id"`
}

func (attendeeRow) TableName() string { return "attendees" }
