package main

import (
	"context"
	"errors"
	"log/slog"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/eventra/eventra/apps/api/internal/modules/analytics"
	"github.com/eventra/eventra/apps/api/internal/modules/cart"
	"github.com/eventra/eventra/apps/api/internal/modules/catalog"
	"github.com/eventra/eventra/apps/api/internal/modules/identity"
	"github.com/eventra/eventra/apps/api/internal/modules/inventory"
	"github.com/eventra/eventra/apps/api/internal/modules/notification"
	"github.com/eventra/eventra/apps/api/internal/modules/order"
	"github.com/eventra/eventra/apps/api/internal/modules/organization"
	"github.com/eventra/eventra/apps/api/internal/modules/review"
	"github.com/eventra/eventra/apps/api/internal/modules/ticket"
	"github.com/eventra/eventra/apps/api/internal/modules/wishlist"
	"github.com/eventra/eventra/apps/api/internal/platform/cache"
	"github.com/eventra/eventra/apps/api/internal/platform/config"
	"github.com/eventra/eventra/apps/api/internal/platform/database"
	"github.com/eventra/eventra/apps/api/internal/platform/httpserver"
	"github.com/eventra/eventra/apps/api/internal/platform/logger"
	"github.com/eventra/eventra/apps/api/internal/platform/storage"
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
	var imageStore *storage.ImageStore
	if store, err := storage.NewImageStore(startupCtx, storage.Config{
		Endpoint: cfg.S3Endpoint, AccessKey: cfg.S3AccessKey, SecretKey: cfg.S3SecretKey,
		Bucket: cfg.S3Bucket, UseSSL: cfg.S3UseSSL, PublicBase: cfg.S3PublicBase,
	}); err == nil {
		imageStore = store
	} else {
		log.Warn("image_storage_unavailable", "error", err)
	}
	catalogHandler := catalog.NewHandler(catalog.NewService(db), imageStore)
	inventoryService := inventory.NewService(db, 10*time.Minute)
	inventoryHandler := inventory.NewHandler(inventoryService)
	cartHandler := cart.NewHandler(cart.NewService(db, inventoryService))
	ticketService := ticket.NewService(db)
	ticketHandler := ticket.NewHandler(ticketService)
	notificationService := notification.NewService(db)
	notificationHandler := notification.NewHandler(notificationService)
	orderHandler := order.NewHandler(order.NewService(db, inventoryService, ticketService, notificationService), cfg.MockPaymentSecret)
	reviewHandler := review.NewHandler(review.NewService(db))
	wishlistHandler := wishlist.NewHandler(wishlist.NewService(db))
	analyticsHandler := analytics.NewHandler(analytics.NewService(db))
	organizationHandler := organization.NewHandler(organization.NewService(db))

	server := httpserver.NewServer(
		httpserver.ServerConfig{HTTPAddr: cfg.HTTPAddr, WebOrigin: cfg.WebOrigin},
		log,
		httpserver.Dependencies{
			DB: db, Redis: redisClient, Auth: authHandler,
			Catalog: catalogHandler, Inventory: inventoryHandler, Cart: cartHandler,
			Order: orderHandler, Ticket: ticketHandler,
			Notification: notificationHandler, Review: reviewHandler,
			Wishlist: wishlistHandler, Analytics: analyticsHandler,
			Organization: organizationHandler,
		},
	)

	if err := server.Run(ctx); err != nil && !errors.Is(err, context.Canceled) {
		log.Error("server_error", "error", err)
		os.Exit(1)
	}
	log.Info("api_stopped")
}
