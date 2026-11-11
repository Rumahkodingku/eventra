package ticket

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/eventra/eventra/apps/api/internal/modules/identity"
	"github.com/eventra/eventra/apps/api/internal/platform/observability"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) RegisterRoutes(router *gin.RouterGroup, auth *identity.Handler) {
	group := router.Group("")
	group.Use(auth.Principal())
	group.GET("/tickets", h.list)
	group.GET("/tickets/:id", h.get)
	group.GET("/organizer/tickets", auth.RequireAuth(), auth.RequirePermission("order:read"), h.organizerList)
	group.POST("/organizer/events/:eventId/check-in", auth.RequireAuth(), auth.RequirePermission("checkin:write"), h.checkIn)
}

func (h *Handler) list(c *gin.Context) {
	tickets, err := h.service.List(c.Request.Context(), c.GetString("principal_key"))
	if err != nil {
		writeError(c, http.StatusInternalServerError, "INTERNAL", "Could not load tickets.")
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": tickets, "next_cursor": ""})
}

func (h *Handler) get(c *gin.Context) {
	ticket, err := h.service.Get(c.Request.Context(), c.GetString("principal_key"), c.Param("id"))
	if err != nil {
		writeError(c, http.StatusNotFound, "NOT_FOUND", "Ticket not found.")
		return
	}
	c.JSON(http.StatusOK, ticket)
}

func (h *Handler) organizerList(c *gin.Context) {
	organizationID, err := h.organizationID(c, c.GetString("user_id"))
	if err != nil {
		writeError(c, http.StatusForbidden, "AUTH_FORBIDDEN", "Organizer access denied.")
		return
	}
	tickets, err := h.service.ListForOrganization(c.Request.Context(), organizationID)
	if err != nil {
		writeError(c, http.StatusInternalServerError, "INTERNAL", "Could not load tickets.")
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": tickets, "next_cursor": ""})
}

func (h *Handler) checkIn(c *gin.Context) {
	userID := c.GetString("user_id")
	organizationID, err := h.organizationID(c, userID)
	if err != nil {
		writeError(c, http.StatusForbidden, "AUTH_FORBIDDEN", "Organizer access denied.")
		return
	}
	var body struct {
		Token string `json:"token"`
	}
	if err := c.ShouldBindJSON(&body); err != nil || body.Token == "" {
		writeError(c, http.StatusBadRequest, "VALIDATION_FAILED", "Ticket token is required.")
		return
	}
	ticket, err := h.service.CheckIn(c.Request.Context(), c.Param("eventId"), organizationID, userID, body.Token)
	if err != nil {
		switch err {
		case ErrAlreadyUsed:
			writeError(c, http.StatusConflict, "TICKET_ALREADY_USED", "This ticket has already been checked in.")
		case ErrForbidden:
			writeError(c, http.StatusForbidden, "AUTH_FORBIDDEN", "Ticket does not belong to this event.")
		default:
			writeError(c, http.StatusNotFound, "NOT_FOUND", "Ticket not found.")
		}
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true, "ticket_id": ticket.ID, "status": ticket.Status, "checked_in_at": ticket.CheckedInAt})
	observability.Inc("ticket_checkins_total")
}

func (h *Handler) organizationID(c *gin.Context, userID string) (string, error) {
	var row struct{ OrganizationID string }
	err := h.service.db.WithContext(c.Request.Context()).
		Table("organization_members").
		Select("organization_id").
		Where("user_id = ?", userID).
		First(&row).Error
	return row.OrganizationID, err
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
