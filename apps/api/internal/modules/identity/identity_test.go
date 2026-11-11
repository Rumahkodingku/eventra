package identity

import (
	"testing"
	"time"
)

func TestPasswordHashRoundTrip(t *testing.T) {
	hash, err := HashPassword("demo12345")
	if err != nil {
		t.Fatalf("HashPassword() error = %v", err)
	}
	if !VerifyPassword(hash, "demo12345") {
		t.Fatal("VerifyPassword() = false, want true")
	}
	if VerifyPassword(hash, "wrong-password") {
		t.Fatal("VerifyPassword() = true for wrong password")
	}
}

func TestAccessTokenRoundTrip(t *testing.T) {
	service := &Service{
		cfg: Config{JWTSecret: "test-secret", AccessTTL: 0},
		now: time.Now,
	}
	service.cfg.AccessTTL = 15 * time.Minute

	token, _, err := service.issueAccessToken("user-1", "session-1")
	if err != nil {
		t.Fatalf("issueAccessToken() error = %v", err)
	}
	claims, err := service.parseAccessToken(token)
	if err != nil {
		t.Fatalf("parseAccessToken() error = %v", err)
	}
	if claims.Subject != "user-1" || claims.SessionID != "session-1" {
		t.Fatalf("unexpected claims: %+v", claims)
	}
}
