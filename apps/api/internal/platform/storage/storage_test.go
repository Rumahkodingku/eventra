package storage

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync/atomic"
	"testing"
	"time"
)

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

func TestImageStoreCreatesBucketPresignsAndDeletes(t *testing.T) {
	var heads, creates, deletes, cors atomic.Int32
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodHead:
			heads.Add(1)
			w.WriteHeader(http.StatusNotFound)
		case http.MethodPut:
			if r.URL.Query().Has("cors") {
				cors.Add(1)
			} else {
				creates.Add(1)
			}
			w.WriteHeader(http.StatusOK)
		case http.MethodDelete:
			deletes.Add(1)
			w.WriteHeader(http.StatusNoContent)
		default:
			t.Fatalf("unexpected method %s %s", r.Method, r.URL.Path)
		}
	}))
	defer server.Close()

	store, err := NewImageStore(context.Background(), Config{
		Endpoint: server.URL, Region: "garage", AccessKey: "test",
		SecretKey: "test", Bucket: "eventra-uploads",
		CorsOrigins: "http://localhost:3000",
		PublicBase:  server.URL + "/eventra-uploads",
	})
	if err != nil {
		t.Fatalf("NewImageStore() error = %v", err)
	}
	if heads.Load() != 1 || creates.Load() != 1 {
		t.Fatalf("bucket checks = %d, creates = %d; want 1, 1", heads.Load(), creates.Load())
	}
	if cors.Load() != 1 {
		t.Fatalf("cors updates = %d, want 1", cors.Load())
	}

	url, err := store.PresignPut(context.Background(), "events/test.png", "image/png", time.Minute)
	if err != nil {
		t.Fatalf("PresignPut() error = %v", err)
	}
	for _, expected := range []string{"eventra-uploads/events/test.png", "X-Amz-Signature", "X-Amz-Credential"} {
		if !strings.Contains(url, expected) {
			t.Fatalf("presigned URL missing %q: %s", expected, url)
		}
	}

	if err := store.Delete(context.Background(), "events/test.png"); err != nil {
		t.Fatalf("Delete() error = %v", err)
	}
	if deletes.Load() != 1 {
		t.Fatalf("deletes = %d, want 1", deletes.Load())
	}
	if got := store.PublicURL("events/test.png"); got != server.URL+"/eventra-uploads/events/test.png" {
		t.Fatalf("PublicURL() = %q", got)
	}
}
