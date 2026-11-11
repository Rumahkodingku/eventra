package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"
)

const (
	defaultHTTPAddr          = ":8080"
	defaultWebOrigin         = "http://localhost:3000"
	defaultDatabaseURL       = "eventra:eventra@tcp(localhost:3306)/eventra?parseTime=true&charset=utf8mb4&loc=UTC"
	defaultRedisURL          = "redis://localhost:6379/0"
	defaultLogLevel          = "info"
	defaultJWTSecret         = "dev-only-change-me"
	defaultAccessTTL         = 15
	defaultRefreshTTL        = 720
	defaultCookieSecure      = false
	defaultS3Endpoint        = "localhost:9000"
	defaultS3AccessKey       = "minioadmin"
	defaultS3SecretKey       = "minioadmin"
	defaultS3Bucket          = "eventra"
	defaultS3PublicBase      = "http://localhost:9000/eventra"
	defaultMockPaymentSecret = "mock-payment-secret"
	defaultDocsEnabled       = true
)

type Config struct {
	AppEnv            string
	HTTPAddr          string
	WebOrigin         string
	DatabaseURL       string
	RedisURL          string
	LogLevel          string
	JWTSecret         string
	AccessTTLMin      int
	RefreshTTLHours   int
	CookieSecure      bool
	S3Endpoint        string
	S3AccessKey       string
	S3SecretKey       string
	S3Bucket          string
	S3UseSSL          bool
	S3PublicBase      string
	MockPaymentSecret string
	DocsEnabled       bool
}

func Load() (Config, error) {
	cfg := Config{
		AppEnv:            getenv("APP_ENV", "development"),
		HTTPAddr:          getenv("HTTP_ADDR", defaultHTTPAddr),
		WebOrigin:         getenv("WEB_ORIGIN", defaultWebOrigin),
		DatabaseURL:       getenv("DATABASE_URL", defaultDatabaseURL),
		RedisURL:          getenv("REDIS_URL", defaultRedisURL),
		LogLevel:          getenv("LOG_LEVEL", defaultLogLevel),
		JWTSecret:         getenv("JWT_SECRET", defaultJWTSecret),
		AccessTTLMin:      getenvInt("JWT_ACCESS_TTL_MINUTES", defaultAccessTTL),
		RefreshTTLHours:   getenvInt("JWT_REFRESH_TTL_HOURS", defaultRefreshTTL),
		CookieSecure:      getenvBool("COOKIE_SECURE", defaultCookieSecure),
		S3Endpoint:        getenv("S3_ENDPOINT", defaultS3Endpoint),
		S3AccessKey:       getenv("S3_ACCESS_KEY", defaultS3AccessKey),
		S3SecretKey:       getenv("S3_SECRET_KEY", defaultS3SecretKey),
		S3Bucket:          getenv("S3_BUCKET", defaultS3Bucket),
		S3UseSSL:          getenvBool("S3_USE_SSL", false),
		S3PublicBase:      getenv("S3_PUBLIC_BASE", defaultS3PublicBase),
		MockPaymentSecret: getenv("MOCK_PAYMENT_SECRET", defaultMockPaymentSecret),
		DocsEnabled:       getenvBool("API_DOCS_ENABLED", defaultDocsEnabled),
	}

	if err := cfg.Validate(); err != nil {
		return Config{}, err
	}
	return cfg, nil
}

func (c Config) Validate() error {
	if c.AppEnv == "" {
		return fmt.Errorf("APP_ENV is required")
	}
	if c.HTTPAddr == "" {
		return fmt.Errorf("HTTP_ADDR is required")
	}
	if c.WebOrigin == "" {
		return fmt.Errorf("WEB_ORIGIN is required")
	}
	if c.DatabaseURL == "" {
		return fmt.Errorf("DATABASE_URL is required")
	}
	if c.RedisURL == "" {
		return fmt.Errorf("REDIS_URL is required")
	}
	switch strings.ToLower(c.LogLevel) {
	case "debug", "info", "warn", "error":
	default:
		return fmt.Errorf("LOG_LEVEL must be debug, info, warn, or error")
	}
	if c.JWTSecret == "" {
		return fmt.Errorf("JWT_SECRET is required")
	}
	if c.AccessTTLMin <= 0 {
		return fmt.Errorf("JWT_ACCESS_TTL_MINUTES must be greater than zero")
	}
	if c.RefreshTTLHours <= 0 {
		return fmt.Errorf("JWT_REFRESH_TTL_HOURS must be greater than zero")
	}
	if c.AppEnv == "production" {
		if c.DatabaseURL == defaultDatabaseURL {
			return fmt.Errorf("DATABASE_URL must be set in production")
		}
		if c.RedisURL == defaultRedisURL {
			return fmt.Errorf("REDIS_URL must be set in production")
		}
		if c.JWTSecret == defaultJWTSecret {
			return fmt.Errorf("JWT_SECRET must be set in production")
		}
		if !c.CookieSecure {
			return fmt.Errorf("COOKIE_SECURE must be true in production")
		}
	}
	return nil
}

func getenv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

func getenvInt(key string, fallback int) int {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	parsed, err := strconv.Atoi(value)
	if err != nil {
		return fallback
	}
	return parsed
}

func getenvBool(key string, fallback bool) bool {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	parsed, err := strconv.ParseBool(value)
	if err != nil {
		return fallback
	}
	return parsed
}
