package identity

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"gorm.io/gorm"
)

var (
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrEmailExists        = errors.New("email already exists")
	ErrInvalidToken       = errors.New("invalid token")
	ErrForbidden          = errors.New("forbidden")
	ErrNotFound           = errors.New("not found")
)

type Config struct {
	JWTSecret  string
	AccessTTL  time.Duration
	RefreshTTL time.Duration
}

type Service struct {
	db  *gorm.DB
	cfg Config
	now func() time.Time
}

type AuthResult struct {
	User             User
	AccessToken      string
	RefreshToken     string
	CSRFToken        string
	SessionID        string
	AccessExpiresAt  time.Time
	RefreshExpiresAt time.Time
}

func NewService(db *gorm.DB, cfg Config) *Service {
	return &Service{db: db, cfg: cfg, now: time.Now}
}

func NormalizeEmail(email string) string {
	return strings.ToLower(strings.TrimSpace(email))
}

func (s *Service) Register(ctx context.Context, name, email, password string, phone *string) (AuthResult, error) {
	normalized := NormalizeEmail(email)
	var count int64
	if err := s.db.WithContext(ctx).Model(&User{}).Where("email_normalized = ?", normalized).Count(&count).Error; err != nil {
		return AuthResult{}, err
	}
	if count > 0 {
		return AuthResult{}, ErrEmailExists
	}

	hash, err := HashPassword(password)
	if err != nil {
		return AuthResult{}, err
	}
	user := User{
		ID:              newID(),
		EmailNormalized: normalized,
		Name:            strings.TrimSpace(name),
		Phone:           phone,
		Role:            "CUSTOMER",
		Locale:          "id",
		CreatedAt:       s.now(),
	}

	err = s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&user).Error; err != nil {
			return err
		}
		if err := tx.Create(&Credential{
			UserID:       user.ID,
			PasswordHash: hash,
			CreatedAt:    s.now(),
			UpdatedAt:    s.now(),
		}).Error; err != nil {
			return err
		}
		var role Role
		if err := tx.Where("name = ?", "customer").First(&role).Error; err == nil {
			return tx.Create(&UserRole{UserID: user.ID, RoleID: role.ID}).Error
		}
		return nil
	})
	if err != nil {
		return AuthResult{}, err
	}
	return s.Login(ctx, normalized, password, nil)
}

func (s *Service) Login(ctx context.Context, email, password string, userAgent *string) (AuthResult, error) {
	var user User
	if err := s.db.WithContext(ctx).Where("email_normalized = ?", NormalizeEmail(email)).First(&user).Error; err != nil {
		return AuthResult{}, ErrInvalidCredentials
	}
	var credential Credential
	if err := s.db.WithContext(ctx).Where("user_id = ?", user.ID).First(&credential).Error; err != nil {
		return AuthResult{}, ErrInvalidCredentials
	}
	if !VerifyPassword(credential.PasswordHash, password) {
		return AuthResult{}, ErrInvalidCredentials
	}
	return s.createSession(ctx, user, userAgent)
}

func (s *Service) createSession(ctx context.Context, user User, userAgent *string) (AuthResult, error) {
	sessionID := newID()
	refreshRaw, err := randomToken(32)
	if err != nil {
		return AuthResult{}, err
	}
	csrf, err := randomToken(32)
	if err != nil {
		return AuthResult{}, err
	}
	refreshExpiresAt := s.now().Add(s.cfg.RefreshTTL)
	session := Session{
		ID:        sessionID,
		UserID:    user.ID,
		ExpiresAt: refreshExpiresAt,
		UserAgent: userAgent,
		CreatedAt: s.now(),
	}
	refresh := RefreshToken{
		ID:        newID(),
		SessionID: sessionID,
		TokenHash: tokenHash(refreshRaw),
		ExpiresAt: refreshExpiresAt,
		CreatedAt: s.now(),
	}
	if err := s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&session).Error; err != nil {
			return err
		}
		return tx.Create(&refresh).Error
	}); err != nil {
		return AuthResult{}, err
	}
	access, accessExpiresAt, err := s.issueAccessToken(user.ID, sessionID)
	if err != nil {
		return AuthResult{}, err
	}
	return AuthResult{
		User:             user,
		AccessToken:      access,
		RefreshToken:     refreshRaw,
		CSRFToken:        csrf,
		SessionID:        sessionID,
		AccessExpiresAt:  accessExpiresAt,
		RefreshExpiresAt: refreshExpiresAt,
	}, nil
}

