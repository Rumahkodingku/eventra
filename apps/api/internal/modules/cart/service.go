package cart

import (
	"context"
	"encoding/json"
	"errors"
	"math"
	"strings"
	"time"

	"github.com/oklog/ulid/v2"
	"gorm.io/datatypes"
	"gorm.io/gorm"

	"github.com/eventra/eventra/apps/api/internal/modules/catalog"
	"github.com/eventra/eventra/apps/api/internal/modules/inventory"
)

var (
	ErrInvalidItem = errors.New("invalid cart item")
	ErrPromo       = errors.New("invalid promo")
	ErrConflict    = errors.New("inventory conflict")
)

type Service struct {
	db        *gorm.DB
	inventory *inventory.Service
	now       func() time.Time
}

func NewService(db *gorm.DB, inventoryService *inventory.Service) *Service {
	return &Service{db: db, inventory: inventoryService, now: time.Now}
}

type AddItemInput struct {
	EventID      string   `json:"event_id"`
	TicketTypeID string   `json:"ticket_type_id"`
	Quantity     int      `json:"quantity"`
	SeatIDs      []string `json:"seat_ids"`
}

type QuoteInput struct {
	EventID   string         `json:"event_id"`
	Items     []AddItemInput `json:"items"`
	PromoCode string         `json:"promo_code"`
}

type Quote struct {
	Subtotal      int64       `json:"subtotal"`
	ServiceFee    int64       `json:"service_fee"`
	Discount      int64       `json:"discount"`
	Total         int64       `json:"total"`
	Currency      string      `json:"currency"`
	PromoCode     string      `json:"promo_code,omitempty"`
	ReservationID string      `json:"reservation_id"`
	ExpiresAt     time.Time   `json:"expires_at"`
	Items         []QuoteLine `json:"items"`
}

type QuoteLine struct {
	EventID      string `json:"event_id"`
	TicketTypeID string `json:"ticket_type_id"`
	Name         string `json:"name"`
	Quantity     int    `json:"quantity"`
	UnitPrice    int64  `json:"unit_price"`
	LineSubtotal int64  `json:"line_subtotal"`
}

func (s *Service) Get(ctx context.Context, principal string) (Cart, error) {
	cart, err := s.getOrCreate(ctx, principal)
	if err != nil {
		return Cart{}, err
	}
	if err := s.db.WithContext(ctx).Preload("Items").Where("id = ?", cart.ID).First(&cart).Error; err != nil {
		return Cart{}, err
	}
	return cart, nil
}

func (s *Service) AddItem(ctx context.Context, principal string, input AddItemInput) (Cart, error) {
	cart, err := s.getOrCreate(ctx, principal)
	if err != nil {
		return Cart{}, err
	}
	var ticket catalog.TicketType
	if err := s.db.WithContext(ctx).Where("id = ? AND event_id = ?", input.TicketTypeID, input.EventID).First(&ticket).Error; err != nil {
		return Cart{}, ErrInvalidItem
	}
	if ticket.Status != "ACTIVE" || s.now().Before(ticket.SalesStartAt) || s.now().After(ticket.SalesEndAt) {
		return Cart{}, ErrInvalidItem
	}
	if input.Quantity < ticket.MinPerOrder || input.Quantity > ticket.MaxPerOrder {
		return Cart{}, ErrInvalidItem
	}
	if ticket.Kind == "SEATED" && len(input.SeatIDs) == 0 {
		return Cart{}, ErrInvalidItem
	}
	seatIDs, _ := json.Marshal(input.SeatIDs)
	newItem := CartItem{
		ID: ulid.Make().String(), CartID: cart.ID, EventID: input.EventID,
		TicketTypeID: input.TicketTypeID, Quantity: input.Quantity,
		SeatIDs: datatypes.JSON(seatIDs), UnitPriceSnapshot: ticket.Price, AddedAt: s.now(),
	}
	err = s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if len(input.SeatIDs) == 0 {
			var existing CartItem
			if err := tx.Where("cart_id = ? AND event_id = ? AND ticket_type_id = ? AND JSON_LENGTH(seat_ids) = 0", cart.ID, input.EventID, input.TicketTypeID).First(&existing).Error; err == nil {
				return tx.Model(&existing).Update("quantity", existing.Quantity+input.Quantity).Error
			}
		}
		if err := tx.Create(&newItem).Error; err != nil {
			return err
		}
		return tx.Model(&Cart{}).Where("id = ?", cart.ID).Update("updated_at", s.now()).Error
	})
	if err != nil {
		return Cart{}, err
	}
	return s.Get(ctx, principal)
}

