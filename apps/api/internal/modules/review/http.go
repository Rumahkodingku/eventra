package review

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
	router.GET("/events/:event/reviews", h.list)
	group := router.Group("/events/:event/reviews")
	group.Use(auth.RequireAuth())
	group.POST("", h.create)
}

func (h *Handler) list(c *gin.Context) {
	rating, _ := strconv.Atoi(c.Query("rating"))
	items, err := h.service.List(c.Request.Context(), c.Param("event"), c.Query("sort"), rating)
	if err != nil {
		writeError(c, http.StatusInternalServerError, "INTERNAL", "Could not load reviews.")
		return
	}
	c.JSON(http.StatusOK, items)
}

func (h *Handler) create(c *gin.Context) {
	var body struct {
		Rating  int    `json:"rating"`
		Comment string `json:"comment"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		writeError(c, http.StatusBadRequest, "VALIDATION_FAILED", "Invalid review payload.")
		return
	}
	userID := c.GetString("user_id")
	item, err := h.service.Create(c.Request.Context(), userID,
		c.Param("event"), "", body.Rating, body.Comment)
	switch {
	case err == nil:
		c.JSON(http.StatusCreated, item)
	case err == ErrNotEligible:
		writeError(c, http.StatusForbidden, "REVIEW_NOT_ELIGIBLE", "A valid ticket is required to review this event.")
	case err == ErrDuplicate:
		writeError(c, http.StatusConflict, "REVIEW_EXISTS", "You already reviewed this event.")
	default:
		writeError(c, http.StatusBadRequest, "VALIDATION_FAILED", "Invalid review.")
	}
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