func (s *Service) Refresh(ctx context.Context, rawRefresh string) (AuthResult, error) {
	var stored RefreshToken
	if err := s.db.WithContext(ctx).Where("token_hash = ?", tokenHash(rawRefresh)).First(&stored).Error; err != nil {
		return AuthResult{}, ErrInvalidToken
	}
	if stored.UsedAt != nil || stored.RevokedAt != nil || stored.ExpiresAt.Before(s.now()) {
		return AuthResult{}, ErrInvalidToken
	}
	var session Session
	if err := s.db.WithContext(ctx).Where("id = ?", stored.SessionID).First(&session).Error; err != nil {
		return AuthResult{}, ErrInvalidToken
	}
	if session.RevokedAt != nil || session.ExpiresAt.Before(s.now()) {
		return AuthResult{}, ErrInvalidToken
	}
	var user User
	if err := s.db.WithContext(ctx).Where("id = ?", session.UserID).First(&user).Error; err != nil {
		return AuthResult{}, ErrInvalidToken
	}

	newRefreshRaw, err := randomToken(32)
	if err != nil {
		return AuthResult{}, err
	}
	csrf, err := randomToken(32)
	if err != nil {
		return AuthResult{}, err
	}
	now := s.now()
	refreshExpiresAt := now.Add(s.cfg.RefreshTTL)
	newRefresh := RefreshToken{
		ID:        newID(),
		SessionID: session.ID,
		TokenHash: tokenHash(newRefreshRaw),
		ExpiresAt: refreshExpiresAt,
		CreatedAt: now,
	}
	if err := s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&RefreshToken{}).Where("id = ? AND used_at IS NULL", stored.ID).Update("used_at", now).Error; err != nil {
			return err
		}
		if err := tx.Model(&Session{}).Where("id = ?", session.ID).Update("expires_at", refreshExpiresAt).Error; err != nil {
			return err
		}
		return tx.Create(&newRefresh).Error
	}); err != nil {
		return AuthResult{}, err
	}
	access, accessExpiresAt, err := s.issueAccessToken(user.ID, session.ID)
	if err != nil {
		return AuthResult{}, err
	}
	return AuthResult{
		User:             user,
		AccessToken:      access,
		RefreshToken:     newRefreshRaw,
		CSRFToken:        csrf,
		SessionID:        session.ID,
		AccessExpiresAt:  accessExpiresAt,
		RefreshExpiresAt: refreshExpiresAt,
	}, nil
}

func (s *Service) Logout(ctx context.Context, sessionID string) error {
	now := s.now()
	return s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&Session{}).Where("id = ? AND revoked_at IS NULL", sessionID).Update("revoked_at", now).Error; err != nil {
			return err
		}
		return tx.Model(&RefreshToken{}).Where("session_id = ? AND revoked_at IS NULL", sessionID).Update("revoked_at", now).Error
	})
}

func (s *Service) LogoutAll(ctx context.Context, userID string) error {
	now := s.now()
	return s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&Session{}).Where("user_id = ? AND revoked_at IS NULL", userID).Update("revoked_at", now).Error; err != nil {
			return err
		}
		return tx.Model(&RefreshToken{}).
			Where("session_id IN (?)", tx.Model(&Session{}).Select("id").Where("user_id = ?", userID)).
			Update("revoked_at", now).Error
	})
}

func (s *Service) Me(ctx context.Context, userID string) (User, error) {
	var user User
	if err := s.db.WithContext(ctx).Where("id = ?", userID).First(&user).Error; err != nil {
		return User{}, ErrNotFound
	}
	return user, nil
}

func (s *Service) HasPermission(ctx context.Context, userID, permission string) (bool, error) {
	var count int64
	err := s.db.WithContext(ctx).
		Table("user_roles").
		Joins("JOIN role_permissions ON role_permissions.role_id = user_roles.role_id").
		Joins("JOIN permissions ON permissions.id = role_permissions.permission_id").
		Where("user_roles.user_id = ? AND permissions.name = ?", userID, permission).
		Count(&count).Error
	return count > 0, err
}

func (s *Service) CreateGuest(ctx context.Context) (string, string, time.Time, error) {
	secret, err := randomToken(32)
	if err != nil {
		return "", "", time.Time{}, err
	}
	expiresAt := s.now().Add(30 * 24 * time.Hour)
	guest := GuestPrincipal{
		ID:         newID(),
		SecretHash: tokenHash(secret),
		ExpiresAt:  expiresAt,
		CreatedAt:  s.now(),
	}
	if err := s.db.WithContext(ctx).Create(&guest).Error; err != nil {
		return "", "", time.Time{}, fmt.Errorf("create guest: %w", err)
	}
	return guest.ID, secret, expiresAt, nil
}

func (s *Service) ResolveGuest(ctx context.Context, secret string) (string, error) {
	var guest GuestPrincipal
	if err := s.db.WithContext(ctx).Where("secret_hash = ?", tokenHash(secret)).First(&guest).Error; err != nil {
		return "", ErrNotFound
	}
	if guest.ExpiresAt.Before(s.now()) {
		return "", ErrInvalidToken
	}
	return guest.ID, nil
}

func (s *Service) ParseAccessToken(raw string) (AccessClaims, error) {
	return s.parseAccessToken(raw)
}
