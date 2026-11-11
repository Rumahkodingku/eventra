CREATE TABLE IF NOT EXISTS carts (
  id CHAR(26) NOT NULL,
  principal_key VARCHAR(128) NOT NULL,
  promo_code VARCHAR(32) NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uq_carts_principal (principal_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS cart_items (
  id CHAR(26) NOT NULL,
  cart_id CHAR(26) NOT NULL,
  event_id VARCHAR(64) NOT NULL,
  ticket_type_id VARCHAR(128) NOT NULL,
  quantity INT NOT NULL,
  seat_ids JSON NOT NULL,
  unit_price_snapshot BIGINT NOT NULL,
  added_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  KEY idx_cart_items_cart (cart_id),
  CONSTRAINT fk_cart_items_cart FOREIGN KEY (cart_id) REFERENCES carts (id) ON DELETE CASCADE,
  CONSTRAINT fk_cart_items_event FOREIGN KEY (event_id) REFERENCES events (id),
  CONSTRAINT fk_cart_items_ticket FOREIGN KEY (ticket_type_id) REFERENCES ticket_types (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS promotions (
  id VARCHAR(64) NOT NULL,
  code VARCHAR(32) NOT NULL,
  type VARCHAR(16) NOT NULL,
  value BIGINT NOT NULL,
  starts_at TIMESTAMP(6) NOT NULL,
  ends_at TIMESTAMP(6) NOT NULL,
  minimum_spend BIGINT NULL,
  max_discount BIGINT NULL,
  eligible_event_ids JSON NULL,
  eligible_category_ids JSON NULL,
  usage_limit INT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (id),
  UNIQUE KEY uq_promotions_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS promotion_redemptions (
  id CHAR(26) NOT NULL,
  promotion_id VARCHAR(64) NOT NULL,
  principal_key VARCHAR(128) NOT NULL,
  order_id CHAR(26) NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  KEY idx_redemptions_promotion (promotion_id),
  CONSTRAINT fk_redemptions_promotion FOREIGN KEY (promotion_id) REFERENCES promotions (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS idempotency_records (
  id CHAR(26) NOT NULL,
  principal_key VARCHAR(128) NOT NULL,
  idempotency_key VARCHAR(128) NOT NULL,
  request_hash CHAR(64) NOT NULL,
  response_status INT NOT NULL,
  response_body JSON NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  expires_at TIMESTAMP(6) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_idempotency_principal_key (principal_key, idempotency_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO promotions (id, code, type, value, starts_at, ends_at, minimum_spend, max_discount, eligible_event_ids, eligible_category_ids, usage_limit, is_active)
VALUES
  ('promo-eventra10', 'EVENTRA10', 'PERCENTAGE', 10, DATE_SUB(UTC_TIMESTAMP(6), INTERVAL 30 DAY), DATE_ADD(UTC_TIMESTAMP(6), INTERVAL 365 DAY), 250000, 100000, JSON_ARRAY(), JSON_ARRAY(), 500, TRUE),
  ('promo-hemat50k', 'HEMAT50K', 'FIXED', 50000, DATE_SUB(UTC_TIMESTAMP(6), INTERVAL 30 DAY), DATE_ADD(UTC_TIMESTAMP(6), INTERVAL 365 DAY), 500000, NULL, JSON_ARRAY(), JSON_ARRAY(), 250, TRUE),
  ('promo-expired10', 'EXPIRED10', 'PERCENTAGE', 10, DATE_SUB(UTC_TIMESTAMP(6), INTERVAL 90 DAY), DATE_SUB(UTC_TIMESTAMP(6), INTERVAL 2 DAY), NULL, NULL, JSON_ARRAY(), JSON_ARRAY(), 100, FALSE)
ON DUPLICATE KEY UPDATE code = VALUES(code);
