CREATE TABLE IF NOT EXISTS inventory_buckets (
  id CHAR(26) NOT NULL,
  ticket_type_id VARCHAR(128) NOT NULL,
  capacity INT NOT NULL,
  reserved INT NOT NULL DEFAULT 0,
  sold INT NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uq_inventory_ticket_type (ticket_type_id),
  CONSTRAINT chk_inventory_capacity CHECK (reserved >= 0 AND sold >= 0 AND reserved + sold <= capacity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS inventory_reservations (
  id CHAR(26) NOT NULL,
  principal_key VARCHAR(128) NOT NULL,
  status VARCHAR(16) NOT NULL,
  expires_at TIMESTAMP(6) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  KEY idx_reservations_status_expiry (status, expires_at),
  KEY idx_reservations_principal (principal_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS inventory_reservation_items (
  id CHAR(26) NOT NULL,
  reservation_id CHAR(26) NOT NULL,
  ticket_type_id VARCHAR(128) NOT NULL,
  quantity INT NOT NULL,
  seat_id VARCHAR(160) NULL,
  PRIMARY KEY (id),
  KEY idx_reservation_items_reservation (reservation_id),
  CONSTRAINT fk_reservation_items_reservation FOREIGN KEY (reservation_id) REFERENCES inventory_reservations (id) ON DELETE CASCADE,
  CONSTRAINT fk_reservation_items_ticket FOREIGN KEY (ticket_type_id) REFERENCES ticket_types (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS seat_claims (
  id CHAR(26) NOT NULL,
  event_id VARCHAR(64) NOT NULL,
  seat_id VARCHAR(160) NOT NULL,
  reservation_id CHAR(26) NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'HELD',
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uq_seat_claim_event_seat (event_id, seat_id),
  KEY idx_seat_claims_reservation (reservation_id),
  CONSTRAINT fk_seat_claims_event FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE,
  CONSTRAINT fk_seat_claims_reservation FOREIGN KEY (reservation_id) REFERENCES inventory_reservations (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
