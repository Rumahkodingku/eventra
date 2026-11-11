package order

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/eventra/eventra/apps/api/internal/modules/identity"
	"github.com/eventra/eventra/apps/api/internal/platform/observability"
)

type Handler struct {
	service       *Service
	webhookSecret string
}

func NewHandler(service *Service, webhookSecret string) *Handler {
	return &Handler{service: service, webhookSecret: webhookSecret}
}

func (h *Handler) RegisterRoutes(router *gin.RouterGroup, auth *identity.Handler) {
	router.POST("/webhooks/payments/:provider", h.webhook)
	group := router.Group("")
	group.Use(auth.Principal())
	group.POST("/checkout/orders", h.create)
	group.GET("/orders", h.list)
	group.GET("/orders/:id", h.get)
	group.GET("/account/attendees", auth.RequireAuth(), h.myAttendees)
	group.GET("/organizer/orders", auth.RequireAuth(), auth.RequirePermission("order:read"), h.organizerList)
	group.GET("/organizer/attendees", auth.RequireAuth(), auth.RequirePermission("attendee:read"), h.organizerAttendees)
}

func (h *Handler) create(c *gin.Context) {
	key := c.GetHeader("Idempotency-Key")
	if key == "" {
		writeError(c, http.StatusBadRequest, "VALIDATION_FAILED", "Idempotency-Key is required.")
		return
	}
	var input CreateInput
	if err := c.ShouldBindJSON(&input); err != nil {
		writeError(c, http.StatusBadRequest, "VALIDATION_FAILED", "Invalid order payload.")
		return
	}
	order, err := h.service.Create(c.Request.Context(), c.GetString("principal_key"), key, input)
	if err != nil {
		switch err {
		case ErrIdempotency:
			writeError(c, http.StatusConflict, "IDEMPOTENCY_CONFLICT", "Idempotency key was reused with a different request.")
		case ErrReservation:
			writeError(c, http.StatusConflict, "INVENTORY_CONFLICT", "Reservation is no longer valid.")
		default:
			writeError(c, http.StatusInternalServerError, "INTERNAL", "Could not create order.")
		}
		return
	}
	tickets, err := h.service.TicketsForOrder(c.Request.Context(), order.ID)
	if err != nil {
		writeError(c, http.StatusInternalServerError, "INTERNAL", "Could not load tickets.")
		return
	}
	c.JSON(http.StatusCreated, gin.H{"tickets": tickets, "order": order})
	observability.Inc("checkout_orders_total")
}

func (h *Handler) list(c *gin.Context) {
	orders, err := h.service.List(c.Request.Context(), c.GetString("principal_key"))
	if err != nil {
		writeError(c, http.StatusInternalServerError, "INTERNAL", "Could not load orders.")
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": orders, "next_cursor": ""})
}

func (h *Handler) get(c *gin.Context) {
	order, err := h.service.Get(c.Request.Context(), c.GetString("principal_key"), c.Param("id"))
	if err != nil {
		writeError(c, http.StatusNotFound, "NOT_FOUND", "Order not found.")
		return
	}
	c.JSON(http.StatusOK, order)
}

func (h *Handler) myAttendees(c *gin.Context) {
	attendees, err := h.service.ListAttendees(c.Request.Context(), c.GetString("principal_key"))
	if err != nil {
		writeError(c, http.StatusInternalServerError, "INTERNAL", "Could not load attendees.")
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": attendees, "next_cursor": ""})
}

func (h *Handler) organizerList(c *gin.Context) {
	organizationID, err := h.organizationID(c)
	if err != nil {
		writeError(c, http.StatusForbidden, "AUTH_FORBIDDEN", "Organizer access denied.")
		return
	}
	orders, err := h.service.ListForOrganization(c.Request.Context(), organizationID)
	if err != nil {
		writeError(c, http.StatusInternalServerError, "INTERNAL", "Could not load orders.")
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": orders, "next_cursor": ""})
}

func (h *Handler) organizerAttendees(c *gin.Context) {
	organizationID, err := h.organizationID(c)
	if err != nil {
		writeError(c, http.StatusForbidden, "AUTH_FORBIDDEN", "Organizer access denied.")
		return
	}
	attendees, err := h.service.ListAttendeesForOrganization(c.Request.Context(), organizationID)
	if err != nil {
		writeError(c, http.StatusInternalServerError, "INTERNAL", "Could not load attendees.")
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": attendees, "next_cursor": ""})
}

func (h *Handler) organizationID(c *gin.Context) (string, error) {
	var row struct{ OrganizationID string }
	err := h.service.db.WithContext(c.Request.Context()).
		Table("organization_members").
		Select("organization_id").
		Where("user_id = ?", c.GetString("user_id")).
		First(&row).Error
	return row.OrganizationID, err
}

type webhookRequest struct {
	EventID           string `json:"event_id"`
	ProviderReference string `json:"provider_reference"`
	Status            string `json:"status"`
}

func (h *Handler) webhook(c *gin.Context) {
	raw, err := c.GetRawData()
	if err != nil {
		writeError(c, http.StatusBadRequest, "VALIDATION_FAILED", "Invalid webhook.")
		return
	}
	signature := c.GetHeader("X-Mock-Signature")
	expected := hmac.New(sha256.New, []byte(h.webhookSecret))
	expected.Write(raw)
	if !hmac.Equal([]byte(signature), []byte(hex.EncodeToString(expected.Sum(nil)))) {
		writeError(c, http.StatusUnauthorized, "AUTH_INVALID", "Invalid webhook signature.")
		return
	}
	var request webhookRequest
	if err := json.Unmarshal(raw, &request); err != nil || request.EventID == "" || request.ProviderReference == "" {
		writeError(c, http.StatusBadRequest, "VALIDATION_FAILED", "Invalid webhook payload.")
		return
	}
	if err := h.service.ProcessWebhook(c.Request.Context(), c.Param("provider"), request.EventID, request.ProviderReference, request.Status); err != nil {
		writeError(c, http.StatusNotFound, "NOT_FOUND", "Payment not found.")
		return
	}
	c.Status(http.StatusOK)
	observability.Inc("payment_webhooks_total")
}

func writeError(c *gin.Context, status int, code, message string) {
	c.AbortWithStatusJSON(status, gin.H{
		"error": gin.H{
			"code":       code,
			"message":    message,
			"request_id": c.GetString("request_id"),
		},
	})
}
