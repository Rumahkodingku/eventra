package config

import "testing"

func TestLoadDefaults(t *testing.T) {
	t.Setenv("APP_ENV", "")
	t.Setenv("HTTP_ADDR", "")
	t.Setenv("WEB_ORIGIN", "")
	t.Setenv("DATABASE_URL", "")
	t.Setenv("REDIS_URL", "")
	t.Setenv("LOG_LEVEL", "")
	t.Setenv("API_DOCS_ENABLED", "")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("Load() error = %v", err)
	}
	if cfg.HTTPAddr != defaultHTTPAddr {
		t.Fatalf("HTTPAddr = %q, want %q", cfg.HTTPAddr, defaultHTTPAddr)
	}
	if cfg.WebOrigin != defaultWebOrigin {
		t.Fatalf("WebOrigin = %q, want %q", cfg.WebOrigin, defaultWebOrigin)
	}
	if !cfg.DocsEnabled {
		t.Fatal("DocsEnabled = false, want true by default")
	}
}

func TestDocsCanBeDisabled(t *testing.T) {
	t.Setenv("APP_ENV", "development")
	t.Setenv("DATABASE_URL", defaultDatabaseURL)
	t.Setenv("REDIS_URL", defaultRedisURL)
	t.Setenv("API_DOCS_ENABLED", "false")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("Load() error = %v", err)
	}
	if cfg.DocsEnabled {
		t.Fatal("DocsEnabled = true, want false")
	}
}

func TestValidateRejectsUnknownLogLevel(t *testing.T) {
	cfg := Config{
		AppEnv:      "development",
		HTTPAddr:    defaultHTTPAddr,
		WebOrigin:   defaultWebOrigin,
		DatabaseURL: defaultDatabaseURL,
		RedisURL:    defaultRedisURL,
		LogLevel:    "verbose",
	}
	if err := cfg.Validate(); err == nil {
		t.Fatal("Validate() expected error for unknown log level")
	}
}

func TestValidateRequiresProductionInfrastructure(t *testing.T) {
	cfg := Config{
		AppEnv:      "production",
		HTTPAddr:    defaultHTTPAddr,
		WebOrigin:   defaultWebOrigin,
		DatabaseURL: defaultDatabaseURL,
		RedisURL:    defaultRedisURL,
		LogLevel:    defaultLogLevel,
	}
	if err := cfg.Validate(); err == nil {
		t.Fatal("Validate() expected production infrastructure error")
	}
}
