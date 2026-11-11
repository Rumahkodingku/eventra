package analytics

import (
	"bytes"
	"encoding/csv"
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
	group := router.Group("/organizer/analytics")
	group.Use(auth.RequireAuth(), auth.RequirePermission("event:write"))
	group.GET("", h.report)
	group.GET("/export.csv", h.export)
}

func (h *Handler) report(c *gin.Context) {
	organizationID, err := h.organizationID(c)
	if err != nil {
		writeError(c, http.StatusForbidden, "AUTH_FORBIDDEN", "Organizer access denied.")
		return
	}
	report, err := h.service.Report(c.Request.Context(), organizationID, c.Query("event_id"))
	if err != nil {
		writeError(c, http.StatusInternalServerError, "INTERNAL", "Could not load analytics.")
		return
	}
	c.JSON(http.StatusOK, report)
}

func (h *Handler) export(c *gin.Context) {
	organizationID, err := h.organizationID(c)
	if err != nil {
		writeError(c, http.StatusForbidden, "AUTH_FORBIDDEN", "Organizer access denied.")
		return
	}
	report, err := h.service.Report(c.Request.Context(), organizationID, c.Query("event_id"))
	if err != nil {
		writeError(c, http.StatusInternalServerError, "INTERNAL", "Could not export analytics.")
		return
	}
	var buffer bytes.Buffer
	writer := csv.NewWriter(&buffer)
	_ = writer.Write([]string{"event_id", "title", "status", "start_at", "tickets_sold", "revenue", "attendees", "checked_in"})
	for _, row := range report.Events {
		_ = writer.Write([]string{
			row.EventID, row.Title, row.Status, row.StartAt.Format("2006-01-02T15:04:05Z07:00"),
			strconv.FormatInt(row.TicketsSold, 10), strconv.FormatInt(row.Revenue, 10),
			strconv.FormatInt(row.Attendees, 10), strconv.FormatInt(row.CheckedIn, 10),
		})
	}
	writer.Flush()
	c.Header("Content-Type", "text/csv; charset=utf-8")
	c.Header("Content-Disposition", `attachment; filename="eventra-analytics.csv"`)
	c.String(http.StatusOK, buffer.String())
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