func (s *Service) UpdateQuantity(ctx context.Context, principal, itemID string, quantity int) (Cart, error) {
	cart, err := s.getOrCreate(ctx, principal)
	if err != nil {
		return Cart{}, err
	}
	if quantity <= 0 {
		return Cart{}, ErrInvalidItem
	}
	if err := s.db.WithContext(ctx).Model(&CartItem{}).Where("id = ? AND cart_id = ?", itemID, cart.ID).Update("quantity", quantity).Error; err != nil {
		return Cart{}, err
	}
	return s.Get(ctx, principal)
}

func (s *Service) RemoveItem(ctx context.Context, principal, itemID string) (Cart, error) {
	cart, err := s.getOrCreate(ctx, principal)
	if err != nil {
		return Cart{}, err
	}
	if err := s.db.WithContext(ctx).Where("id = ? AND cart_id = ?", itemID, cart.ID).Delete(&CartItem{}).Error; err != nil {
		return Cart{}, err
	}
	return s.Get(ctx, principal)
}

func (s *Service) Clear(ctx context.Context, principal string) error {
	cart, err := s.getOrCreate(ctx, principal)
	if err != nil {
		return err
	}
	return s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("cart_id = ?", cart.ID).Delete(&CartItem{}).Error; err != nil {
			return err
		}
		return tx.Model(&cart).Update("promo_code", nil).Error
	})
}

func (s *Service) ApplyPromo(ctx context.Context, principal, code string) (Cart, error) {
	cart, err := s.Get(ctx, principal)
	if err != nil {
		return Cart{}, err
	}
	if _, err := s.validatePromo(ctx, code, cart); err != nil {
		return Cart{}, err
	}
	if err := s.db.WithContext(ctx).Model(&Cart{}).Where("id = ?", cart.ID).Update("promo_code", strings.ToUpper(strings.TrimSpace(code))).Error; err != nil {
		return Cart{}, err
	}
	return s.Get(ctx, principal)
}

func (s *Service) RemovePromo(ctx context.Context, principal string) (Cart, error) {
	cart, err := s.getOrCreate(ctx, principal)
	if err != nil {
		return Cart{}, err
	}
	if err := s.db.WithContext(ctx).Model(&cart).Update("promo_code", nil).Error; err != nil {
		return Cart{}, err
	}
	return s.Get(ctx, principal)
}

func (s *Service) Quote(ctx context.Context, principal string, input QuoteInput) (Quote, error) {
	if len(input.Items) == 0 {
		return Quote{}, ErrInvalidItem
	}
	lines := make([]QuoteLine, 0, len(input.Items))
	inventoryItems := make([]inventory.Item, 0, len(input.Items))
	var subtotal int64
	eventIDs := map[string]bool{}
	for _, item := range input.Items {
		var ticket catalog.TicketType
		if err := s.db.WithContext(ctx).Where("id = ? AND event_id = ?", item.TicketTypeID, input.EventID).First(&ticket).Error; err != nil {
			return Quote{}, ErrInvalidItem
		}
		if ticket.Status != "ACTIVE" || s.now().Before(ticket.SalesStartAt) || s.now().After(ticket.SalesEndAt) {
			return Quote{}, ErrInvalidItem
		}
		quantity := item.Quantity
		if ticket.Kind == "SEATED" {
			quantity = len(item.SeatIDs)
		}
		if quantity <= 0 || quantity < ticket.MinPerOrder || quantity > ticket.MaxPerOrder {
			return Quote{}, ErrInvalidItem
		}
		lineSubtotal := ticket.Price * int64(quantity)
		subtotal += lineSubtotal
		lines = append(lines, QuoteLine{
			EventID: input.EventID, TicketTypeID: ticket.ID, Name: ticket.Name,
			Quantity: quantity, UnitPrice: ticket.Price, LineSubtotal: lineSubtotal,
		})
		inventoryItems = append(inventoryItems, inventory.Item{
			TicketTypeID: ticket.ID, Quantity: quantity, SeatIDs: item.SeatIDs,
		})
		eventIDs[input.EventID] = true
	}

	serviceFee := serviceFee(subtotal)
	var discount int64
	var promoCode string
	if input.PromoCode != "" {
		promo, err := s.validatePromoCode(ctx, input.PromoCode, subtotal, eventIDs)
		if err != nil {
			return Quote{}, err
		}
		discount = discountFor(promo, subtotal)
		promoCode = promo.Code
	}

	eventID := input.EventID
	if eventID == "" {
		return Quote{}, ErrInvalidItem
	}
	reservation, err := s.inventory.Reserve(ctx, principal, eventID, inventoryItems)
	if err != nil {
		return Quote{}, ErrConflict
	}
	return Quote{
		Subtotal: subtotal, ServiceFee: serviceFee, Discount: discount,
		Total: max64(0, subtotal+serviceFee-discount), Currency: "IDR",
		PromoCode: promoCode, ReservationID: reservation.ID, ExpiresAt: reservation.ExpiresAt,
		Items: lines,
	}, nil
}

