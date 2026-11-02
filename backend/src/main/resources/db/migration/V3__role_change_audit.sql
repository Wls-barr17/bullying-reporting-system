CREATE TABLE role_change_history (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  target_account_id BIGINT NOT NULL,
  changed_by_account_id BIGINT NOT NULL,
  previous_role VARCHAR(24) NOT NULL,
  new_role VARCHAR(24) NOT NULL,
  changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_role_change_target FOREIGN KEY (target_account_id) REFERENCES accounts(id),
  CONSTRAINT fk_role_change_actor FOREIGN KEY (changed_by_account_id) REFERENCES accounts(id)
);
CREATE INDEX idx_role_change_changed_at ON role_change_history(changed_at);

ALTER TABLE appointments ADD COLUMN assigned_psychologist_id BIGINT NULL;
ALTER TABLE appointments ADD CONSTRAINT fk_appointments_psychologist
  FOREIGN KEY (assigned_psychologist_id) REFERENCES accounts(id);
CREATE INDEX idx_appointments_psychologist ON appointments(assigned_psychologist_id);
