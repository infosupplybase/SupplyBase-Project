-- One row per successful sign-in (password, Google, or a new sign-up), so the
-- admin can see how many people sign in each day. A background token refresh
-- is not a sign-in and is not recorded here.
CREATE TABLE login_events (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    method VARCHAR(20) NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    PRIMARY KEY (id),
    KEY idx_login_events_created (created_at),
    KEY idx_login_events_user_created (user_id, created_at),

    CONSTRAINT fk_login_events_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

ALTER TABLE users ADD COLUMN last_login_at DATETIME(6) NULL;
