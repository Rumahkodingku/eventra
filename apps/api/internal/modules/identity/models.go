package identity

import "time"

type User struct {
	ID              string    `json:"id" gorm:"column:id;primaryKey"`
	EmailNormalized string    `json:"email" gorm:"column:email_normalized"`
	Name            string    `json:"name" gorm:"column:name"`
	Phone           *string   `json:"phone,omitempty" gorm:"column:phone"`
	Role            string    `json:"role" gorm:"column:role"`
	Locale          string    `json:"locale" gorm:"column:locale"`
	CreatedAt       time.Time `json:"created_at" gorm:"column:created_at"`
}

func (User) TableName() string { return "users" }

type Credential struct {
	UserID       string    `gorm:"column:user_id;primaryKey"`
	PasswordHash string    `gorm:"column:password_hash"`
	CreatedAt    time.Time `gorm:"column:created_at"`
	UpdatedAt    time.Time `gorm:"column:updated_at"`
}

func (Credential) TableName() string { return "user_credentials" }

type Session struct {
	ID        string     `gorm:"column:id;primaryKey"`
	UserID    string     `gorm:"column:user_id"`
	ExpiresAt time.Time  `gorm:"column:expires_at"`
	RevokedAt *time.Time `gorm:"column:revoked_at"`
	UserAgent *string    `gorm:"column:user_agent"`
	CreatedAt time.Time  `gorm:"column:created_at"`
}

func (Session) TableName() string { return "sessions" }

type RefreshToken struct {
	ID        string     `gorm:"column:id;primaryKey"`
	SessionID string     `gorm:"column:session_id"`
	TokenHash string     `gorm:"column:token_hash"`
	ExpiresAt time.Time  `gorm:"column:expires_at"`
	UsedAt    *time.Time `gorm:"column:used_at"`
	RevokedAt *time.Time `gorm:"column:revoked_at"`
	CreatedAt time.Time  `gorm:"column:created_at"`
}

func (RefreshToken) TableName() string { return "refresh_tokens" }

type GuestPrincipal struct {
	ID         string    `gorm:"column:id;primaryKey"`
	SecretHash string    `gorm:"column:secret_hash"`
	ExpiresAt  time.Time `gorm:"column:expires_at"`
	CreatedAt  time.Time `gorm:"column:created_at"`
}

func (GuestPrincipal) TableName() string { return "guest_principals" }

type Role struct {
	ID   string `gorm:"column:id;primaryKey"`
	Name string `gorm:"column:name"`
}

func (Role) TableName() string { return "roles" }

type Permission struct {
	ID   string `gorm:"column:id;primaryKey"`
	Name string `gorm:"column:name"`
}

func (Permission) TableName() string { return "permissions" }

type RolePermission struct {
	RoleID       string `gorm:"column:role_id;primaryKey"`
	PermissionID string `gorm:"column:permission_id;primaryKey"`
}

func (RolePermission) TableName() string { return "role_permissions" }

type UserRole struct {
	UserID string `gorm:"column:user_id;primaryKey"`
	RoleID string `gorm:"column:role_id;primaryKey"`
}

func (UserRole) TableName() string { return "user_roles" }

type Organization struct {
	ID        string    `gorm:"column:id;primaryKey"`
	Name      string    `gorm:"column:name"`
	Slug      string    `gorm:"column:slug"`
	CreatedAt time.Time `gorm:"column:created_at"`
}

func (Organization) TableName() string { return "organizations" }

type OrganizationMember struct {
	OrganizationID string    `gorm:"column:organization_id;primaryKey"`
	UserID         string    `gorm:"column:user_id;primaryKey"`
	Role           string    `gorm:"column:role"`
	CreatedAt      time.Time `gorm:"column:created_at"`
}

func (OrganizationMember) TableName() string { return "organization_members" }
