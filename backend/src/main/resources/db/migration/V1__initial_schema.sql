CREATE TABLE accounts (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(180) NOT NULL,
  password_hash VARCHAR(100) NOT NULL,
  account_role VARCHAR(24) NOT NULL DEFAULT 'STUDENT',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uk_accounts_email UNIQUE (email)
);

CREATE TABLE cases (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  tracking_code VARCHAR(40) NOT NULL,
  case_type VARCHAR(40) NOT NULL,
  description VARCHAR(4000) NOT NULL,
  location VARCHAR(180) NOT NULL,
  incident_date DATE NULL,
  confidential BOOLEAN NOT NULL DEFAULT TRUE,
  status VARCHAR(32) NOT NULL DEFAULT 'RECEIVED',
  reporter_id BIGINT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uk_cases_tracking_code UNIQUE (tracking_code),
  CONSTRAINT fk_cases_reporter FOREIGN KEY (reporter_id) REFERENCES accounts(id)
);
CREATE INDEX idx_cases_reporter_created ON cases(reporter_id, created_at);
CREATE INDEX idx_cases_status_created ON cases(status, created_at);

CREATE TABLE case_updates (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  case_id BIGINT NOT NULL,
  author_id BIGINT NULL,
  message VARCHAR(1500) NOT NULL,
  visible_to_reporter BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_case_updates_case FOREIGN KEY (case_id) REFERENCES cases(id),
  CONSTRAINT fk_case_updates_author FOREIGN KEY (author_id) REFERENCES accounts(id)
);
CREATE INDEX idx_case_updates_case_created ON case_updates(case_id, created_at);

CREATE TABLE appointments (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  account_id BIGINT NOT NULL,
  reason VARCHAR(500) NOT NULL,
  preferred_at TIMESTAMP NOT NULL,
  modality VARCHAR(20) NOT NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'REQUESTED',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_appointments_account FOREIGN KEY (account_id) REFERENCES accounts(id)
);
CREATE INDEX idx_appointments_account_date ON appointments(account_id, preferred_at);
