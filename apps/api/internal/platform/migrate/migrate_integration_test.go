//go:build integration

package migrate

import (
	"os"
	"path/filepath"
	"testing"
)

func TestMigrationUpDownUp(t *testing.T) {
	dsn := os.Getenv("TEST_DATABASE_URL")
	if dsn == "" {
		t.Skip("TEST_DATABASE_URL is not set")
	}
	dir, err := filepath.Abs("../../../migrations")
	if err != nil {
		t.Fatalf("resolve migrations dir: %v", err)
	}
	if _, err := os.Stat(dir); err != nil {
		t.Fatalf("migrations dir missing: %v", err)
	}

	if err := Up(dsn, dir); err != nil {
		t.Fatalf("Up() error = %v", err)
	}
	if err := Down(dsn, dir); err != nil {
		t.Fatalf("Down() error = %v", err)
	}
	if err := Up(dsn, dir); err != nil {
		t.Fatalf("second Up() error = %v", err)
	}
}
