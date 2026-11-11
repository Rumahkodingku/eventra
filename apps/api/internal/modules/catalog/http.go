package catalog

import (
	"net/http"
	"strconv"

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
	router.GET("/categories", h.listCategories)
	router.GET("/venues/:venueId", h.getVenue)
	router.GET("/events", h.listEvents)
	router.GET("/events/:event", h.getEvent)
	router.GET("/events/:event/ticket-types", h.listTicketTypes)

	organizer := router.Group("/organizer")
	organizer.Use(auth.RequireAuth(), auth.RequirePermission("event:write"))
	organizer.GET("/dashboard", h.dashboard)
	organizer.GET("/events", h.listOrganizerEvents)
	organizer.POST("/events", h.createOrganizerEvent)
	organizer.GET("/events/:eventId", h.getOrganizerEvent)
	organizer.PATCH("/events/:eventId", h.updateOrganizerEvent)
	organizer.POST("/events/:eventId/publish", h.publishEvent)
	organizer.POST("/events/:eventId/pause", h.pauseEvent)
	organizer.POST("/events/:eventId/cancel", h.cancelEvent)
	organizer.GET("/events/:eventId/ticket-types", h.listTicketTypes)
}

func (h *Handler) listCategories(c *gin.Context) {
	categories, err := h.service.ListCategories(c.Request.Context())
	if err != nil {
		writeError(c, http.StatusInternalServerError, "INTERNAL", "Could not load categories.")
		return
	}
	c.JSON(http.StatusOK, categories)
}

func (h *Handler) getVenue(c *gin.Context) {
	venue, err := h.service.GetVenue(c.Request.Context(), c.Param("venueId"))
	if err != nil {
		writeError(c, http.StatusNotFound, "NOT_FOUND", "Venue not found.")
		return
	}
	c.JSON(http.StatusOK, venue)
}

