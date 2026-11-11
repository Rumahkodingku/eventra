package config

import (
	"fmt"
	"os"
	"strings"
)

const (
	defaultHTTPAddr    = ":8080"
	defaultWebOrigin   = "http://localhost:3000"
	defaultDatabaseURL = "eventra:eventra@tcp(localhost:3306)/eventra?parseTime=true&charset=utf8mb4&loc=UTC"
	defaultRedisURL    = "redis://localhost:6379/0"
	defaultLogLevel    = "info"
)

type Config struct {
	AppEnv      string
	HTTPAddr    string
	WebOrigin   string
	DatabaseURL string
	RedisURL    string
	LogLevel    string
}

func Load() (Config, error) {
	cfg := Config{
		AppEnv:      getenv("APP_ENV", "development"),
		HTTPAddr:    getenv("HTTP_ADDR", defaultHTTPAddr),
		WebOrigin:   getenv("WEB_ORIGIN", defaultWebOrigin),
		DatabaseURL: getenv("DATABASE_URL", defaultDatabaseURL),
		RedisURL:    getenv("REDIS_URL", defaultRedisURL),
		LogLevel:    getenv("LOG_LEVEL", defaultLogLevel),
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
	if c.AppEnv == "production" {
		if c.DatabaseURL == defaultDatabaseURL {
			return fmt.Errorf("DATABASE_URL must be set in production")
		}
		if c.RedisURL == defaultRedisURL {
			return fmt.Errorf("REDIS_URL must be set in production")
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
