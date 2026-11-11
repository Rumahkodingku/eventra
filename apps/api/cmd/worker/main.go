package main

import (
	"context"
	"log/slog"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/eventra/eventra/apps/api/internal/modules/inventory"
	"github.com/eventra/eventra/apps/api/internal/platform/config"
	"github.com/eventra/eventra/apps/api/internal/platform/database"
	"github.com/eventra/eventra/apps/api/internal/platform/logger"
	"github.com/eventra/eventra/apps/api/internal/platform/observability"
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

	db, err := database.Open(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Error("database_error", "error", err)
		os.Exit(1)
	}
	defer database.Close(db)

	service := inventory.NewService(db, 10*time.Minute)
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			log.Info("worker_stopped")
			return
		case <-ticker.C:
			count, err := service.ExpireDue(ctx, 100)
			if err != nil {
				log.Error("reservation_expiry_error", "error", err)
				continue
			}
			if count > 0 {
				log.Info("reservations_expired", "count", count)
				observability.Add("reservations_expired_total", int64(count))
			}
		}
	}
}
