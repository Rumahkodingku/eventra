package organization

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
	group := router.Group("/organizer/settings")
	group.Use(auth.RequireAuth(), auth.RequirePermission("event:write"))
	group.GET("", h.get)
	group.PATCH("", h.update)
}

func (h *Handler) get(c *gin.Context) {
	organizationID, err := h.organizationID(c)
	if err != nil {
		writeError(c, http.StatusForbidden, "AUTH_FORBIDDEN", "Organizer access denied.")
		return
	}
	settings, err := h.service.Get(c.Request.Context(), organizationID)
	if err != nil {
		writeError(c, http.StatusInternalServerError, "INTERNAL", "Could not load settings.")
		return
	}
	c.JSON(http.StatusOK, settings)
}

func (h *Handler) update(c *gin.Context) {
	organizationID, err := h.organizationID(c)
	if err != nil {
		writeError(c, http.StatusForbidden, "AUTH_FORBIDDEN", "Organizer access denied.")
		return
	}
	var input UpdateInput
	if err := c.ShouldBindJSON(&input); err != nil {
		writeError(c, http.StatusBadRequest, "VALIDATION_FAILED", "Invalid settings payload.")
		return
	}
	settings, err := h.service.Update(c.Request.Context(), organizationID, input)
	if err != nil {
		writeError(c, http.StatusInternalServerError, "INTERNAL", "Could not save settings.")
		return
	}
	c.JSON(http.StatusOK, settings)
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

func writeError(c *gin.Context, status int, code, message string) {
	c.AbortWithStatusJSON(status, gin.H{
		"error": gin.H{
			"code":       code,
			"message":    message,
			"request_id": c.GetString("request_id"),
		},
	})
}
