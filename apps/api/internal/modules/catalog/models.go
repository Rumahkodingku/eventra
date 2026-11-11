package catalog

import (
	"time"

	"gorm.io/datatypes"
)

type Category struct {
	ID            string         `json:"id" gorm:"column:id;primaryKey"`
	Slug          string         `json:"slug" gorm:"column:slug"`
	Name          string         `json:"name" gorm:"column:name"`
	Description   string         `json:"description" gorm:"column:description"`
	Image         string         `json:"image" gorm:"column:image"`
	Icon          string         `json:"icon" gorm:"column:icon"`
	Subcategories datatypes.JSON `json:"subcategories" gorm:"column:subcategories"`
}

func (Category) TableName() string { return "categories" }

type Venue struct {
	ID       string  `json:"id" gorm:"column:id;primaryKey"`
	Name     string  `json:"name" gorm:"column:name"`
	Address  string  `json:"address" gorm:"column:address"`
	City     string  `json:"city" gorm:"column:city"`
	Region   string  `json:"region" gorm:"column:region"`
	Country  string  `json:"country" gorm:"column:country"`
	Timezone string  `json:"timezone" gorm:"column:timezone"`
	MapURL   *string `json:"map_url,omitempty" gorm:"column:map_url"`
	LayoutID *string `json:"layout_id,omitempty" gorm:"column:layout_id"`
}

func (Venue) TableName() string { return "venues" }

type VenueLayout struct {
	ID       string    `json:"id" gorm:"column:id;primaryKey"`
	Name     string    `json:"name" gorm:"column:name"`
	Sections []Section `json:"sections" gorm:"foreignKey:LayoutID"`
}

func (VenueLayout) TableName() string { return "venue_layouts" }

type Section struct {
	ID        string `json:"id" gorm:"column:id;primaryKey"`
	LayoutID  string `json:"layout_id" gorm:"column:layout_id"`
	Name      string `json:"name" gorm:"column:name"`
	Label     string `json:"label" gorm:"column:label"`
	TierKey   string `json:"tier_key" gorm:"column:tier_key"`
	SortOrder int    `json:"sort_order" gorm:"column:sort_order"`
	Seats     []Seat `json:"seats" gorm:"foreignKey:SectionID"`
}

func (Section) TableName() string { return "venue_sections" }

type Seat struct {
	ID         string `json:"id" gorm:"column:id;primaryKey"`
	SectionID  string `json:"section_id" gorm:"column:section_id"`
	Row        string `json:"row" gorm:"column:row_label"`
	Number     int    `json:"number" gorm:"column:seat_number"`
	Status     string `json:"status" gorm:"column:status"`
	Accessible bool   `json:"accessible" gorm:"column:is_accessible"`
}

func (Seat) TableName() string { return "seats" }

type ScheduleItem struct {
	Time        string `json:"time"`
	Title       string `json:"title"`
	Description string `json:"description,omitempty"`
}

type Event struct {
	ID                  string         `json:"id" gorm:"column:id;primaryKey"`
	OrganizationID      string         `json:"organization_id" gorm:"column:organization_id"`
	CategoryID          string         `json:"category_id" gorm:"column:category_id"`
	VenueID             string         `json:"venue_id" gorm:"column:venue_id"`
	Slug                string         `json:"slug" gorm:"column:slug"`
	Title               string         `json:"title" gorm:"column:title"`
	Subcategory         string         `json:"subcategory" gorm:"column:subcategory"`
	Description         string         `json:"description" gorm:"column:description"`
	CoverImage          string         `json:"cover_image" gorm:"column:cover_image"`
	Gallery             datatypes.JSON `json:"gallery" gorm:"column:gallery"`
	Tags                datatypes.JSON `json:"tags" gorm:"column:tags"`
	Highlights          datatypes.JSON `json:"highlights" gorm:"column:highlights"`
	Schedule            datatypes.JSON `json:"schedule" gorm:"column:schedule"`
	Terms               datatypes.JSON `json:"terms" gorm:"column:terms"`
	AgeNote             *string        `json:"age_note,omitempty" gorm:"column:age_note"`
	AccessibilityNote   *string        `json:"accessibility_note,omitempty" gorm:"column:accessibility_note"`
	Status              string         `json:"status" gorm:"column:status"`
	TicketingMode       string         `json:"ticketing_mode" gorm:"column:ticketing_mode"`
	StartAt             time.Time      `json:"start_at" gorm:"column:start_at"`
	EndAt               time.Time      `json:"end_at" gorm:"column:end_at"`
	Timezone            string         `json:"timezone" gorm:"column:timezone"`
	IsFeatured          bool           `json:"is_featured" gorm:"column:is_featured"`
	IsTrending          bool           `json:"is_trending" gorm:"column:is_trending"`
	IsRecommended       bool           `json:"is_recommended" gorm:"column:is_recommended"`
	Popularity          int            `json:"popularity" gorm:"column:popularity"`
	LimitedAvailability bool           `json:"limited_availability" gorm:"column:limited_availability"`
	IsEarlyBird         bool           `json:"is_early_bird" gorm:"column:is_early_bird"`
	LayoutID            *string        `json:"layout_id,omitempty" gorm:"column:layout_id"`
	CreatedAt           time.Time      `json:"created_at" gorm:"column:created_at"`
	UpdatedAt           time.Time      `json:"updated_at" gorm:"column:updated_at"`
	TicketTypes         []TicketType   `json:"ticket_types" gorm:"foreignKey:EventID"`
	SeatLayout          *VenueLayout   `json:"seat_layout,omitempty" gorm:"-"`
}

func (Event) TableName() string { return "events" }

type TicketType struct {
	ID           string         `json:"id" gorm:"column:id;primaryKey"`
	EventID      string         `json:"event_id" gorm:"column:event_id"`
	Name         string         `json:"name" gorm:"column:name"`
	Description  string         `json:"description" gorm:"column:description"`
	Price        int64          `json:"price" gorm:"column:price"`
	Currency     string         `json:"currency" gorm:"column:currency"`
	Quota        int            `json:"quota" gorm:"column:quota"`
	SoldCount    int            `json:"sold_count" gorm:"column:sold_count"`
	MinPerOrder  int            `json:"min_per_order" gorm:"column:min_per_order"`
	MaxPerOrder  int            `json:"max_per_order" gorm:"column:max_per_order"`
	SalesStartAt time.Time      `json:"sales_start_at" gorm:"column:sales_start_at"`
	SalesEndAt   time.Time      `json:"sales_end_at" gorm:"column:sales_end_at"`
	Benefits     datatypes.JSON `json:"benefits" gorm:"column:benefits"`
	Status       string         `json:"status" gorm:"column:status"`
	Kind         string         `json:"kind" gorm:"column:kind"`
	TierKey      *string        `json:"tier_key,omitempty" gorm:"column:tier_key"`
}

func (TicketType) TableName() string { return "ticket_types" }
