package organization

import (
	"context"
	"time"

	"gorm.io/gorm"
)

type Service struct {
	db *gorm.DB
}

func NewService(db *gorm.DB) *Service {
	return &Service{db: db}
}

func (s *Service) Get(ctx context.Context, organizationID string) (Response, error) {
	var settings Settings
	err := s.db.WithContext(ctx).Where("organization_id = ?", organizationID).First(&settings).Error
	if err == gorm.ErrRecordNotFound {
		var org struct{ Name string }
		if err := s.db.WithContext(ctx).Table("organizations").Select("name").
			Where("id = ?", organizationID).Scan(&org).Error; err != nil {
			return Response{}, err
		}
		settings = Settings{
			OrganizationID: organizationID, DisplayName: org.Name,
			OrderUpdates: true, EventReminders: true,
		}
		return withSamplePayout(settings), nil
	}
	if err != nil {
		return Response{}, err
	}
	return withSamplePayout(settings), nil
}

type UpdateInput struct {
	DisplayName    string `json:"display_name"`
	Description    string `json:"description"`
	Logo           string `json:"logo"`
	Email          string `json:"email"`
	Phone          string `json:"phone"`
	Website        string `json:"website"`
	Instagram      string `json:"instagram"`
	TikTok         string `json:"tiktok"`
	OrderUpdates   *bool  `json:"order_updates"`
	EventReminders *bool  `json:"event_reminders"`
	Newsletter     *bool  `json:"newsletter"`
}

func (s *Service) Update(ctx context.Context, organizationID string, input UpdateInput) (Response, error) {
	current, err := s.Get(ctx, organizationID)
	if err != nil {
		return Response{}, err
	}
	settings := current.Settings
	if input.DisplayName != "" {
		settings.DisplayName = input.DisplayName
	}
	if input.Description != "" {
		settings.Description = input.Description
	}
	if input.Logo != "" {
		settings.Logo = input.Logo
	}
	if input.Email != "" {
		settings.Email = input.Email
	}
	if input.Phone != "" {
		settings.Phone = input.Phone
	}
	if input.Website != "" {
		settings.Website = input.Website
	}
	if input.Instagram != "" {
		settings.Instagram = input.Instagram
	}
	if input.TikTok != "" {
		settings.TikTok = input.TikTok
	}
	if input.OrderUpdates != nil {
		settings.OrderUpdates = *input.OrderUpdates
	}
	if input.EventReminders != nil {
		settings.EventReminders = *input.EventReminders
	}
	if input.Newsletter != nil {
		settings.Newsletter = *input.Newsletter
	}
	settings.OrganizationID = organizationID
	settings.UpdatedAt = time.Now()
	if err := s.db.WithContext(ctx).Save(&settings).Error; err != nil {
		return Response{}, err
	}
	return withSamplePayout(settings), nil
}

func withSamplePayout(settings Settings) Response {
	return Response{
		Settings: settings, PayoutStatus: "SAMPLE",
		PayoutBank: "Bank Demo Nusantara", PayoutAccount: "•••• •••• 4821",
	}
}
