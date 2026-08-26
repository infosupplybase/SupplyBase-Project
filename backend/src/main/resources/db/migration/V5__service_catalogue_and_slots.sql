-- ---------------------------------------------------------------------------
-- SERVICE CATALOGUE, APPOINTMENT SLOTS, AND THE ₹25 SITE-VISIT FEE
--
-- Three things change here:
--
--   1. Roles become CUSTOMER / PROFESSIONAL / ADMIN. A professional does the
--      work; the old MANAGER role described someone running projects from the
--      office, which is what ADMIN now covers.
--
--   2. The four customer-facing categories move out of the frontend and into
--      the database, along with every question they ask. Options in code mean
--      a deploy to add a checkbox; options in a table mean an admin screen.
--
--   3. Appointment availability comes from the database, never the frontend,
--      and a slot cannot be overbooked. See appointment_slots below.
-- ---------------------------------------------------------------------------

-- ------------------------------------------------------------------- roles
UPDATE users SET role = 'CUSTOMER'     WHERE role = 'CLIENT';
UPDATE users SET role = 'PROFESSIONAL' WHERE role = 'MANAGER';

-- --------------------------------------------------------- number sequences
-- Booking numbers are SB-2026-000001: sequential, per year, and read out over
-- the phone. AUTO_INCREMENT cannot produce that because it does not reset per
-- year, so a counter row is taken with SELECT ... FOR UPDATE instead. One row
-- per sequence per year means the lock is held for microseconds and never
-- blocks anything but another booking created in the same second.
CREATE TABLE number_sequences (
    name       VARCHAR(40) NOT NULL,
    year       INT         NOT NULL,
    next_value BIGINT      NOT NULL DEFAULT 1,
    PRIMARY KEY (name, year)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- ------------------------------------------------------- service catalogue
CREATE TABLE service_categories (
    id           BIGINT       NOT NULL AUTO_INCREMENT,
    slug         VARCHAR(60)  NOT NULL,
    name         VARCHAR(80)  NOT NULL,
    tagline      VARCHAR(160)          DEFAULT NULL,
    description  TEXT                  DEFAULT NULL,
    icon         VARCHAR(40)           DEFAULT NULL,
    hero_image   VARCHAR(300)          DEFAULT NULL,
    -- Per category, so the fee can differ later without a schema change.
    -- 2500 paise = ₹25.
    visit_fee_paise BIGINT    NOT NULL DEFAULT 2500,
    sort_order   INT          NOT NULL DEFAULT 0,
    active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at   DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at   DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_categories_slug (slug),
    KEY idx_categories_active (active, sort_order)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Every question the booking form asks, and every answer it offers.
--
-- question_key groups options into one question ('wall_condition'); input_type
-- says how to render it. The frontend walks this table rather than holding its
-- own copy of the list, so adding "Pergola Waterproofing" is one INSERT.
CREATE TABLE service_options (
    id            BIGINT       NOT NULL AUTO_INCREMENT,
    category_id   BIGINT       NOT NULL,
    step_no       INT          NOT NULL,
    question_key  VARCHAR(60)  NOT NULL,
    question_text VARCHAR(200) NOT NULL,
    -- SINGLE | MULTI | TEXT | NUMBER | FILE
    input_type    VARCHAR(20)  NOT NULL DEFAULT 'SINGLE',
    required      BOOLEAN      NOT NULL DEFAULT FALSE,
    option_value  VARCHAR(80)           DEFAULT NULL,
    option_label  VARCHAR(160)          DEFAULT NULL,
    option_hint   VARCHAR(300)          DEFAULT NULL,
    option_group  VARCHAR(60)           DEFAULT NULL,
    sort_order    INT          NOT NULL DEFAULT 0,
    active        BOOLEAN      NOT NULL DEFAULT TRUE,
    PRIMARY KEY (id),
    KEY idx_options_category_step (category_id, step_no, sort_order),
    CONSTRAINT fk_options_category FOREIGN KEY (category_id)
        REFERENCES service_categories (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- ----------------------------------------------------- appointment planning
-- The rule an admin sets: "Mondays, 10am to 6pm, hourly, two visits per slot."
CREATE TABLE appointment_slot_rules (
    id            BIGINT      NOT NULL AUTO_INCREMENT,
    -- NULL means the rule applies to every category.
    category_id   BIGINT               DEFAULT NULL,
    day_of_week   TINYINT     NOT NULL,           -- 1 = Monday .. 7 = Sunday
    start_time    TIME        NOT NULL,
    end_time      TIME        NOT NULL,
    slot_minutes  INT         NOT NULL DEFAULT 60,
    max_bookings  INT         NOT NULL DEFAULT 2,
    active        BOOLEAN     NOT NULL DEFAULT TRUE,
    PRIMARY KEY (id),
    KEY idx_rules_day (day_of_week, active),
    CONSTRAINT ck_rules_day CHECK (day_of_week BETWEEN 1 AND 7),
    CONSTRAINT ck_rules_capacity CHECK (max_bookings > 0),
    CONSTRAINT ck_rules_window CHECK (end_time > start_time),
    CONSTRAINT fk_rules_category FOREIGN KEY (category_id)
        REFERENCES service_categories (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Dates the office is closed, which win over any rule.
CREATE TABLE appointment_blackouts (
    id       BIGINT      NOT NULL AUTO_INCREMENT,
    day      DATE        NOT NULL,
    reason   VARCHAR(160)         DEFAULT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_blackout_day (day)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- A real slot on a real date, created the first time anyone books into it.
--
-- THIS TABLE IS WHAT PREVENTS DOUBLE BOOKING. Two customers pressing "pay"
-- at the same instant both read booked_count = 1 and both try to write 2.
-- The UNIQUE key makes the row single, the CHECK makes overfilling illegal,
-- and `version` gives JPA optimistic locking so the second writer is rejected
-- instead of silently overwriting the first. Availability is never decided by
-- reading a count and trusting it a moment later.
CREATE TABLE appointment_slots (
    id            BIGINT      NOT NULL AUTO_INCREMENT,
    slot_date     DATE        NOT NULL,
    slot_time     TIME        NOT NULL,
    category_id   BIGINT               DEFAULT NULL,
    capacity      INT         NOT NULL,
    booked_count  INT         NOT NULL DEFAULT 0,
    version       BIGINT      NOT NULL DEFAULT 0,
    created_at    DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_slot_date_time_category (slot_date, slot_time, category_id),
    KEY idx_slots_date (slot_date),
    CONSTRAINT ck_slots_not_overbooked CHECK (booked_count <= capacity),
    CONSTRAINT ck_slots_count_positive CHECK (booked_count >= 0),
    CONSTRAINT fk_slots_category FOREIGN KEY (category_id)
        REFERENCES service_categories (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- ------------------------------------------------------------- bookings v2
ALTER TABLE bookings
    ADD COLUMN booking_number VARCHAR(20) NULL AFTER reference,
    ADD COLUMN category_id BIGINT NULL AFTER booking_type,
    ADD COLUMN appointment_slot_id BIGINT NULL AFTER preferred_slot,
    ADD COLUMN assigned_professional_id BIGINT NULL AFTER status,
    ADD COLUMN city VARCHAR(80) NULL AFTER address,
    ADD COLUMN pincode VARCHAR(10) NULL AFTER city,
    ADD COLUMN visit_fee_paise BIGINT NOT NULL DEFAULT 2500 AFTER status,
    ADD COLUMN paid_at DATETIME(6) NULL AFTER visit_fee_paise,
    ADD COLUMN cancelled_reason VARCHAR(300) NULL AFTER paid_at,
    ADD COLUMN version BIGINT NOT NULL DEFAULT 0;

-- Existing rows predate the fee, so they are given a settled status rather
-- than being left looking like they owe ₹25.
UPDATE bookings SET status = 'BOOKING_REQUESTED' WHERE status = 'NEW';

ALTER TABLE bookings
    ADD UNIQUE KEY uk_bookings_number (booking_number),
    ADD KEY idx_bookings_professional (assigned_professional_id),
    ADD KEY idx_bookings_category (category_id),
    ADD CONSTRAINT fk_bookings_category FOREIGN KEY (category_id)
        REFERENCES service_categories (id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_bookings_slot FOREIGN KEY (appointment_slot_id)
        REFERENCES appointment_slots (id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_bookings_professional FOREIGN KEY (assigned_professional_id)
        REFERENCES users (id) ON DELETE SET NULL;

-- The per-service answers. A tall table rather than a wide one: painting asks
-- about wall condition, plumbing asks about water supply, and a column per
-- question across four services would be mostly NULL and would need a
-- migration every time a question is added.
CREATE TABLE booking_answers (
    id            BIGINT       NOT NULL AUTO_INCREMENT,
    booking_id    BIGINT       NOT NULL,
    question_key  VARCHAR(60)  NOT NULL,
    question_text VARCHAR(200)          DEFAULT NULL,
    answer_value  VARCHAR(400) NOT NULL,
    answer_label  VARCHAR(300)          DEFAULT NULL,
    PRIMARY KEY (id),
    KEY idx_answers_booking (booking_id),
    CONSTRAINT fk_answers_booking FOREIGN KEY (booking_id)
        REFERENCES bookings (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- File METADATA only. The bytes live in object storage; MySQL holds the key.
-- Putting a 40MB site video in a BLOB column bloats every backup and every
-- replica, and streams it through the database on the way out.
CREATE TABLE booking_files (
    id             BIGINT       NOT NULL AUTO_INCREMENT,
    booking_id     BIGINT       NOT NULL,
    storage_key    VARCHAR(400) NOT NULL,
    original_name  VARCHAR(255) NOT NULL,
    content_type   VARCHAR(100) NOT NULL,
    size_bytes     BIGINT       NOT NULL,
    kind           VARCHAR(20)  NOT NULL DEFAULT 'PHOTO',
    uploaded_by    BIGINT                DEFAULT NULL,
    created_at     DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_files_storage_key (storage_key),
    KEY idx_files_booking (booking_id),
    CONSTRAINT ck_files_size CHECK (size_bytes > 0),
    CONSTRAINT fk_files_booking FOREIGN KEY (booking_id)
        REFERENCES bookings (id) ON DELETE CASCADE,
    CONSTRAINT fk_files_uploader FOREIGN KEY (uploaded_by)
        REFERENCES users (id) ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- ---------------------------------------------------------------- payments
-- The ₹25 fee is a payment against a booking, not a project.
ALTER TABLE payments
    ADD COLUMN booking_id BIGINT NULL AFTER project_id,
    ADD KEY idx_payments_booking (booking_id),
    ADD CONSTRAINT fk_payments_booking FOREIGN KEY (booking_id)
        REFERENCES bookings (id) ON DELETE SET NULL;

-- ===========================================================================
-- SEED: the four categories. Exactly four, per RULE 1.
-- ===========================================================================
INSERT INTO service_categories (slug, name, tagline, description, icon, visit_fee_paise, sort_order) VALUES
('painting-waterproofing', 'Painting & Waterproofing',
 'Book a service and get expert visit, assessment and quotation.',
 'Interior and exterior painting, putty and primer work, and waterproofing for terraces, bathrooms, balconies and basements.',
 'painting', 2500, 1),
('plumbing', 'Plumbing',
 'Book a service and get expert visit, assessment and quotation.',
 'Leakage repair, pipe and tap work, bathroom and kitchen plumbing, tanks, drainage and pumps.',
 'plumbing', 2500, 2),
('electrician', 'Electrician',
 'Safe. Reliable. On-Time.',
 'Wiring and rewiring, new installations, fans, lights, switches, MCB and DB work, and fault repair.',
 'electrical', 2500, 3),
('interior-work', 'Interior Work',
 'Beautiful interiors, designed for you.',
 'Full home interiors, modular kitchens, wardrobes, false ceilings, TV units and office interiors.',
 'interior-design', 2500, 4);

-- ===========================================================================
-- SEED: appointment rules — Monday to Saturday, the six slots in the brief.
-- Sunday is left out entirely rather than added and deactivated, so the table
-- says what the office actually does.
-- ===========================================================================
INSERT INTO appointment_slot_rules (category_id, day_of_week, start_time, end_time, slot_minutes, max_bookings)
SELECT NULL, d.day, '10:00:00', '19:00:00', 60, 2
FROM (SELECT 1 AS day UNION SELECT 2 UNION SELECT 3
      UNION SELECT 4 UNION SELECT 5 UNION SELECT 6) AS d;
