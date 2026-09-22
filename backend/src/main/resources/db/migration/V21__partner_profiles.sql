-- ---------------------------------------------------------------------------
-- PARTNER PROFILES — the professional ("labour") side of SupplyBase
--
-- A partner applies through the partner sign-up page. That creates an ordinary
-- CUSTOMER account plus one row here in PENDING. Only an admin approving the
-- application flips the account to the PROFESSIONAL role — nobody can claim
-- it for themselves — so `status` here is the source of truth and users.role
-- follows it (see PartnerService.review).
--
-- Trade, city and experience are nullable ONLY so the backfill below can give
-- existing PROFESSIONAL accounts (made by hand through the admin Users page,
-- before this table existed) a row without inventing details for them. The
-- application form requires all three, so a real applicant always has them.
-- ---------------------------------------------------------------------------

CREATE TABLE partner_profiles (
    id                BIGINT        NOT NULL AUTO_INCREMENT,
    user_id           BIGINT        NOT NULL,
    primary_trade     VARCHAR(60)            DEFAULT NULL,
    experience_years  INT                    DEFAULT NULL,
    city              VARCHAR(100)           DEFAULT NULL,
    service_areas     VARCHAR(300)           DEFAULT NULL,
    languages         VARCHAR(120)           DEFAULT NULL,
    status            VARCHAR(20)   NOT NULL DEFAULT 'PENDING',
    review_note       VARCHAR(500)           DEFAULT NULL,
    reviewed_by       BIGINT                 DEFAULT NULL,
    reviewed_at       DATETIME(6)            DEFAULT NULL,
    created_at        DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at        DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_partner_profiles_user (user_id),
    KEY idx_partner_profiles_status (status, created_at),
    CONSTRAINT fk_partner_profiles_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_partner_profiles_reviewer FOREIGN KEY (reviewed_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Existing professionals were already vetted by hand, so they carry over as
-- APPROVED (with no trade/city on file) rather than dropping out of the
-- admin Partners list or being forced back through an application.
INSERT INTO partner_profiles (user_id, status)
SELECT id, 'APPROVED' FROM users WHERE role = 'PROFESSIONAL';
