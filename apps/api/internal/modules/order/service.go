package order

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"strings"
	"time"

	"github.com/oklog/ulid/v2"
	"gorm.io/datatypes"
	"gorm.io/gorm"

	"github.com/eventra/eventra/apps/api/internal/modules/catalog"
	"github.com/eventra/eventra/apps/api/internal/modules/inventory"
	"github.com/eventra/eventra/apps/api/internal/modules/notification"
	"github.com/eventra/eventra/apps/api/internal/modules/ticket"
)

var (
	ErrNotFound    = errors.New("not found")
	ErrConflict    = errors.New("conflict")
	ErrIdempotency = errors.New("idempotency conflict")
	ErrReservation = errors.New("reservation invalid")
)

type Service struct {
	db           *gorm.DB
	inventory    *inventory.Service
	ticket       *ticket.Service
	notification *notification.Service
	now          func() time.Time
}

type Buyer struct {
	Name  string `json:"name"`
	Email string `json:"email"`
	Phone string `json:"phone"`
}

type AttendeeInput struct {
	FullName string `json:"full_name"`
	Email    string `json:"email"`
	Phone    string `json:"phone"`
}

type CreateInput struct {
	ReservationID   string          `json:"reservation_id"`
	PaymentMethod   string          `json:"payment_method"`
	PromoCode       string          `json:"promo_code"`
	SimulateFailure bool            `json:"simulate_failure"`
	Buyer           Buyer           `json:"buyer"`
	Attendees       []AttendeeInput `json:"attendees"`
}

func NewService(db *gorm.DB, inventoryService *inventory.Service, ticketService *ticket.Service, notificationService *notification.Service) *Service {
	return &Service{db: db, inventory: inventoryService, ticket: ticketService, notification: notificationService, now: time.Now}
}

