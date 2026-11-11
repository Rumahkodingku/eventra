CREATE TABLE IF NOT EXISTS tickets (
  id CHAR(26) NOT NULL,
  ticket_code VARCHAR(64) NOT NULL,
  qr_token_hash CHAR(64) NOT NULL,
  order_id CHAR(26) NOT NULL,
  event_id VARCHAR(64) NOT NULL,
  ticket_type_id VARCHAR(128) NOT NULL,
  attendee_id CHAR(26) NOT NULL,
  seat_id VARCHAR(160) NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'VALID',
  issued_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  checked_in_at TIMESTAMP(6) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_tickets_code (ticket_code),
  UNIQUE KEY uq_tickets_qr_hash (qr_token_hash),
  KEY idx_tickets_order (order_id),
  KEY idx_tickets_event_status (event_id, status),
  CONSTRAINT fk_tickets_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
  CONSTRAINT fk_tickets_event FOREIGN KEY (event_id) REFERENCES events (id),
  CONSTRAINT fk_tickets_attendee FOREIGN KEY (attendee_id) REFERENCES attendees (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS ticket_checkins (
  id CHAR(26) NOT NULL,
  ticket_id CHAR(26) NOT NULL,
  event_id VARCHAR(64) NOT NULL,
  operator_user_id CHAR(26) NOT NULL,
  checked_in_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uq_ticket_checkins_ticket (ticket_id),
  KEY idx_ticket_checkins_event (event_id),
  CONSTRAINT fk_ticket_checkins_ticket FOREIGN KEY (ticket_id) REFERENCES tickets (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
