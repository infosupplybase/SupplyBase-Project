-- ---------------------------------------------------------------------------
-- BOOKINGS
--
-- Two lanes through one table, told apart by booking_type:
--
--   SERVICE — a smaller, well-understood job (painting, waterproofing, an
--             electrical requirement). The customer picks a slot and expects
--             someone to turn up.
--   PROJECT — interiors, construction, a full renovation. There is no fixed
--             price to show, so the visit exists to produce a quotation.
--
-- They are one table because they collect almost the same facts and both end
-- in a site visit. Splitting them would duplicate every column to express one
-- difference in what the customer is promised afterwards.
--
-- Nothing here is a confirmed appointment. Every booking is a REQUEST — the
-- slot is a preference, and the team confirms the real time by phone or
-- WhatsApp. Calling the column preferred_slot rather than slot keeps that
-- honest for whoever reads this table next.
-- ---------------------------------------------------------------------------

CREATE TABLE bookings (
    id                 BIGINT       NOT NULL AUTO_INCREMENT,
    reference          VARCHAR(20)  NOT NULL,

    -- SERVICE | PROJECT
    booking_type       VARCHAR(20)  NOT NULL,

    -- Set when the person was signed in. Most bookings come from visitors who
    -- are not, so this stays null and the contact block below is the record.
    user_id            BIGINT                DEFAULT NULL,

    -- ---- what
    service_slug       VARCHAR(60)  NOT NULL,
    service_label      VARCHAR(80)  NOT NULL,
    property_type      VARCHAR(40)           DEFAULT NULL,
    area_sqft          INT                   DEFAULT NULL,
    work_nature        VARCHAR(30)           DEFAULT NULL,
    work_option        VARCHAR(80)           DEFAULT NULL,
    work_detail        TEXT                  DEFAULT NULL,
    material_supplier  VARCHAR(20)           DEFAULT NULL,
    budget_range       VARCHAR(60)           DEFAULT NULL,

    -- ---- when
    preferred_date     DATE                  DEFAULT NULL,
    preferred_slot     VARCHAR(20)           DEFAULT NULL,

    -- ---- who
    name               VARCHAR(120) NOT NULL,
    phone              VARCHAR(20)  NOT NULL,
    whatsapp           VARCHAR(20)           DEFAULT NULL,
    email              VARCHAR(190)          DEFAULT NULL,
    address            VARCHAR(400)          DEFAULT NULL,
    location           VARCHAR(160)          DEFAULT NULL,

    -- ---- handling
    status             VARCHAR(20)  NOT NULL DEFAULT 'NEW',
    -- Photos and floor plans are collected over WhatsApp for now. This records
    -- that the customer said they have some, so nobody has to guess whether a
    -- missing drawing means "none" or "not asked for yet".
    attachments_pending BOOLEAN     NOT NULL DEFAULT FALSE,
    admin_notes        TEXT                  DEFAULT NULL,

    created_at         DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at         DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),

    PRIMARY KEY (id),
    UNIQUE KEY uk_bookings_reference (reference),
    KEY idx_bookings_status (status),
    KEY idx_bookings_type (booking_type),
    KEY idx_bookings_phone (phone),
    -- The list the office works from every morning: today's visits, in order.
    KEY idx_bookings_date_slot (preferred_date, preferred_slot),
    KEY idx_bookings_created (created_at),

    CONSTRAINT ck_bookings_area_positive CHECK (area_sqft IS NULL OR area_sqft > 0),
    CONSTRAINT fk_bookings_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
