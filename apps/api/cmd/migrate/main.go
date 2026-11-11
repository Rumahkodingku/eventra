package main

import (
	"fmt"
	"log/slog"
	"os"

	"github.com/eventra/eventra/apps/api/internal/platform/config"
	"github.com/eventra/eventra/apps/api/internal/platform/migrate"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		slog.Error("config_error", "error", err)
		os.Exit(1)
	}

	direction := "up"
	if len(os.Args) > 1 {
		direction = os.Args[1]
	}
	dir := os.Getenv("MIGRATIONS_DIR")
	if dir == "" {
		dir = "./migrations"
	}

	switch direction {
	case "up":
		err = migrate.Up(cfg.DatabaseURL, dir)
	case "down":
		err = migrate.Down(cfg.DatabaseURL, dir)
	default:
		err = fmt.Errorf("usage: migrate [up|down]")
	}
	if err != nil {
		slog.Error("migration_error", "error", err, "direction", direction)
		os.Exit(1)
	}
	slog.Info("migration_complete", "direction", direction)
}
