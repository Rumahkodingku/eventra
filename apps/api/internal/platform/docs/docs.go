package docs

import (
	"bytes"
	_ "embed"
	"html/template"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	"github.com/eventra/eventra/apps/api/openapi"
)

//go:embed index.html
var indexHTML string

//go:embed assets/scalar.js
var scalarJS []byte

//go:embed assets/version.txt
var scalarVersion string

type Config struct {
	Enabled bool
	Version string
}

type Handler struct {
	enabled  bool
	version  string
	template *template.Template
}

func NewHandler(cfg Config) *Handler {
	version := cfg.Version
	if version == "" {
		version = strings.TrimSpace(scalarVersion)
	}
	if version == "" {
		version = "dev"
	}
	return &Handler{
		enabled:  cfg.Enabled,
		version:  version,
		template: template.Must(template.New("docs").Parse(indexHTML)),
	}
}

func (h *Handler) RegisterRoutes(router gin.IRoutes) {
	if !h.enabled {
		return
	}
	router.GET("/docs", h.docs)
	router.GET("/openapi.yaml", h.spec)
	router.GET("/docs/scalar.js", h.asset)
	router.GET("/favicon.ico", func(c *gin.Context) {
		c.Status(http.StatusNoContent)
	})
}

func (h *Handler) docs(c *gin.Context) {
	var output bytes.Buffer
	if err := h.template.Execute(&output, struct{ Version string }{Version: h.version}); err != nil {
		c.String(http.StatusInternalServerError, "Could not render API docs.")
		return
	}
	c.Header("Cache-Control", "no-cache")
	c.Data(http.StatusOK, "text/html; charset=utf-8", output.Bytes())
}

func (h *Handler) spec(c *gin.Context) {
	c.Header("Cache-Control", "no-cache")
	c.Data(http.StatusOK, "application/yaml; charset=utf-8", openapi.YAML)
}

func (h *Handler) asset(c *gin.Context) {
	c.Header("Cache-Control", "public, max-age=31536000, immutable")
	c.Data(http.StatusOK, "text/javascript; charset=utf-8", scalarJS)
}
