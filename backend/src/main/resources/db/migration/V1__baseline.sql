-- ---------------------------------------------------------------------------
-- SUPPLYBASE PROJECTS — BASELINE SCHEMA
--
-- MONEY IS STORED IN PAISE, AS BIGINT. Never DECIMAL, never floating point.
-- Razorpay's API works in the minor unit, so keeping the same unit end to end
-- removes every rounding conversion between the database, the API and the
-- gateway. Divide by 100 only at the point of display.
-- ---------------------------------------------------------------------------

-- ------------------------------------------------------------------- users
CREATE TABLE users (
    id             BIGINT       NOT NULL AUTO_INCREMENT,
    email          VARCHAR(190) NOT NULL,
    password_hash  VARCHAR(100) NOT NULL,
    full_name      VARCHAR(120) NOT NULL,
    phone          VARCHAR(20)           DEFAULT NULL,
    role           VARCHAR(20)  NOT NULL DEFAULT 'CLIENT',
    enabled        BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at     DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at     DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    -- 190 not 255: utf8mb4 is 4 bytes per character and InnoDB's index limit
    -- is 767 bytes on older row formats. 190 * 4 = 760, which always fits.
    UNIQUE KEY uk_users_email (email),
    KEY idx_users_role (role)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Refresh tokens are stored hashed, exactly like passwords. A leaked database
-- should not hand out live sessions.
CREATE TABLE refresh_tokens (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    user_id     BIGINT       NOT NULL,
    token_hash  CHAR(64)     NOT NULL,
    expires_at  DATETIME(6)  NOT NULL,
    revoked     BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at  DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_refresh_token_hash (token_hash),
    KEY idx_refresh_user (user_id),
    KEY idx_refresh_expires (expires_at),
    CONSTRAINT fk_refresh_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- --------------------------------------------------------------- enquiries
-- Fed by the public quote form and the contact form. No user_id: most people
-- who enquire do not have an account, and requiring one would lose the lead.
CREATE TABLE enquiries (
    id            BIGINT       NOT NULL AUTO_INCREMENT,
    reference     VARCHAR(20)  NOT NULL,
    name          VARCHAR(120) NOT NULL,
    phone         VARCHAR(20)  NOT NULL,
    email         VARCHAR(190)          DEFAULT NULL,
    project_type  VARCHAR(60)           DEFAULT NULL,
    service_slug  VARCHAR(60)           DEFAULT NULL,
    location      VARCHAR(160)          DEFAULT NULL,
    budget_range  VARCHAR(60)           DEFAULT NULL,
    description   TEXT                  DEFAULT NULL,
    source        VARCHAR(20)  NOT NULL DEFAULT 'QUOTE_FORM',
    status        VARCHAR(20)  NOT NULL DEFAULT 'NEW',
    admin_notes   TEXT                  DEFAULT NULL,
    created_at    DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at    DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_enquiries_reference (reference),
    KEY idx_enquiries_status (status),
    KEY idx_enquiries_created (created_at),
    KEY idx_enquiries_phone (phone)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- ---------------------------------------------------------------- projects
CREATE TABLE projects (
    id                  BIGINT       NOT NULL AUTO_INCREMENT,
    code                VARCHAR(20)  NOT NULL,
    name                VARCHAR(160) NOT NULL,
    client_user_id      BIGINT                DEFAULT NULL,
    category            VARCHAR(40)           DEFAULT NULL,
    location            VARCHAR(160)          DEFAULT NULL,
    area                VARCHAR(60)           DEFAULT NULL,
    description         TEXT                  DEFAULT NULL,
    status              VARCHAR(20)  NOT NULL DEFAULT 'PLANNING',
    contract_value_paise BIGINT      NOT NULL DEFAULT 0,
    start_date          DATE                  DEFAULT NULL,
    expected_end_date   DATE                  DEFAULT NULL,
    created_at          DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at          DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_projects_code (code),
    KEY idx_projects_client (client_user_id),
    KEY idx_projects_status (status),
    -- SET NULL, not CASCADE: deleting a client account must never delete the
    -- project record, which is a financial and contractual artefact.
    CONSTRAINT fk_projects_client FOREIGN KEY (client_user_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- The stage timeline the client sees on the dashboard.
CREATE TABLE project_stages (
    id            BIGINT       NOT NULL AUTO_INCREMENT,
    project_id    BIGINT       NOT NULL,
    stage_no      INT          NOT NULL,
    title         VARCHAR(120) NOT NULL,
    description   TEXT                  DEFAULT NULL,
    status        VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    started_on    DATE                  DEFAULT NULL,
    completed_on  DATE                  DEFAULT NULL,
    created_at    DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at    DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_stage_per_project (project_id, stage_no),
    CONSTRAINT fk_stages_project FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Drawings, site photos and shared files.
CREATE TABLE project_documents (
    id           BIGINT       NOT NULL AUTO_INCREMENT,
    project_id   BIGINT       NOT NULL,
    title        VARCHAR(160) NOT NULL,
    doc_type     VARCHAR(20)  NOT NULL DEFAULT 'OTHER',
    file_url     VARCHAR(500) NOT NULL,
    content_type VARCHAR(100)          DEFAULT NULL,
    size_bytes   BIGINT                DEFAULT NULL,
    created_at   DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    KEY idx_documents_project (project_id),
    CONSTRAINT fk_documents_project FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- ---------------------------------------------------------------- payments
-- One table covers all three flows you asked for. They differ only by `type`
-- and by which columns are populated:
--   ADVANCE   — booking amount, project_id set, stage_id null
--   MILESTONE — tied to a stage, project_id and stage_id both set
--   INVOICE   — ad-hoc amount, project_id may be null
-- Splitting these into three tables would triple the Razorpay plumbing to
-- describe the same transaction.
CREATE TABLE payments (
    id                  BIGINT       NOT NULL AUTO_INCREMENT,
    reference           VARCHAR(24)  NOT NULL,
    user_id             BIGINT       NOT NULL,
    project_id          BIGINT                DEFAULT NULL,
    stage_id            BIGINT                DEFAULT NULL,
    payment_type        VARCHAR(20)  NOT NULL,
    description         VARCHAR(255) NOT NULL,
    amount_paise        BIGINT       NOT NULL,
    currency            CHAR(3)      NOT NULL DEFAULT 'INR',
    status              VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    due_date            DATE                  DEFAULT NULL,
    razorpay_order_id   VARCHAR(64)           DEFAULT NULL,
    razorpay_payment_id VARCHAR(64)           DEFAULT NULL,
    razorpay_signature  VARCHAR(255)          DEFAULT NULL,
    failure_reason      VARCHAR(255)          DEFAULT NULL,
    paid_at             DATETIME(6)           DEFAULT NULL,
    -- Optimistic-locking counter for JPA's @Version. The browser callback and
    -- Razorpay's webhook can arrive at the same instant for the same payment;
    -- without this both read PENDING and both write PAID.
    version             BIGINT       NOT NULL DEFAULT 0,
    created_at          DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at          DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_payments_reference (reference),
    -- Unique so a retried order-creation cannot produce two rows for one order.
    UNIQUE KEY uk_payments_rzp_order (razorpay_order_id),
    KEY idx_payments_user (user_id),
    KEY idx_payments_project (project_id),
    KEY idx_payments_status (status),
    CONSTRAINT ck_payments_amount_positive CHECK (amount_paise > 0),
    CONSTRAINT fk_payments_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_payments_project FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE SET NULL,
    CONSTRAINT fk_payments_stage FOREIGN KEY (stage_id) REFERENCES project_stages (id) ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Every webhook Razorpay sends, stored before it is acted on.
--
-- razorpay_event_id is UNIQUE and that is the whole idempotency mechanism:
-- Razorpay retries webhooks, and without this a retry of payment.captured
-- would mark an already-paid invoice paid a second time. The insert fails,
-- we recognise the duplicate, and we stop.
CREATE TABLE payment_events (
    id                BIGINT       NOT NULL AUTO_INCREMENT,
    razorpay_event_id VARCHAR(64)           DEFAULT NULL,
    event_type        VARCHAR(60)  NOT NULL,
    payment_id        BIGINT                DEFAULT NULL,
    signature_valid   BOOLEAN      NOT NULL,
    payload           JSON                  DEFAULT NULL,
    processed         BOOLEAN      NOT NULL DEFAULT FALSE,
    process_error     VARCHAR(500)          DEFAULT NULL,
    created_at        DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_events_rzp_event (razorpay_event_id),
    KEY idx_events_payment (payment_id),
    KEY idx_events_type (event_type),
    CONSTRAINT fk_events_payment FOREIGN KEY (payment_id) REFERENCES payments (id) ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
