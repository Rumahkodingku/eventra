CREATE TABLE IF NOT EXISTS notifications (
  id CHAR(26) NOT NULL,
  user_id CHAR(26) NULL,
  type VARCHAR(16) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  target_url VARCHAR(500) NULL,
  read_at TIMESTAMP(6) NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  KEY idx_notifications_user_created (user_id, created_at),
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS reviews (
  id CHAR(26) NOT NULL,
  event_id VARCHAR(64) NOT NULL,
  user_id CHAR(26) NOT NULL,
  author_name VARCHAR(160) NOT NULL,
  rating TINYINT NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uq_reviews_user_event (user_id, event_id),
  KEY idx_reviews_event_created (event_id, created_at),
  CONSTRAINT fk_reviews_event FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE,
  CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT chk_reviews_rating CHECK (rating BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS wishlist_items (
  id CHAR(26) NOT NULL,
  user_id CHAR(26) NOT NULL,
  event_id VARCHAR(64) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uq_wishlist_user_event (user_id, event_id),
  KEY idx_wishlist_user (user_id),
  CONSTRAINT fk_wishlist_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_wishlist_event FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS organization_settings (
  organization_id CHAR(26) NOT NULL,
  display_name VARCHAR(160) NOT NULL,
  description TEXT NOT NULL,
  logo VARCHAR(500) NOT NULL DEFAULT '',
  email VARCHAR(255) NOT NULL DEFAULT '',
  phone VARCHAR(40) NOT NULL DEFAULT '',
  website VARCHAR(500) NOT NULL DEFAULT '',
  instagram VARCHAR(500) NOT NULL DEFAULT '',
  tiktok VARCHAR(500) NOT NULL DEFAULT '',
  order_updates BOOLEAN NOT NULL DEFAULT TRUE,
  event_reminders BOOLEAN NOT NULL DEFAULT TRUE,
  newsletter BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (organization_id),
  CONSTRAINT fk_org_settings_org FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
