package storage

import (
	"context"
	"errors"
	"fmt"
	"path"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/s3/types"
	"github.com/oklog/ulid/v2"
)

const MaxImageBytes = 5 << 20

var ErrInvalidImage = errors.New("invalid image")

type Config struct {
	Endpoint       string
	PublicEndpoint string
	Region         string
	AccessKey      string
	SecretKey      string
	Bucket         string
	UseSSL         bool
	PublicBase     string
	CorsOrigins    string
}

type ImageStore struct {
	client     *s3.Client
	presigner  *s3.PresignClient
	bucket     string
	publicBase string
}

func NewImageStore(ctx context.Context, cfg Config) (*ImageStore, error) {
	region := cfg.Region
	if region == "" {
		region = "garage"
	}
	awsCfg, err := awsconfig.LoadDefaultConfig(ctx,
		awsconfig.WithRegion(region),
		awsconfig.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(
			cfg.AccessKey, cfg.SecretKey, "",
		)),
	)
	if err != nil {
		return nil, fmt.Errorf("load s3 config: %w", err)
	}
	baseEndpoint := endpointURL(cfg.Endpoint, cfg.UseSSL)
	client := s3.NewFromConfig(awsCfg, func(options *s3.Options) {
		options.BaseEndpoint = aws.String(baseEndpoint)
		options.UsePathStyle = true
	})
	publicEndpoint := cfg.PublicEndpoint
	if publicEndpoint == "" {
		publicEndpoint = cfg.Endpoint
	}
	publicClient := s3.NewFromConfig(awsCfg, func(options *s3.Options) {
		options.BaseEndpoint = aws.String(endpointURL(publicEndpoint, cfg.UseSSL))
		options.UsePathStyle = true
	})
	if _, err := client.HeadBucket(ctx, &s3.HeadBucketInput{Bucket: aws.String(cfg.Bucket)}); err != nil {
		if _, createErr := client.CreateBucket(ctx, &s3.CreateBucketInput{Bucket: aws.String(cfg.Bucket)}); createErr != nil {
			return nil, fmt.Errorf("ensure bucket: %w", createErr)
		}
	}
	if origins := splitCSV(cfg.CorsOrigins); len(origins) > 0 {
		if _, err := client.PutBucketCors(ctx, &s3.PutBucketCorsInput{
			Bucket: aws.String(cfg.Bucket),
			CORSConfiguration: &types.CORSConfiguration{
				CORSRules: []types.CORSRule{{
					AllowedHeaders: []string{"*"},
					AllowedMethods: []string{"GET", "PUT", "HEAD"},
					AllowedOrigins: origins,
					ExposeHeaders:  []string{"ETag"},
					MaxAgeSeconds:  aws.Int32(3600),
				}},
			},
		}); err != nil {
			return nil, fmt.Errorf("configure bucket cors: %w", err)
		}
	}
	return &ImageStore{
		client:     client,
		presigner:  s3.NewPresignClient(publicClient),
		bucket:     cfg.Bucket,
		publicBase: strings.TrimRight(cfg.PublicBase, "/"),
	}, nil
}

func splitCSV(value string) []string {
	parts := strings.Split(value, ",")
	result := make([]string, 0, len(parts))
	for _, part := range parts {
		if trimmed := strings.TrimSpace(part); trimmed != "" {
			result = append(result, trimmed)
		}
	}
	return result
}

func endpointURL(endpoint string, useSSL bool) string {
	endpoint = strings.TrimRight(endpoint, "/")
	if strings.Contains(endpoint, "://") {
		return endpoint
	}
	scheme := "http"
	if useSSL {
		scheme = "https"
	}
	return scheme + "://" + endpoint
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
	request, err := s.presigner.PresignPutObject(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(s.bucket),
		Key:         aws.String(key),
		ContentType: aws.String(contentType),
	}, s3.WithPresignExpires(expiry))
	if err != nil {
		return "", err
	}
	return request.URL, nil
}

func (s *ImageStore) PublicURL(key string) string {
	return s.publicBase + "/" + strings.TrimLeft(key, "/")
}

func (s *ImageStore) Delete(ctx context.Context, key string) error {
	_, err := s.client.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String(s.bucket),
		Key:    aws.String(key),
	})
	return err
}
