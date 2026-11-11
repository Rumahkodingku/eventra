package wishlist

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
	group := router.Group("/account/wishlist")
	group.Use(auth.RequireAuth())
	group.GET("", h.list)
	group.POST("", h.add)
	group.DELETE("/:eventId", h.remove)
	group.DELETE("", h.clear)
}

func (h *Handler) list(c *gin.Context) {
	eventIDs, err := h.service.List(c.Request.Context(), c.GetString("user_id"))
	if err != nil {
		writeError(c, http.StatusInternalServerError, "INTERNAL", "Could not load wishlist.")
		return
	}
	c.JSON(http.StatusOK, eventIDs)
}

func (h *Handler) add(c *gin.Context) {
	var body struct {
		EventID string `json:"event_id"`
	}
	if err := c.ShouldBindJSON(&body); err != nil || body.EventID == "" {
		writeError(c, http.StatusBadRequest, "VALIDATION_FAILED", "Event is required.")
		return
	}
	if err := h.service.Add(c.Request.Context(), c.GetString("user_id"), body.EventID); err != nil {
		writeError(c, http.StatusInternalServerError, "INTERNAL", "Could not update wishlist.")
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *Handler) remove(c *gin.Context) {
	if err := h.service.Remove(c.Request.Context(), c.GetString("user_id"), c.Param("eventId")); err != nil {
		writeError(c, http.StatusInternalServerError, "INTERNAL", "Could not update wishlist.")
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *Handler) clear(c *gin.Context) {
	if err := h.service.Clear(c.Request.Context(), c.GetString("user_id")); err != nil {
		writeError(c, http.StatusInternalServerError, "INTERNAL", "Could not update wishlist.")
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