func (s *Service) Create(ctx context.Context, principal, idempotencyKey string, input CreateInput) (Order, error) {
	hash := requestHash(input)
	var existing IdempotencyRecord
	err := s.db.WithContext(ctx).Where("principal_key = ? AND idempotency_key = ?", principal, idempotencyKey).First(&existing).Error
	if err == nil {
		if existing.RequestHash != hash {
			return Order{}, ErrIdempotency
		}
		var response struct {
			OrderID string `json:"order_id"`
		}
		if err := json.Unmarshal(existing.ResponseBody, &response); err == nil && response.OrderID != "" {
			return s.Get(ctx, principal, response.OrderID)
		}
		return Order{}, ErrIdempotency
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return Order{}, err
	}

	reservation, err := s.inventory.GetForPrincipal(ctx, principal, input.ReservationID)
	if err != nil || reservation.PrincipalKey != principal || reservation.Status != "ACTIVE" || reservation.ExpiresAt.Before(s.now()) {
		return Order{}, ErrReservation
	}

	orderID := ulid.Make().String()
	orderNumber := "EVT-" + s.now().Format("2006") + "-" + strings.ToUpper(ulid.Make().String()[20:])
	order := Order{
		ID: orderID, OrderNumber: orderNumber, PrincipalKey: principal,
		UserID:        userIDFromPrincipal(principal),
		ReservationID: input.ReservationID,
		BuyerName:     input.Buyer.Name, BuyerEmail: input.Buyer.Email, BuyerPhone: input.Buyer.Phone,
		Currency: "IDR", PaymentMethod: input.PaymentMethod,
		PaymentStatus: "PROCESSING", OrderStatus: "PENDING_PAYMENT",
		CreatedAt: s.now(),
	}
	if input.PromoCode != "" {
		order.PromoCode = &input.PromoCode
	}

	var items []OrderItem
	var attendees []Attendee
	var subtotal int64
	attendeeIndex := 0
	for _, reservationItem := range reservation.Items {
		var ticket catalog.TicketType
		if err := s.db.WithContext(ctx).Where("id = ?", reservationItem.TicketTypeID).First(&ticket).Error; err != nil {
			return Order{}, ErrReservation
		}
		var event catalog.Event
		if err := s.db.WithContext(ctx).Where("id = ?", ticket.EventID).First(&event).Error; err != nil {
			return Order{}, ErrReservation
		}
		var venue catalog.Venue
		_ = s.db.WithContext(ctx).Where("id = ?", event.VenueID).First(&venue).Error
		quantity := reservationItem.Quantity
		if ticket.Kind == "SEATED" {
			quantity = 1
		}
		lineSubtotal := ticket.Price * int64(quantity)
		subtotal += lineSubtotal
		attendeeIDs := make([]string, 0, quantity)
		seatIDs := []string{}
		if reservationItem.SeatID != nil {
			seatIDs = append(seatIDs, *reservationItem.SeatID)
		}
		for index := 0; index < quantity; index++ {
			attendee := AttendeeInput{FullName: input.Buyer.Name, Email: input.Buyer.Email, Phone: input.Buyer.Phone}
			if attendeeIndex < len(input.Attendees) {
				attendee = input.Attendees[attendeeIndex]
			}
			attendeeIndex++
			id := ulid.Make().String()
			attendeeIDs = append(attendeeIDs, id)
			attendees = append(attendees, Attendee{
				ID: id, OrderID: orderID, FullName: attendee.FullName,
				Email: attendee.Email, Phone: optionalString(attendee.Phone),
				CheckInStatus: "NOT_CHECKED_IN", CreatedAt: s.now(),
			})
		}
		seatJSON, _ := json.Marshal(seatIDs)
		attendeeJSON, _ := json.Marshal(attendeeIDs)
		items = append(items, OrderItem{
			ID: ulid.Make().String(), OrderID: orderID, EventID: event.ID,
			TicketTypeID: ticket.ID, TicketNameSnapshot: ticket.Name,
			EventTitleSnapshot: event.Title, EventStartAtSnapshot: event.StartAt,
			VenueNameSnapshot: venue.Name, Quantity: quantity,
			UnitPriceSnapshot: ticket.Price, LineSubtotal: lineSubtotal,
			SeatIDs: datatypes.JSON(seatJSON), AttendeeIDs: datatypes.JSON(attendeeJSON),
		})
	}
	serviceFee := serviceFee(subtotal)
	discount, promoCode := s.discount(ctx, input.PromoCode, subtotal)
	order.Subtotal = subtotal
	order.ServiceFee = serviceFee
	order.Discount = discount
	order.Total = max64(0, subtotal+serviceFee-discount)
	if promoCode != nil {
		order.PromoCode = promoCode
	}
	payment := Payment{
		ID: ulid.Make().String(), OrderID: orderID, Provider: "mock",
		ProviderReference: "mock_" + ulid.Make().String(),
		Amount:            order.Total, Currency: order.Currency, Status: "PENDING",
		CreatedAt: s.now(), UpdatedAt: s.now(),
	}
	if err := s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&order).Error; err != nil {
			return err
		}
		if err := tx.Create(&items).Error; err != nil {
			return err
		}
		if err := tx.Create(&attendees).Error; err != nil {
			return err
		}
		return tx.Create(&payment).Error
	}); err != nil {
		return Order{}, err
	}

	status := "SUCCEEDED"
	if input.SimulateFailure {
		status = "FAILED"
	}
	if err := s.ProcessWebhook(ctx, "mock", "evt_"+ulid.Make().String(), payment.ProviderReference, status); err != nil {
		return Order{}, err
	}
	if err := s.storeIdempotency(ctx, principal, idempotencyKey, hash, orderID); err != nil {
		return Order{}, err
	}
	return s.Get(ctx, principal, orderID)
}

