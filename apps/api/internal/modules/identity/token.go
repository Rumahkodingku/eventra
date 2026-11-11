package identity

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/oklog/ulid/v2"
)

type AccessClaims struct {
	SessionID string `json:"sid"`
	jwt.RegisteredClaims
}

func newID() string {
	return ulid.Make().String()
}

func randomToken(bytes int) (string, error) {
	buffer := make([]byte, bytes)
	if _, err := rand.Read(buffer); err != nil {
		return "", fmt.Errorf("generate token: %w", err)
	}
	return base64.RawURLEncoding.EncodeToString(buffer), nil
}

func tokenHash(raw string) string {
	sum := sha256.Sum256([]byte(raw))
	return hex.EncodeToString(sum[:])
}

func (s *Service) issueAccessToken(userID, sessionID string) (string, time.Time, error) {
	expiresAt := s.now().Add(s.cfg.AccessTTL)
	claims := AccessClaims{
		SessionID: sessionID,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   userID,
			Issuer:    "eventra",
			Audience:  jwt.ClaimStrings{"eventra-web"},
			IssuedAt:  jwt.NewNumericDate(s.now()),
			ExpiresAt: jwt.NewNumericDate(expiresAt),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString([]byte(s.cfg.JWTSecret))
	if err != nil {
		return "", time.Time{}, fmt.Errorf("sign access token: %w", err)
	}
	return signed, expiresAt, nil
}

func (s *Service) parseAccessToken(raw string) (AccessClaims, error) {
	claims := AccessClaims{}
	parsed, err := jwt.ParseWithClaims(raw, &claims, func(token *jwt.Token) (any, error) {
		if token.Method != jwt.SigningMethodHS256 {
			return nil, fmt.Errorf("unexpected signing method")
		}
		return []byte(s.cfg.JWTSecret), nil
	}, jwt.WithIssuer("eventra"), jwt.WithAudience("eventra-web"))
	if err != nil || !parsed.Valid {
		return AccessClaims{}, ErrInvalidToken
	}
	return claims, nil
}
