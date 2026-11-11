package httpserver

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"log/slog"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"

	"github.com/eventra/eventra/apps/api/internal/modules/catalog"
	"github.com/eventra/eventra/apps/api/internal/modules/identity"
)

type Dependencies struct {
	DB      *gorm.DB
	Redis   *redis.Client
	Auth    *identity.Handler
	Catalog *catalog.Handler
}

func NewRouter(cfg Config, log *slog.Logger, deps Dependencies) *gin.Engine {
	router := gin.New()
	router.Use(RequestID())
	router.Use(Recovery(log))
	router.Use(RequestLogger(log))
	router.Use(BodyLimit(1 << 20))
	router.Use(Timeout(15 * time.Second))
	router.Use(CORS(cfg.WebOrigin))

	v1 := router.Group("/api/v1")
	if deps.Auth != nil {
		v1.Use(deps.Auth.CSRF())
		deps.Auth.RegisterRoutes(v1)
	}
	if deps.Catalog != nil && deps.Auth != nil {
		deps.Catalog.RegisterRoutes(v1, deps.Auth)
	}
	v1.GET("/health/live", live)
	v1.GET("/health/ready", ready(deps))
	return router
}

type Config struct {
	WebOrigin string
}

func live(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

func ready(deps Dependencies) gin.HandlerFunc {
	return func(c *gin.Context) {
		if deps.DB == nil || deps.Redis == nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{"status": "degraded"})
			return
		}
		db, err := deps.DB.DB()
		if err != nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{"status": "degraded"})
			return
		}
		if err := db.PingContext(c.Request.Context()); err != nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{"status": "degraded"})
			return
		}
		if err := deps.Redis.Ping(c.Request.Context()).Err(); err != nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{"status": "degraded"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	}
}

func RequestID() gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.GetHeader("X-Request-ID")
		if id == "" {
			id = newRequestID()
		}
		c.Set("request_id", id)
		c.Header("X-Request-ID", id)
		c.Next()
	}
}

func RequestLogger(log *slog.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		c.Next()
		log.Info("http_request",
			"request_id", c.GetString("request_id"),
			"method", c.Request.Method,
			"path", c.Request.URL.Path,
			"status", c.Writer.Status(),
			"latency_ms", time.Since(start).Milliseconds(),
		)
	}
}

func Recovery(log *slog.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if recovered := recover(); recovered != nil {
				log.Error("panic_recovered", "request_id", c.GetString("request_id"), "error", fmt.Sprint(recovered))
				c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
					"error": gin.H{
						"code":       "INTERNAL",
						"message":    "Internal server error.",
						"request_id": c.GetString("request_id"),
					},
				})
			}
		}()
		c.Next()
	}
}

func CORS(origin string) gin.HandlerFunc {
	return func(c *gin.Context) {
		if requestOrigin := c.GetHeader("Origin"); requestOrigin != "" && requestOrigin == origin {
			c.Header("Access-Control-Allow-Origin", origin)
			c.Header("Access-Control-Allow-Credentials", "true")
			c.Header("Access-Control-Allow-Headers", "Content-Type, X-CSRF-Token, X-Request-ID, Idempotency-Key")
			c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
			c.Header("Vary", "Origin")
		}
		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	}
}

func BodyLimit(limit int64) gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.Request.Body != nil {
			c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, limit)
		}
		c.Next()
	}
}

func Timeout(duration time.Duration) gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(c.Request.Context(), duration)
		defer cancel()
		c.Request = c.Request.WithContext(ctx)
		c.Next()
	}
}

func newRequestID() string {
	var bytes [16]byte
	if _, err := rand.Read(bytes[:]); err != nil {
		return fmt.Sprintf("req_%d", time.Now().UnixNano())
	}
	return "req_" + hex.EncodeToString(bytes[:])
}