func (s *Service) ProcessWebhook(ctx context.Context, provider, eventID, providerReference, status string) error {
	return s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var payment Payment
		if err := tx.Where("provider = ? AND provider_reference = ?", provider, providerReference).First(&payment).Error; err != nil {
			return ErrNotFound
		}
		var existing PaymentEvent
		if err := tx.Where("provider = ? AND provider_event_id = ?", provider, eventID).First(&existing).Error; err == nil {
			return nil
		}
		payload, _ := json.Marshal(map[string]string{"status": status, "reference": providerReference})
		if err := tx.Create(&PaymentEvent{
			ID: ulid.Make().String(), PaymentID: payment.ID, Provider: provider,
			ProviderEventID: eventID, Status: status, Payload: datatypes.JSON(payload), CreatedAt: s.now(),
		}).Error; err != nil {
			return err
		}
		var order Order
		if err := tx.Where("id = ?", payment.OrderID).First(&order).Error; err != nil {
			return ErrNotFound
		}
		if status == "SUCCEEDED" && order.OrderStatus == "PENDING_PAYMENT" {
			if err := s.inventory.ConfirmTx(ctx, tx, order.ReservationID); err != nil {
				return err
			}
			paidAt := s.now()
			if err := tx.Model(&Payment{}).Where("id = ?", payment.ID).Update("status", "PAID").Error; err != nil {
				return err
			}
			if err := tx.Model(&Order{}).Where("id = ?", order.ID).Updates(map[string]any{
				"payment_status": "PAID", "order_status": "CONFIRMED", "paid_at": paidAt,
			}).Error; err != nil {
				return err
			}
			if err := s.ticket.IssueTx(ctx, tx, order.ID); err != nil {
				return err
			}
			if s.notification != nil {
				if err := s.notification.CreateTx(ctx, tx, order.UserID, "ORDER",
					"Pembayaran berhasil",
					"Pesanan "+order.OrderNumber+" sudah dibayar.", "/orders/"+order.ID); err != nil {
					return err
				}
				if err := s.notification.CreateTx(ctx, tx, order.UserID, "TICKET",
					"Tiket kamu sudah terbit",
					"Tiket untuk "+order.OrderNumber+" bisa dibuka sekarang.", "/tickets"); err != nil {
					return err
				}
			}
			return nil
		}
		if status == "FAILED" && order.OrderStatus == "PENDING_PAYMENT" {
			if err := tx.Model(&Payment{}).Where("id = ?", payment.ID).Update("status", "FAILED").Error; err != nil {
				return err
			}
			return tx.Model(&Order{}).Where("id = ?", order.ID).Updates(map[string]any{
				"payment_status": "FAILED", "order_status": "PAYMENT_FAILED",
			}).Error
		}
		return nil
	})
}

func userIDFromPrincipal(principal string) *string {
	if !strings.HasPrefix(principal, "user:") {
		return nil
	}
	id := strings.TrimPrefix(principal, "user:")
	if id == "" {
		return nil
	}
	return &id
}

func (s *Service) ListForOrganization(ctx context.Context, organizationID string) ([]Order, error) {
	var orderIDs []string
	err := s.db.WithContext(ctx).Table("orders").
		Select("DISTINCT orders.id").
		Joins("JOIN order_items ON order_items.order_id = orders.id").
		Joins("JOIN events ON events.id = order_items.event_id").
		Where("events.organization_id = ?", organizationID).
		Pluck("orders.id", &orderIDs).Error
	if err != nil {
		return nil, err
	}
	if len(orderIDs) == 0 {
		return []Order{}, nil
	}
	var orders []Order
	err = s.db.WithContext(ctx).Preload("Items").Where("id IN ?", orderIDs).
		Order("created_at DESC").Find(&orders).Error
	return orders, err
}

func (s *Service) ListAttendees(ctx context.Context, principal string) ([]Attendee, error) {
	var attendees []Attendee
	err := s.db.WithContext(ctx).Table("attendees").
		Joins("JOIN orders ON orders.id = attendees.order_id").
		Where("orders.principal_key = ?", principal).
		Order("attendees.created_at DESC").
		Find(&attendees).Error
	return attendees, err
}

