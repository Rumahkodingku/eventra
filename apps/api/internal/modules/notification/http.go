package notification

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
	group := router.Group("/account/notifications")
	group.Use(auth.RequireAuth())
	group.GET("", h.list)
	group.POST("/:id/read", h.markRead)
	group.POST("/read-all", h.markAllRead)
}

func (h *Handler) list(c *gin.Context) {
	items, err := h.service.List(c.Request.Context(), c.GetString("user_id"))
	if err != nil {
		writeError(c, http.StatusInternalServerError, "INTERNAL", "Could not load notifications.")
		return
	}
	c.JSON(http.StatusOK, items)
}

func (h *Handler) markRead(c *gin.Context) {
	if err := h.service.MarkRead(c.Request.Context(), c.GetString("user_id"), c.Param("id")); err != nil {
		if err == ErrNotFound {
			writeError(c, http.StatusNotFound, "NOT_FOUND", "Notification not found.")
			return
		}
		writeError(c, http.StatusInternalServerError, "INTERNAL", "Could not update notification.")
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *Handler) markAllRead(c *gin.Context) {
	if err := h.service.MarkAllRead(c.Request.Context(), c.GetString("user_id")); err != nil {
		writeError(c, http.StatusInternalServerError, "INTERNAL", "Could not update notifications.")
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
