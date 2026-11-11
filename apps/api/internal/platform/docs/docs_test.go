package docs

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestHandlerServesDocsSpecAndAsset(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	NewHandler(Config{Enabled: true, Version: "1.78.0"}).RegisterRoutes(router)

	docs := httptest.NewRecorder()
	router.ServeHTTP(docs, httptest.NewRequest(http.MethodGet, "/docs", nil))
	if docs.Code != http.StatusOK {
		t.Fatalf("GET /docs status = %d, want 200", docs.Code)
	}
	for _, expected := range []string{"Eventra API", "/openapi.yaml", "eventra_csrf", "X-CSRF-Token"} {
		if !strings.Contains(docs.Body.String(), expected) {
			t.Fatalf("GET /docs missing %q", expected)
		}
	}

	spec := httptest.NewRecorder()
	router.ServeHTTP(spec, httptest.NewRequest(http.MethodGet, "/openapi.yaml", nil))
	if spec.Code != http.StatusOK {
		t.Fatalf("GET /openapi.yaml status = %d, want 200", spec.Code)
	}
	if !strings.Contains(spec.Header().Get("Content-Type"), "yaml") {
		t.Fatalf("GET /openapi.yaml content-type = %q, want yaml", spec.Header().Get("Content-Type"))
	}
	if !strings.Contains(spec.Body.String(), "openapi: 3.1.0") {
		t.Fatal("GET /openapi.yaml missing OpenAPI version")
	}

	asset := httptest.NewRecorder()
	router.ServeHTTP(asset, httptest.NewRequest(http.MethodGet, "/docs/scalar.js", nil))
	if asset.Code != http.StatusOK {
		t.Fatalf("GET /docs/scalar.js status = %d, want 200", asset.Code)
	}
	if asset.Body.Len() < 1000 {
		t.Fatalf("GET /docs/scalar.js body = %d bytes, want > 1000", asset.Body.Len())
	}

	favicon := httptest.NewRecorder()
	router.ServeHTTP(favicon, httptest.NewRequest(http.MethodGet, "/favicon.ico", nil))
	if favicon.Code != http.StatusNoContent {
		t.Fatalf("GET /favicon.ico status = %d, want 204", favicon.Code)
	}
}

func TestHandlerDisabledReturnsNotFound(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	NewHandler(Config{Enabled: false, Version: "1.78.0"}).RegisterRoutes(router)

	for _, path := range []string{"/docs", "/openapi.yaml", "/docs/scalar.js"} {
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, httptest.NewRequest(http.MethodGet, path, nil))
		if recorder.Code != http.StatusNotFound {
			t.Fatalf("GET %s status = %d, want 404", path, recorder.Code)
		}
	}
}
