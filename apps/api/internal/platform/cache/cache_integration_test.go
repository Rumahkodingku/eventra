//go:build integration

package cache

import (
	"context"
	"os"
	"testing"
	"time"
)

func TestRedisIntegration(t *testing.T) {
	rawURL := os.Getenv("TEST_REDIS_URL")
	if rawURL == "" {
		t.Skip("TEST_REDIS_URL is not set")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	client, err := Open(ctx, rawURL)
	if err != nil {
		t.Fatalf("Open() error = %v", err)
	}
	defer Close(client)

	if err := client.Set(ctx, "eventra:test", "ok", time.Minute).Err(); err != nil {
		t.Fatalf("Set() error = %v", err)
	}
	value, err := client.Get(ctx, "eventra:test").Result()
	if err != nil {
		t.Fatalf("Get() error = %v", err)
	}
	if value != "ok" {
		t.Fatalf("Get() = %q, want ok", value)
	}
}
