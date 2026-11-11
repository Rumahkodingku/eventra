package identity

import (
	"crypto/subtle"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

const (
	AccessCookieName  = "eventra_at"
	RefreshCookieName = "eventra_rt"
	CSRFCookieName    = "eventra_csrf"
	GuestCookieName   = "eventra_guest"
)

type Handler struct {
	service      *Service
	cookieSecure bool
	limiter      *attemptLimiter
}

func NewHandler(service *Service, cookieSecure bool) *Handler {
	return &Handler{
		service:      service,
		cookieSecure: cookieSecure,
		limiter:      newAttemptLimiter(20, time.Minute),
	}
}

func (h *Handler) RegisterRoutes(router *gin.RouterGroup) {
	auth := router.Group("/auth")
	auth.POST("/login", h.login)
	auth.POST("/register", h.register)
	auth.POST("/refresh", h.refresh)
	auth.POST("/guest", h.guest)
	auth.POST("/logout", h.requireAuth(), h.logout)
	auth.POST("/logout-all", h.requireAuth(), h.logoutAll)
	auth.GET("/me", h.requireAuth(), h.me)
}

type loginRequest struct {
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type registerRequest struct {
	Name     string  `json:"name" binding:"required"`
	Email    string  `json:"email" binding:"required"`
	Password string  `json:"password" binding:"required"`
	Phone    *string `json:"phone"`
}

func (h *Handler) login(c *gin.Context) {
	if !h.limiter.allow(c.ClientIP()) {
		writeError(c, http.StatusTooManyRequests, "RATE_LIMITED", "Too many attempts. Try again later.")
		return
	}
	var request loginRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		writeError(c, http.StatusBadRequest, "VALIDATION_FAILED", "Email and password are required.")
		return
	}
	result, err := h.service.Login(c.Request.Context(), request.Email, request.Password, userAgent(c))
	if err != nil {
		writeError(c, http.StatusUnauthorized, "AUTH_INVALID", "Email or password does not match.")
		return
	}
	h.setCookies(c, result)
	c.JSON(http.StatusOK, gin.H{"user": result.User})
}

func (h *Handler) register(c *gin.Context) {
	if !h.limiter.allow(c.ClientIP()) {
		writeError(c, http.StatusTooManyRequests, "RATE_LIMITED", "Too many attempts. Try again later.")
		return
	}
	var request registerRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		writeError(c, http.StatusBadRequest, "VALIDATION_FAILED", "Name, email, and password are required.")
		return
	}
	result, err := h.service.Register(c.Request.Context(), request.Name, request.Email, request.Password, request.Phone)
	if err != nil {
		if err == ErrEmailExists {
			writeError(c, http.StatusConflict, "CONFLICT", "Email is already registered.")
			return
		}
		writeError(c, http.StatusBadRequest, "VALIDATION_FAILED", "Registration failed.")
		return
	}
	h.setCookies(c, result)
	c.JSON(http.StatusCreated, gin.H{"user": result.User})
}

func (h *Handler) refresh(c *gin.Context) {
	raw, err := c.Cookie(RefreshCookieName)
	if err != nil || raw == "" {
		writeError(c, http.StatusUnauthorized, "AUTH_REQUIRED", "Refresh session is missing.")
		return
	}
	result, err := h.service.Refresh(c.Request.Context(), raw)
	if err != nil {
		h.clearCookies(c)
		writeError(c, http.StatusUnauthorized, "AUTH_INVALID", "Refresh session is invalid.")
		return
	}
	h.setCookies(c, result)
	c.JSON(http.StatusOK, gin.H{"user": result.User})
}

func (h *Handler) guest(c *gin.Context) {
	if raw, err := c.Cookie(GuestCookieName); err == nil && raw != "" {
		if _, err := h.service.ResolveGuest(c.Request.Context(), raw); err == nil {
			c.JSON(http.StatusOK, gin.H{"guest": true})
			return
		}
	}
	_, secret, expiresAt, err := h.service.CreateGuest(c.Request.Context())
	if err != nil {
		writeError(c, http.StatusInternalServerError, "INTERNAL", "Could not create guest session.")
		return
	}
	c.SetSameSite(http.SameSiteLaxMode)
	c.SetCookie(GuestCookieName, secret, maxAge(expiresAt), "/", "", h.cookieSecure, true)
	c.JSON(http.StatusOK, gin.H{"guest": true})
}