func (s *Service) ListAttendeesForOrganization(ctx context.Context, organizationID string) ([]Attendee, error) {
	var attendees []Attendee
	err := s.db.WithContext(ctx).Table("attendees").
		Select("DISTINCT attendees.*").
		Joins("JOIN orders ON orders.id = attendees.order_id").
		Joins("JOIN order_items ON order_items.order_id = orders.id").
		Joins("JOIN events ON events.id = order_items.event_id").
		Where("events.organization_id = ?", organizationID).
		Order("attendees.created_at DESC").
		Find(&attendees).Error
	return attendees, err
}

func (s *Service) TicketsForOrder(ctx context.Context, orderID string) ([]ticket.Ticket, error) {
	return s.ticket.ListByOrder(ctx, orderID)
}

func (s *Service) List(ctx context.Context, principal string) ([]Order, error) {
	var orders []Order
	err := s.db.WithContext(ctx).Preload("Items").Where("principal_key = ?", principal).Order("created_at DESC").Find(&orders).Error
	return orders, err
}

func (s *Service) Get(ctx context.Context, principal, id string) (Order, error) {
	var order Order
	err := s.db.WithContext(ctx).Preload("Items").Where("id = ? AND principal_key = ?", id, principal).First(&order).Error
	if err != nil {
		return Order{}, ErrNotFound
	}
	return order, nil
}

func (s *Service) storeIdempotency(ctx context.Context, principal, key, hash, orderID string) error {
	body, _ := json.Marshal(map[string]string{"order_id": orderID})
	return s.db.WithContext(ctx).Create(&IdempotencyRecord{
		ID: ulid.Make().String(), PrincipalKey: principal, IdempotencyKey: key,
		RequestHash: hash, ResponseStatus: 201, ResponseBody: datatypes.JSON(body),
		CreatedAt: s.now(), ExpiresAt: s.now().Add(24 * time.Hour),
	}).Error
}

func (s *Service) discount(ctx context.Context, code string, subtotal int64) (int64, *string) {
	if code == "" {
		return 0, nil
	}
	var promo struct {
		Code         string
		Type         string
		Value        int64
		StartsAt     time.Time
		EndsAt       time.Time
		MinimumSpend *int64
		MaxDiscount  *int64
		IsActive     bool
	}
	if err := s.db.WithContext(ctx).Table("promotions").Where("code = ? AND is_active = ?", strings.ToUpper(code), true).Scan(&promo).Error; err != nil {
		return 0, nil
	}
	if promo.Code == "" || s.now().Before(promo.StartsAt) || s.now().After(promo.EndsAt) {
		return 0, nil
	}
	if promo.MinimumSpend != nil && subtotal < *promo.MinimumSpend {
		return 0, nil
	}
	var discount int64
	if promo.Type == "PERCENTAGE" {
		discount = int64(float64(subtotal) * float64(promo.Value) / 100)
		if promo.MaxDiscount != nil && discount > *promo.MaxDiscount {
			discount = *promo.MaxDiscount
		}
	} else {
		discount = promo.Value
	}
	if discount > subtotal {
		discount = subtotal
	}
	return discount, &promo.Code
}

func requestHash(value any) string {
	raw, _ := json.Marshal(value)
	sum := sha256.Sum256(raw)
	return hex.EncodeToString(sum[:])
}

func serviceFee(subtotal int64) int64 {
	if subtotal <= 0 {
		return 0
	}
	fee := int64(float64(subtotal) * 0.05)
	fee = ((fee + 50) / 100) * 100
	if fee > 25000 {
		return 25000
	}
	return fee
}

func max64(left, right int64) int64 {
	if left > right {
		return left
	}
	return right
}

func optionalString(value string) *string {
	if value == "" {
		return nil
	}
	return &value
}
