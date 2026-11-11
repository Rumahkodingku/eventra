package httpserver

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

type ServerConfig struct {
	HTTPAddr  string
	WebOrigin string
}

type Server struct {
	http   *http.Server
	log    *slog.Logger
	router *gin.Engine
}

func NewServer(cfg ServerConfig, log *slog.Logger, deps Dependencies) *Server {
	router := NewRouter(Config{WebOrigin: cfg.WebOrigin}, log, deps)
	return &Server{
		http: &http.Server{
			Addr:              cfg.HTTPAddr,
			Handler:           router,
			ReadHeaderTimeout: 5 * time.Second,
			ReadTimeout:       15 * time.Second,
			WriteTimeout:      30 * time.Second,
			IdleTimeout:       60 * time.Second,
		},
		log:    log,
		router: router,
	}
}

func (s *Server) Router() http.Handler {
	return s.router
}

func (s *Server) Run(ctx context.Context) error {
	errorsChannel := make(chan error, 1)
	go func() {
		s.log.Info("api_started", "addr", s.http.Addr)
		if err := s.http.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			errorsChannel <- err
		}
	}()

	select {
	case err := <-errorsChannel:
		return err
	case <-ctx.Done():
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		return s.http.Shutdown(shutdownCtx)
	}
}

func (s *Server) Close() error {
	return s.http.Close()
}
