CREATE TABLE IF NOT EXISTS orders (
  id CHAR(26) NOT NULL,
  order_number VARCHAR(32) NOT NULL,
  principal_key VARCHAR(128) NOT NULL,
  user_id CHAR(26) NULL,
  reservation_id CHAR(26) NOT NULL,
  buyer_name VARCHAR(160) NOT NULL,
  buyer_email VARCHAR(255) NOT NULL,
  buyer_phone VARCHAR(40) NOT NULL,
  subtotal BIGINT NOT NULL,
  service_fee BIGINT NOT NULL,
  discount BIGINT NOT NULL,
  total BIGINT NOT NULL,
  currency VARCHAR(8) NOT NULL DEFAULT 'IDR',
  promo_code VARCHAR(32) NULL,
  payment_method VARCHAR(64) NOT NULL,
  payment_status VARCHAR(16) NOT NULL,
  order_status VARCHAR(24) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  paid_at TIMESTAMP(6) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_orders_number (order_number),
  KEY idx_orders_principal (principal_key),
  KEY idx_orders_status (order_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS order_items (
  id CHAR(26) NOT NULL,
  order_id CHAR(26) NOT NULL,
  event_id VARCHAR(64) NOT NULL,
  ticket_type_id VARCHAR(128) NOT NULL,
  ticket_name_snapshot VARCHAR(160) NOT NULL,
  event_title_snapshot VARCHAR(255) NOT NULL,
  event_start_at_snapshot TIMESTAMP(6) NOT NULL,
  venue_name_snapshot VARCHAR(160) NOT NULL,
  quantity INT NOT NULL,
  unit_price_snapshot BIGINT NOT NULL,
  line_subtotal BIGINT NOT NULL,
  seat_ids JSON NOT NULL,
  attendee_ids JSON NOT NULL,
  PRIMARY KEY (id),
  KEY idx_order_items_order (order_id),
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS attendees (
  id CHAR(26) NOT NULL,
  order_id CHAR(26) NOT NULL,
  ticket_id CHAR(26) NULL,
  full_name VARCHAR(160) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(40) NULL,
  check_in_status VARCHAR(24) NOT NULL DEFAULT 'NOT_CHECKED_IN',
  checked_in_at TIMESTAMP(6) NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  KEY idx_attendees_order (order_id),
  CONSTRAINT fk_attendees_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS payments (
  id CHAR(26) NOT NULL,
  order_id CHAR(26) NOT NULL,
  provider VARCHAR(32) NOT NULL,
  provider_reference VARCHAR(128) NOT NULL,
  amount BIGINT NOT NULL,
  currency VARCHAR(8) NOT NULL,
  status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uq_payments_provider_ref (provider_reference),
  KEY idx_payments_order (order_id),
  CONSTRAINT fk_payments_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS payment_events (
  id CHAR(26) NOT NULL,
  payment_id CHAR(26) NOT NULL,
  provider VARCHAR(32) NOT NULL,
  provider_event_id VARCHAR(128) NOT NULL,
  status VARCHAR(16) NOT NULL,
  payload JSON NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uq_payment_events_provider_event (provider, provider_event_id),
  KEY idx_payment_events_payment (payment_id),
  CONSTRAINT fk_payment_events_payment FOREIGN KEY (payment_id) REFERENCES payments (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