func (h *Handler) logout(c *gin.Context) {
	sessionID := c.GetString("session_id")
	if sessionID != "" {
		_ = h.service.Logout(c.Request.Context(), sessionID)
	}
	h.clearCookies(c)
	c.Status(http.StatusNoContent)
}

func (h *Handler) logoutAll(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID != "" {
		_ = h.service.LogoutAll(c.Request.Context(), userID)
	}
	h.clearCookies(c)
	c.Status(http.StatusNoContent)
}

func (h *Handler) me(c *gin.Context) {
	user, err := h.service.Me(c.Request.Context(), c.GetString("user_id"))
	if err != nil {
		writeError(c, http.StatusUnauthorized, "AUTH_REQUIRED", "Not authenticated.")
		return
	}
	c.JSON(http.StatusOK, gin.H{"user": user})
}

func (h *Handler) setCookies(c *gin.Context, result AuthResult) {
	c.SetSameSite(http.SameSiteLaxMode)
	c.SetCookie(AccessCookieName, result.AccessToken, maxAge(result.AccessExpiresAt), "/", "", h.cookieSecure, true)
	c.SetCookie(RefreshCookieName, result.RefreshToken, maxAge(result.RefreshExpiresAt), "/api/v1/auth", "", h.cookieSecure, true)
	c.SetCookie(CSRFCookieName, result.CSRFToken, maxAge(result.RefreshExpiresAt), "/", "", h.cookieSecure, false)
}

func (h *Handler) clearCookies(c *gin.Context) {
	c.SetSameSite(http.SameSiteLaxMode)
	c.SetCookie(AccessCookieName, "", -1, "/", "", h.cookieSecure, true)
	c.SetCookie(RefreshCookieName, "", -1, "/api/v1/auth", "", h.cookieSecure, true)
	c.SetCookie(CSRFCookieName, "", -1, "/", "", h.cookieSecure, false)
}

func (h *Handler) requireAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		raw, err := c.Cookie(AccessCookieName)
		if err != nil || raw == "" {
			writeError(c, http.StatusUnauthorized, "AUTH_REQUIRED", "Authentication is required.")
			c.Abort()
			return
		}
		claims, err := h.service.ParseAccessToken(raw)
		if err != nil {
			writeError(c, http.StatusUnauthorized, "AUTH_INVALID", "Session is invalid or expired.")
			c.Abort()
			return
		}
		c.Set("user_id", claims.Subject)
		c.Set("session_id", claims.SessionID)
		c.Next()
	}
}

func (h *Handler) RequirePermission(permission string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetString("user_id")
		ok, err := h.service.HasPermission(c.Request.Context(), userID, permission)
		if err != nil || !ok {
			writeError(c, http.StatusForbidden, "AUTH_FORBIDDEN", "You do not have permission for this action.")
			c.Abort()
			return
		}
		c.Next()
	}
}

func (h *Handler) CSRF() gin.HandlerFunc {
	return func(c *gin.Context) {
		switch c.Request.Method {
		case http.MethodGet, http.MethodHead, http.MethodOptions:
			c.Next()
			return
		}
		_, accessErr := c.Cookie(AccessCookieName)
		_, refreshErr := c.Cookie(RefreshCookieName)
		if accessErr != nil && refreshErr != nil {
			c.Next()
			return
		}
		cookie, err := c.Cookie(CSRFCookieName)
		header := c.GetHeader("X-CSRF-Token")
		if err != nil || cookie == "" || header == "" || !constantTimeEqual(cookie, header) {
			writeError(c, http.StatusForbidden, "AUTH_FORBIDDEN", "CSRF validation failed.")
			c.Abort()
			return
		}
		c.Next()
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

func maxAge(expiresAt time.Time) int {
	seconds := int(time.Until(expiresAt).Seconds())
	if seconds < 0 {
		return 0
	}
	return seconds
}

func userAgent(c *gin.Context) *string {
	value := strings.TrimSpace(c.Request.UserAgent())
	if value == "" {
		return nil
	}
	return &value
}

func constantTimeEqual(left, right string) bool {
	return subtle.ConstantTimeCompare([]byte(left), []byte(right)) == 1
}
