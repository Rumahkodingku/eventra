//go:build integration

package database

import (
	"context"
	"os"
	"testing"
	"time"
)

func TestMySQLIntegration(t *testing.T) {
	dsn := os.Getenv("TEST_DATABASE_URL")
	if dsn == "" {
		t.Skip("TEST_DATABASE_URL is not set")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	db, err := Open(ctx, dsn)
	if err != nil {
		t.Fatalf("Open() error = %v", err)
	}
	defer Close(db)

	sqlDB, err := db.DB()
	if err != nil {
		t.Fatalf("DB() error = %v", err)
	}
	if err := sqlDB.PingContext(ctx); err != nil {
		t.Fatalf("PingContext() error = %v", err)
	}
}
