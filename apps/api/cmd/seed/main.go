package main

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"os"
	"time"

	"github.com/oklog/ulid/v2"
	"gorm.io/gorm"

	"github.com/eventra/eventra/apps/api/internal/modules/identity"
	"github.com/eventra/eventra/apps/api/internal/platform/config"
	"github.com/eventra/eventra/apps/api/internal/platform/database"
)

var permissions = []string{
	"event:read",
	"event:write",
	"event:publish",
	"order:read",
	"attendee:read",
	"checkin:write",
	"analytics:read",
	"settings:write",
	"wishlist:write",
	"review:write",
}

var rolePermissions = map[string][]string{
	"customer":        {"wishlist:write", "review:write"},
	"organizer_owner": permissions,
	"organizer_admin": permissions,
	"organizer_staff": {"event:read", "order:read", "attendee:read", "checkin:write"},
	"checkin_staff":   {"event:read", "checkin:write"},
	"platform_admin":  permissions,
}

func main() {
	cfg, err := config.Load()
	if err != nil {
		slog.Error("config_error", "error", err)
		os.Exit(1)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	db, err := database.Open(ctx, cfg.DatabaseURL)
	if err != nil {
		slog.Error("database_error", "error", err)
		os.Exit(1)
	}
	defer database.Close(db)

	if err := seed(ctx, db); err != nil {
		slog.Error("seed_error", "error", err)
		os.Exit(1)
	}
	slog.Info("seed_complete")
}

func seed(ctx context.Context, db *gorm.DB) error {
	passwordHash, err := identity.HashPassword("demo12345")
	if err != nil {
		return err
	}

	org, err := ensureOrganization(ctx, db, "Rumah Kodingku Live", "rumah-kodingku-live")
	if err != nil {
		return err
	}
	if err := db.WithContext(ctx).Exec(`INSERT INTO organization_settings
		(organization_id, display_name, description, email, website, instagram, tiktok, order_updates, event_reminders, newsletter)
		VALUES (?, ?, ?, ?, ?, ?, ?, TRUE, TRUE, FALSE)
		ON DUPLICATE KEY UPDATE organization_id = organization_id`,
		org.ID, "Rumah Kodingku Live",
		"Rumah produksi pengalaman live yang menghubungkan musisi, komunitas, dan penonton di seluruh Indonesia.",
		"organizer@demo.local", "https://example.com",
		"https://instagram.com/example", "https://tiktok.com/@example").Error; err != nil {
		return err
	}

	roleIDs := map[string]string{}
	for roleName, permissionNames := range rolePermissions {
		roleID, err := ensureRole(ctx, db, roleName)
		if err != nil {
			return err
		}
		roleIDs[roleName] = roleID
		for _, permissionName := range permissionNames {
			permissionID, err := ensurePermission(ctx, db, permissionName)
			if err != nil {
				return err
			}
			if err := db.WithContext(ctx).FirstOrCreate(&identity.RolePermission{
				RoleID:       roleID,
				PermissionID: permissionID,
			}).Error; err != nil {
				return err
			}
		}
	}

	customer, err := ensureUser(ctx, db, "Alya Putri", "customer@demo.local", "+62 812 0000 0001", "CUSTOMER", passwordHash)
	if err != nil {
		return err
	}
	organizer, err := ensureUser(ctx, db, "Raka Mahendra", "organizer@demo.local", "+62 812 0000 0002", "ORGANIZER", passwordHash)
	if err != nil {
		return err
	}

	if err := assignRole(ctx, db, customer.ID, roleIDs["customer"]); err != nil {
		return err
	}
	if err := assignRole(ctx, db, organizer.ID, roleIDs["organizer_owner"]); err != nil {
		return err
	}
	if err := db.WithContext(ctx).FirstOrCreate(&identity.OrganizationMember{
		OrganizationID: org.ID,
		UserID:         organizer.ID,
		Role:           "organizer_owner",
	}).Error; err != nil {
		return err
	}

	slog.Info("seed_users", "customer", customer.EmailNormalized, "organizer", organizer.EmailNormalized, "organization", org.Slug)
	return nil
}

func ensureOrganization(ctx context.Context, db *gorm.DB, name, slug string) (identity.Organization, error) {
	var org identity.Organization
	err := db.WithContext(ctx).Where("slug = ?", slug).First(&org).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		org = identity.Organization{ID: newID(), Name: name, Slug: slug, CreatedAt: time.Now()}
		return org, db.WithContext(ctx).Create(&org).Error
	}
	return org, err
}

func ensureRole(ctx context.Context, db *gorm.DB, name string) (string, error) {
	var role identity.Role
	err := db.WithContext(ctx).Where("name = ?", name).First(&role).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		role = identity.Role{ID: newID(), Name: name}
		return role.ID, db.WithContext(ctx).Create(&role).Error
	}
	return role.ID, err
}

func ensurePermission(ctx context.Context, db *gorm.DB, name string) (string, error) {
	var permission identity.Permission
	err := db.WithContext(ctx).Where("name = ?", name).First(&permission).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		permission = identity.Permission{ID: newID(), Name: name}
		return permission.ID, db.WithContext(ctx).Create(&permission).Error
	}
	return permission.ID, err
}

func ensureUser(ctx context.Context, db *gorm.DB, name, email, phone, role, passwordHash string) (identity.User, error) {
	normalized := identity.NormalizeEmail(email)
	var user identity.User
	err := db.WithContext(ctx).Where("email_normalized = ?", normalized).First(&user).Error
	if err == nil {
		return user, nil
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return identity.User{}, err
	}
	phoneValue := phone
	user = identity.User{
		ID:              newID(),
		EmailNormalized: normalized,
		Name:            name,
		Phone:           &phoneValue,
		Role:            role,
		Locale:          "id",
		CreatedAt:       time.Now(),
	}
	if err := db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&user).Error; err != nil {
			return err
		}
		return tx.Create(&identity.Credential{
			UserID:       user.ID,
			PasswordHash: passwordHash,
			CreatedAt:    time.Now(),
			UpdatedAt:    time.Now(),
		}).Error
	}); err != nil {
		return identity.User{}, fmt.Errorf("create demo user: %w", err)
	}
	return user, nil
}

func assignRole(ctx context.Context, db *gorm.DB, userID, roleID string) error {
	return db.WithContext(ctx).FirstOrCreate(&identity.UserRole{UserID: userID, RoleID: roleID}).Error
}

func newID() string {
	return ulid.Make().String()
}
