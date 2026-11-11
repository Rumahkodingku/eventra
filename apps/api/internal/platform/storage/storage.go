package storage

import (
	"context"
	"errors"
	"fmt"
	"path"
	"strings"
	"time"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
	"github.com/oklog/ulid/v2"
)

const MaxImageBytes = 5 << 20

var ErrInvalidImage = errors.New("invalid image")

type Config struct {
	Endpoint   string
	AccessKey  string
	SecretKey  string
	Bucket     string
	UseSSL     bool
	PublicBase string
}

type ImageStore struct {
	client     *minio.Client
	bucket     string
	publicBase string
}

func NewImageStore(ctx context.Context, cfg Config) (*ImageStore, error) {
	client, err := minio.New(cfg.Endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(cfg.AccessKey, cfg.SecretKey, ""),
		Secure: cfg.UseSSL,
	})
	if err != nil {
		return nil, fmt.Errorf("create minio client: %w", err)
	}
	exists, err := client.BucketExists(ctx, cfg.Bucket)
	if err != nil {
		return nil, fmt.Errorf("check bucket: %w", err)
	}
	if !exists {
		if err := client.MakeBucket(ctx, cfg.Bucket, minio.MakeBucketOptions{}); err != nil {
			return nil, fmt.Errorf("create bucket: %w", err)
		}
	}
	return &ImageStore{
		client:     client,
		bucket:     cfg.Bucket,
		publicBase: strings.TrimRight(cfg.PublicBase, "/"),
	}, nil
}

func ValidateImage(contentType string, size int64) error {
	if size <= 0 || size > MaxImageBytes {
		return ErrInvalidImage
	}
	switch contentType {
	case "image/jpeg", "image/png", "image/webp":
		return nil
	default:
		return ErrInvalidImage
	}
}

func BuildImageKey(prefix, contentType string) (string, error) {
	extension := ""
	switch contentType {
	case "image/jpeg":
		extension = ".jpg"
	case "image/png":
		extension = ".png"
	case "image/webp":
		extension = ".webp"
	default:
		return "", ErrInvalidImage
	}
	return path.Join(prefix, ulid.Make().String()+extension), nil
}

func (s *ImageStore) PresignPut(ctx context.Context, key, contentType string, expiry time.Duration) (string, error) {
	url, err := s.client.PresignedPutObject(ctx, s.bucket, key, expiry)
	if err != nil {
		return "", err
	}
	_ = contentType
	return url.String(), nil
}

func (s *ImageStore) PublicURL(key string) string {
	return s.publicBase + "/" + strings.TrimLeft(key, "/")
}

func (s *ImageStore) Delete(ctx context.Context, key string) error {
	return s.client.RemoveObject(ctx, s.bucket, key, minio.RemoveObjectOptions{})
}
