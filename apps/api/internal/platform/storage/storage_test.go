package storage

import "testing"

func TestValidateImage(t *testing.T) {
	if err := ValidateImage("image/jpeg", 1024); err != nil {
		t.Fatalf("valid image rejected: %v", err)
	}
	if err := ValidateImage("image/svg+xml", 1024); err == nil {
		t.Fatal("svg must be rejected")
	}
	if err := ValidateImage("image/jpeg", MaxImageBytes+1); err == nil {
		t.Fatal("oversized image must be rejected")
	}
}

func TestBuildImageKey(t *testing.T) {
	key, err := BuildImageKey("events", "image/png")
	if err != nil {
		t.Fatalf("BuildImageKey() error = %v", err)
	}
	if len(key) < len("events/") || key[:len("events/")] != "events/" {
		t.Fatalf("key = %q, want events/ prefix", key)
	}
	if key[len(key)-4:] != ".png" {
		t.Fatalf("key = %q, want .png suffix", key)
	}
}
