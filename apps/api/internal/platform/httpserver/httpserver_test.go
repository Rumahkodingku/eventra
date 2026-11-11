package httpserver

import (
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"testing"
)

func testRouter() http.Handler {
	return NewRouter(
		Config{WebOrigin: "http://localhost:3000"},
		slog.New(slog.NewTextHandler(io.Discard, nil)),
		Dependencies{},
	)
}

func TestLive(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/api/v1/health/live", nil)
	res := httptest.NewRecorder()

	testRouter().ServeHTTP(res, req)

	if res.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", res.Code, http.StatusOK)
	}
	if res.Header().Get("X-Request-ID") == "" {
		t.Fatal("expected X-Request-ID header")
	}
}

func TestDocsRouteCanBeDisabled(t *testing.T) {
	router := NewRouter(
		Config{WebOrigin: "http://localhost:3000", DocsEnabled: false},
		slog.New(slog.NewTextHandler(io.Discard, nil)),
		Dependencies{},
	)
	res := httptest.NewRecorder()
	router.ServeHTTP(res, httptest.NewRequest(http.MethodGet, "/docs", nil))
	if res.Code != http.StatusNotFound {
		t.Fatalf("status = %d, want %d", res.Code, http.StatusNotFound)
	}
}

func TestDocsRouteEnabled(t *testing.T) {
	router := NewRouter(
		Config{WebOrigin: "http://localhost:3000", DocsEnabled: true},
		slog.New(slog.NewTextHandler(io.Discard, nil)),
		Dependencies{},
	)
	res := httptest.NewRecorder()
	router.ServeHTTP(res, httptest.NewRequest(http.MethodGet, "/docs", nil))
	if res.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", res.Code, http.StatusOK)
	}
}

func TestReadyWithoutDependencies(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/api/v1/health/ready", nil)
	res := httptest.NewRecorder()

	testRouter().ServeHTTP(res, req)

	if res.Code != http.StatusServiceUnavailable {
		t.Fatalf("status = %d, want %d", res.Code, http.StatusServiceUnavailable)
	}
}

func TestCORSAllowlist(t *testing.T) {
	req := httptest.NewRequest(http.MethodOptions, "/api/v1/health/live", nil)
	req.Header.Set("Origin", "http://localhost:3000")
	res := httptest.NewRecorder()

	testRouter().ServeHTTP(res, req)

	if res.Code != http.StatusNoContent {
		t.Fatalf("status = %d, want %d", res.Code, http.StatusNoContent)
	}
	if res.Header().Get("Access-Control-Allow-Origin") != "http://localhost:3000" {
		t.Fatalf("unexpected allow origin: %q", res.Header().Get("Access-Control-Allow-Origin"))
	}
}