func (h *Handler) listEvents(c *gin.Context) {
	limit := 50
	if raw := c.Query("limit"); raw != "" {
		if parsed, err := strconv.Atoi(raw); err == nil {
			limit = parsed
		}
	}
	events, err := h.service.ListEvents(c.Request.Context(), EventFilter{
		Query:        c.Query("q"),
		CategorySlug: c.Query("category"),
		City:         c.Query("city"),
		Mode:         c.Query("mode"),
		Sort:         c.Query("sort"),
		Limit:        limit,
	})
	if err != nil {
		writeError(c, http.StatusInternalServerError, "INTERNAL", "Could not load events.")
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": events, "next_cursor": ""})
}

func (h *Handler) getEvent(c *gin.Context) {
	event, err := h.service.GetEventBySlug(c.Request.Context(), c.Param("event"))
	if err != nil {
		writeError(c, http.StatusNotFound, "NOT_FOUND", "Event not found.")
		return
	}
	c.JSON(http.StatusOK, event)
}

func (h *Handler) listTicketTypes(c *gin.Context) {
	eventID := c.Param("event")
	if eventID == "" {
		eventID = c.Param("eventId")
	}
	if event, err := h.service.GetEventBySlug(c.Request.Context(), eventID); err == nil {
		eventID = event.ID
	}
	tickets, err := h.service.ListTicketTypes(c.Request.Context(), eventID)
	if err != nil {
		writeError(c, http.StatusInternalServerError, "INTERNAL", "Could not load ticket types.")
		return
	}
	remaining := map[string]int{}
	for _, ticket := range tickets {
		remaining[ticket.ID] = ticket.Quota - ticket.SoldCount
	}
	c.JSON(http.StatusOK, gin.H{"items": tickets, "remaining": remaining})
}

func (h *Handler) dashboard(c *gin.Context) {
	organizationID, err := h.organizationID(c)
	if err != nil {
		writeError(c, http.StatusForbidden, "AUTH_FORBIDDEN", "Organizer access denied.")
		return
	}
	events, err := h.service.ListOrganizerEvents(c.Request.Context(), organizationID)
	if err != nil {
		writeError(c, http.StatusInternalServerError, "INTERNAL", "Could not load dashboard.")
		return
	}
	active := 0
	for _, event := range events {
		if event.Status == "PUBLISHED" {
			active++
		}
	}
	c.JSON(http.StatusOK, gin.H{"active_events": active, "total_events": len(events)})
}

func (h *Handler) listOrganizerEvents(c *gin.Context) {
	organizationID, err := h.organizationID(c)
	if err != nil {
		writeError(c, http.StatusForbidden, "AUTH_FORBIDDEN", "Organizer access denied.")
		return
	}
	events, err := h.service.ListOrganizerEvents(c.Request.Context(), organizationID)
	if err != nil {
		writeError(c, http.StatusInternalServerError, "INTERNAL", "Could not load events.")
		return
	}
	c.JSON(http.StatusOK, events)
}

func (h *Handler) createOrganizerEvent(c *gin.Context) {
	organizationID, err := h.organizationID(c)
	if err != nil {
		writeError(c, http.StatusForbidden, "AUTH_FORBIDDEN", "Organizer access denied.")
		return
	}
	var input EventInput
	if err := c.ShouldBindJSON(&input); err != nil {
		writeError(c, http.StatusBadRequest, "VALIDATION_FAILED", "Invalid event payload.")
		return
	}
	event, err := h.service.CreateEvent(c.Request.Context(), organizationID, input)
	if err != nil {
		writeError(c, http.StatusBadRequest, "VALIDATION_FAILED", err.Error())
		return
	}
	c.JSON(http.StatusCreated, event)
}

func (h *Handler) getOrganizerEvent(c *gin.Context) {
	organizationID, err := h.organizationID(c)
	if err != nil {
		writeError(c, http.StatusForbidden, "AUTH_FORBIDDEN", "Organizer access denied.")
		return
	}
	event, err := h.service.GetOrganizerEvent(c.Request.Context(), organizationID, c.Param("eventId"))
	if err != nil {
		writeError(c, http.StatusNotFound, "NOT_FOUND", "Event not found.")
		return
	}
	c.JSON(http.StatusOK, event)
}

func (h *Handler) updateOrganizerEvent(c *gin.Context) {
	organizationID, err := h.organizationID(c)
	if err != nil {
		writeError(c, http.StatusForbidden, "AUTH_FORBIDDEN", "Organizer access denied.")
		return
	}
	var input EventInput
	if err := c.ShouldBindJSON(&input); err != nil {
		writeError(c, http.StatusBadRequest, "VALIDATION_FAILED", "Invalid event payload.")
		return
	}
	event, err := h.service.UpdateEvent(c.Request.Context(), organizationID, c.Param("eventId"), input)
	if err != nil {
		writeError(c, http.StatusBadRequest, "VALIDATION_FAILED", err.Error())
		return
	}
	c.JSON(http.StatusOK, event)
}

func (h *Handler) publishEvent(c *gin.Context) {
	h.transition(c, "PUBLISHED")
}

func (h *Handler) pauseEvent(c *gin.Context) {
	h.transition(c, "PAUSED")
}

func (h *Handler) cancelEvent(c *gin.Context) {
	h.transition(c, "CANCELLED")
}

func (h *Handler) transition(c *gin.Context, status string) {
	organizationID, err := h.organizationID(c)
	if err != nil {
		writeError(c, http.StatusForbidden, "AUTH_FORBIDDEN", "Organizer access denied.")
		return
	}
	event, err := h.service.UpdateEvent(c.Request.Context(), organizationID, c.Param("eventId"), EventInput{Status: status})
	if err != nil {
		writeError(c, http.StatusConflict, "CONFLICT", err.Error())
		return
	}
	c.JSON(http.StatusOK, event)
}

func (h *Handler) organizationID(c *gin.Context) (string, error) {
	return h.service.OrganizationIDForUser(c.Request.Context(), c.GetString("user_id"))
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
