CREATE TABLE IF NOT EXISTS categories (
  id VARCHAR(64) NOT NULL,
  slug VARCHAR(160) NOT NULL,
  name VARCHAR(160) NOT NULL,
  description TEXT NOT NULL,
  image VARCHAR(255) NOT NULL,
  icon VARCHAR(64) NOT NULL,
  subcategories JSON NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_categories_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS venues (
  id VARCHAR(64) NOT NULL,
  name VARCHAR(160) NOT NULL,
  address VARCHAR(255) NOT NULL,
  city VARCHAR(120) NOT NULL,
  region VARCHAR(120) NOT NULL,
  country VARCHAR(120) NOT NULL,
  timezone VARCHAR(64) NOT NULL,
  map_url VARCHAR(255) NULL,
  layout_id VARCHAR(64) NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS venue_layouts (
  id VARCHAR(64) NOT NULL,
  name VARCHAR(160) NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS venue_sections (
  id VARCHAR(64) NOT NULL,
  layout_id VARCHAR(64) NOT NULL,
  name VARCHAR(160) NOT NULL,
  label VARCHAR(255) NOT NULL,
  tier_key VARCHAR(64) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_sections_layout (layout_id),
  CONSTRAINT fk_sections_layout FOREIGN KEY (layout_id) REFERENCES venue_layouts (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS seats (
  id VARCHAR(160) NOT NULL,
  section_id VARCHAR(64) NOT NULL,
  row_label VARCHAR(16) NOT NULL,
  seat_number INT NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'AVAILABLE',
  is_accessible BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (id),
  KEY idx_seats_section (section_id),
  CONSTRAINT fk_seats_section FOREIGN KEY (section_id) REFERENCES venue_sections (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS events (
  id VARCHAR(64) NOT NULL,
  organization_id CHAR(26) NOT NULL,
  category_id VARCHAR(64) NOT NULL,
  venue_id VARCHAR(64) NOT NULL,
  slug VARCHAR(200) NOT NULL,
  title VARCHAR(255) NOT NULL,
  subcategory VARCHAR(120) NOT NULL,
  description TEXT NOT NULL,
  cover_image VARCHAR(255) NOT NULL,
  gallery JSON NOT NULL,
  tags JSON NOT NULL,
  highlights JSON NOT NULL,
  schedule JSON NOT NULL,
  terms JSON NOT NULL,
  age_note VARCHAR(255) NULL,
  accessibility_note VARCHAR(255) NULL,
  status VARCHAR(32) NOT NULL,
  ticketing_mode VARCHAR(32) NOT NULL,
  start_at TIMESTAMP(6) NOT NULL,
  end_at TIMESTAMP(6) NOT NULL,
  timezone VARCHAR(64) NOT NULL,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  is_trending BOOLEAN NOT NULL DEFAULT FALSE,
  is_recommended BOOLEAN NOT NULL DEFAULT FALSE,
  popularity INT NOT NULL DEFAULT 0,
  limited_availability BOOLEAN NOT NULL DEFAULT FALSE,
  is_early_bird BOOLEAN NOT NULL DEFAULT FALSE,
  layout_id VARCHAR(64) NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uq_events_slug (slug),
  KEY idx_events_status_start (status, start_at),
  KEY idx_events_org_status (organization_id, status),
  CONSTRAINT fk_events_org FOREIGN KEY (organization_id) REFERENCES organizations (id),
  CONSTRAINT fk_events_category FOREIGN KEY (category_id) REFERENCES categories (id),
  CONSTRAINT fk_events_venue FOREIGN KEY (venue_id) REFERENCES venues (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS ticket_types (
  id VARCHAR(128) NOT NULL,
  event_id VARCHAR(64) NOT NULL,
  name VARCHAR(160) NOT NULL,
  description TEXT NOT NULL,
  price BIGINT NOT NULL,
  currency VARCHAR(8) NOT NULL DEFAULT 'IDR',
  quota INT NOT NULL,
  sold_count INT NOT NULL DEFAULT 0,
  min_per_order INT NOT NULL DEFAULT 1,
  max_per_order INT NOT NULL DEFAULT 6,
  sales_start_at TIMESTAMP(6) NOT NULL,
  sales_end_at TIMESTAMP(6) NOT NULL,
  benefits JSON NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
  kind VARCHAR(32) NOT NULL,
  tier_key VARCHAR(64) NULL,
  PRIMARY KEY (id),
  KEY idx_ticket_types_event_status (event_id, status),
  CONSTRAINT fk_ticket_types_event FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
