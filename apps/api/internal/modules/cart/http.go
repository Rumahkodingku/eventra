package cart

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
	group := router.Group("")
	group.Use(auth.Principal())
	group.GET("/cart", h.get)
	group.DELETE("/cart", h.clear)
	group.POST("/cart/items", h.addItem)
	group.PATCH("/cart/items/:itemId", h.updateItem)
	group.DELETE("/cart/items/:itemId", h.removeItem)
	group.POST("/cart/promo", h.applyPromo)
	group.DELETE("/cart/promo", h.removePromo)
	group.POST("/checkout/quote", h.quote)
}

func (h *Handler) get(c *gin.Context) {
	cart, err := h.service.Get(c.Request.Context(), c.GetString("principal_key"))
	if err != nil {
		writeError(c, http.StatusInternalServerError, "INTERNAL", "Could not load cart.")
		return
	}
	c.JSON(http.StatusOK, cart)
}

func (h *Handler) clear(c *gin.Context) {
	if err := h.service.Clear(c.Request.Context(), c.GetString("principal_key")); err != nil {
		writeError(c, http.StatusInternalServerError, "INTERNAL", "Could not clear cart.")
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *Handler) addItem(c *gin.Context) {
	var input AddItemInput
	if err := c.ShouldBindJSON(&input); err != nil {
		writeError(c, http.StatusBadRequest, "VALIDATION_FAILED", "Invalid cart item.")
		return
	}
	cart, err := h.service.AddItem(c.Request.Context(), c.GetString("principal_key"), input)
	if err != nil {
		writeError(c, http.StatusBadRequest, "VALIDATION_FAILED", "Could not add item.")
		return
	}
	c.JSON(http.StatusOK, cart)
}

func (h *Handler) updateItem(c *gin.Context) {
	var body struct {
		Quantity int `json:"quantity"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		writeError(c, http.StatusBadRequest, "VALIDATION_FAILED", "Invalid quantity.")
		return
	}
	cart, err := h.service.UpdateQuantity(c.Request.Context(), c.GetString("principal_key"), c.Param("itemId"), body.Quantity)
	if err != nil {
		writeError(c, http.StatusBadRequest, "VALIDATION_FAILED", "Could not update item.")
		return
	}
	c.JSON(http.StatusOK, cart)
}

func (h *Handler) removeItem(c *gin.Context) {
	cart, err := h.service.RemoveItem(c.Request.Context(), c.GetString("principal_key"), c.Param("itemId"))
	if err != nil {
		writeError(c, http.StatusBadRequest, "VALIDATION_FAILED", "Could not remove item.")
		return
	}
	c.JSON(http.StatusOK, cart)
}

func (h *Handler) applyPromo(c *gin.Context) {
	var body struct {
		Code string `json:"code"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		writeError(c, http.StatusBadRequest, "VALIDATION_FAILED", "Invalid promo.")
		return
	}
	cart, err := h.service.ApplyPromo(c.Request.Context(), c.GetString("principal_key"), body.Code)
	if err != nil {
		writeError(c, http.StatusUnprocessableEntity, "PROMO_INVALID", "Promo code is invalid.")
		return
	}
	c.JSON(http.StatusOK, cart)
}

func (h *Handler) removePromo(c *gin.Context) {
	cart, err := h.service.RemovePromo(c.Request.Context(), c.GetString("principal_key"))
	if err != nil {
		writeError(c, http.StatusInternalServerError, "INTERNAL", "Could not remove promo.")
		return
	}
	c.JSON(http.StatusOK, cart)
}

func (h *Handler) quote(c *gin.Context) {
	var input QuoteInput
	if err := c.ShouldBindJSON(&input); err != nil {
		writeError(c, http.StatusBadRequest, "VALIDATION_FAILED", "Invalid quote request.")
		return
	}
	quote, err := h.service.Quote(c.Request.Context(), c.GetString("principal_key"), input)
	if err != nil {
		if err == ErrConflict {
			writeError(c, http.StatusConflict, "INVENTORY_CONFLICT", "One or more selected items are no longer available.")
			return
		}
		if err == ErrPromo {
			writeError(c, http.StatusUnprocessableEntity, "PROMO_INVALID", "Promo code is invalid.")
			return
		}
		writeError(c, http.StatusBadRequest, "VALIDATION_FAILED", "Could not quote checkout.")
		return
	}
	c.JSON(http.StatusOK, quote)
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