func (s *Service) getOrCreate(ctx context.Context, principal string) (Cart, error) {
	var cart Cart
	err := s.db.WithContext(ctx).Where("principal_key = ?", principal).First(&cart).Error
	if err == nil {
		return cart, nil
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return Cart{}, err
	}
	cart = Cart{ID: ulid.Make().String(), PrincipalKey: principal, CreatedAt: s.now(), UpdatedAt: s.now()}
	return cart, s.db.WithContext(ctx).Create(&cart).Error
}

func (s *Service) validatePromo(ctx context.Context, code string, cart Cart) (Promotion, error) {
	subtotal := int64(0)
	for _, item := range cart.Items {
		subtotal += item.UnitPriceSnapshot * int64(item.Quantity)
	}
	events := map[string]bool{}
	for _, item := range cart.Items {
		events[item.EventID] = true
	}
	return s.validatePromoCode(ctx, code, subtotal, events)
}

func (s *Service) validatePromoCode(ctx context.Context, code string, subtotal int64, eventIDs map[string]bool) (Promotion, error) {
	var promo Promotion
	if err := s.db.WithContext(ctx).Where("code = ? AND is_active = ?", strings.ToUpper(strings.TrimSpace(code)), true).First(&promo).Error; err != nil {
		return Promotion{}, ErrPromo
	}
	now := s.now()
	if now.Before(promo.StartsAt) || now.After(promo.EndsAt) {
		return Promotion{}, ErrPromo
	}
	if promo.MinimumSpend != nil && subtotal < *promo.MinimumSpend {
		return Promotion{}, ErrPromo
	}
	if promo.UsageLimit != nil {
		var count int64
		if err := s.db.WithContext(ctx).Model(&PromotionRedemption{}).Where("promotion_id = ?", promo.ID).Count(&count).Error; err == nil && count >= int64(*promo.UsageLimit) {
			return Promotion{}, ErrPromo
		}
	}
	return promo, nil
}

func discountFor(promo Promotion, subtotal int64) int64 {
	if promo.Type == "PERCENTAGE" {
		discount := round100(subtotal * promo.Value / 100)
		if promo.MaxDiscount != nil && discount > *promo.MaxDiscount {
			discount = *promo.MaxDiscount
		}
		if discount > subtotal {
			return subtotal
		}
		return discount
	}
	if promo.Value > subtotal {
		return subtotal
	}
	return promo.Value
}

func serviceFee(subtotal int64) int64 {
	if subtotal <= 0 {
		return 0
	}
	fee := round100(subtotal * 5 / 100)
	if fee > 25000 {
		return 25000
	}
	return fee
}

func round100(value int64) int64 {
	return int64(math.Round(float64(value)/100) * 100)
}

func max64(left, right int64) int64 {
	if left > right {
		return left
	}
	return right
}

type PromotionRedemption struct {
	ID           string    `gorm:"column:id;primaryKey"`
	PromotionID  string    `gorm:"column:promotion_id"`
	PrincipalKey string    `gorm:"column:principal_key"`
	OrderID      *string   `gorm:"column:order_id"`
	CreatedAt    time.Time `gorm:"column:created_at"`
}

func (PromotionRedemption) TableName() string { return "promotion_redemptions" }
