package inventory

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/eventra/eventra/apps/api/internal/modules/identity"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) RegisterRoutes(router *gin.RouterGroup, auth *identity.Handler) {
	router.GET("/events/:event/seats", h.seats)
	group := router.Group("/checkout")
	group.Use(auth.Principal())
	group.POST("/reservations", h.reserve)
	group.GET("/reservations/:id", h.get)
	group.DELETE("/reservations/:id", h.release)
}

func (h *Handler) seats(c *gin.Context) {
	claimed, err := h.service.ClaimedSeats(c.Request.Context(), c.Param("event"))
	if err != nil {
		writeError(c, http.StatusInternalServerError, "INTERNAL", "Could not load seats.")
		return
	}
	c.JSON(http.StatusOK, gin.H{"claimed": claimed})
}

type reserveRequest struct {
	EventID string `json:"event_id"`
	Items   []struct {
		TicketTypeID string   `json:"ticket_type_id"`
		Quantity     int      `json:"quantity"`
		SeatIDs      []string `json:"seat_ids"`
	} `json:"items"`
}

func (h *Handler) reserve(c *gin.Context) {
	var request reserveRequest
	if err := c.ShouldBindJSON(&request); err != nil || request.EventID == "" {
		writeError(c, http.StatusBadRequest, "VALIDATION_FAILED", "Invalid reservation payload.")
		return
	}
	items := make([]Item, 0, len(request.Items))
	for _, item := range request.Items {
		items = append(items, Item{
			TicketTypeID: item.TicketTypeID,
			Quantity:     item.Quantity,
			SeatIDs:      item.SeatIDs,
		})
	}
	reservation, err := h.service.Reserve(c.Request.Context(), c.GetString("principal_key"), request.EventID, items)
	if err != nil {
		writeError(c, http.StatusConflict, "INVENTORY_CONFLICT", "One or more selected items are no longer available.")
		return
	}
	c.JSON(http.StatusCreated, reservation)
}

func (h *Handler) get(c *gin.Context) {
	reservation, err := h.service.GetForPrincipal(c.Request.Context(), c.GetString("principal_key"), c.Param("id"))
	if err != nil {
		writeError(c, http.StatusNotFound, "NOT_FOUND", "Reservation not found.")
		return
	}
	c.JSON(http.StatusOK, reservation)
}

func (h *Handler) release(c *gin.Context) {
	if err := h.service.ReleaseForPrincipal(c.Request.Context(), c.GetString("principal_key"), c.Param("id")); err != nil {
		writeError(c, http.StatusNotFound, "NOT_FOUND", "Reservation not found.")
		return
	}
	c.Status(http.StatusNoContent)
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
