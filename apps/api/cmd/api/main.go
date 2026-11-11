package main

import (
	"context"
	"errors"
	"log/slog"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/eventra/eventra/apps/api/internal/modules/identity"
	"github.com/eventra/eventra/apps/api/internal/platform/cache"
	"github.com/eventra/eventra/apps/api/internal/platform/config"
	"github.com/eventra/eventra/apps/api/internal/platform/database"
	"github.com/eventra/eventra/apps/api/internal/platform/httpserver"
	"github.com/eventra/eventra/apps/api/internal/platform/logger"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		slog.Error("config_error", "error", err)
		os.Exit(1)
	}

	log := logger.New(cfg.LogLevel)
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	startupCtx, cancel := context.WithTimeout(ctx, 15*time.Second)
	defer cancel()

	db, err := database.Open(startupCtx, cfg.DatabaseURL)
	if err != nil {
		log.Error("database_error", "error", err)
		os.Exit(1)
	}
	defer func() {
		if err := database.Close(db); err != nil {
			log.Error("database_close_error", "error", err)
		}
	}()

	redisClient, err := cache.Open(startupCtx, cfg.RedisURL)
	if err != nil {
		log.Error("redis_error", "error", err)
		os.Exit(1)
	}
	defer func() {
		if err := cache.Close(redisClient); err != nil {
			log.Error("redis_close_error", "error", err)
		}
	}()

	authService := identity.NewService(db, identity.Config{
		JWTSecret:  cfg.JWTSecret,
		AccessTTL:  time.Duration(cfg.AccessTTLMin) * time.Minute,
		RefreshTTL: time.Duration(cfg.RefreshTTLHours) * time.Hour,
	})
	authHandler := identity.NewHandler(authService, cfg.CookieSecure)

	server := httpserver.NewServer(
		httpserver.ServerConfig{HTTPAddr: cfg.HTTPAddr, WebOrigin: cfg.WebOrigin},
		log,
		httpserver.Dependencies{DB: db, Redis: redisClient, Auth: authHandler},
	)

	if err := server.Run(ctx); err != nil && !errors.Is(err, context.Canceled) {
		log.Error("server_error", "error", err)
		os.Exit(1)
	}
	log.Info("api_stopped")
}
