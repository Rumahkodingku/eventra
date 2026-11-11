//go:build integration

package identity

import (
	"context"
	"os"
	"testing"
	"time"

	"github.com/eventra/eventra/apps/api/internal/platform/database"
)

func TestAuthLifecycleIntegration(t *testing.T) {
	dsn := os.Getenv("TEST_IDENTITY_DATABASE_URL")
	if dsn == "" {
		t.Skip("TEST_IDENTITY_DATABASE_URL is not set")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
	defer cancel()

	db, err := database.Open(ctx, dsn)
	if err != nil {
		t.Fatalf("database.Open() error = %v", err)
	}
	defer database.Close(db)

	service := NewService(db, Config{
		JWTSecret:  "integration-secret",
		AccessTTL:  15 * time.Minute,
		RefreshTTL: time.Hour,
	})

	result, err := service.Login(ctx, "customer@demo.local", "demo12345", nil)
	if err != nil {
		t.Fatalf("Login() error = %v", err)
	}
	if result.User.Role != "CUSTOMER" {
		t.Fatalf("role = %q, want CUSTOMER", result.User.Role)
	}
	if _, err := service.ParseAccessToken(result.AccessToken); err != nil {
		t.Fatalf("ParseAccessToken() error = %v", err)
	}
	ok, err := service.HasPermission(ctx, result.User.ID, "wishlist:write")
	if err != nil || !ok {
		t.Fatalf("customer wishlist permission = %v, %v", ok, err)
	}
	ok, err = service.HasPermission(ctx, result.User.ID, "event:write")
	if err != nil || ok {
		t.Fatalf("customer event permission = %v, %v; want false", ok, err)
	}

	organizer, err := service.Login(ctx, "organizer@demo.local", "demo12345", nil)
	if err != nil {
		t.Fatalf("organizer Login() error = %v", err)
	}
	ok, err = service.HasPermission(ctx, organizer.User.ID, "event:write")
	if err != nil || !ok {
		t.Fatalf("organizer event permission = %v, %v; want true", ok, err)
	}
	ok, err = service.HasPermission(ctx, organizer.User.ID, "settings:write")
	if err != nil || !ok {
		t.Fatalf("organizer settings permission = %v, %v; want true", ok, err)
	}

	refreshed, err := service.Refresh(ctx, result.RefreshToken)
	if err != nil {
		t.Fatalf("Refresh() error = %v", err)
	}
	if refreshed.RefreshToken == result.RefreshToken {
		t.Fatal("refresh token was not rotated")
	}
	if _, err := service.Refresh(ctx, result.RefreshToken); err == nil {
		t.Fatal("reused refresh token was accepted")
	}

	guestID, secret, _, err := service.CreateGuest(ctx)
	if err != nil {
		t.Fatalf("CreateGuest() error = %v", err)
	}
	resolved, err := service.ResolveGuest(ctx, secret)
	if err != nil || resolved != guestID {
		t.Fatalf("ResolveGuest() = %q, %v; want %q", resolved, err, guestID)
	}
	if _, err := service.ResolveGuest(ctx, "invalid"); err == nil {
		t.Fatal("invalid guest secret was accepted")
	}
}
