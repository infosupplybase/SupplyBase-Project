-- ---------------------------------------------------------------------------
-- WIDEN bookings.status
--
-- The column was VARCHAR(20), but the PROFESSIONAL_ASSIGNED status is 21
-- characters. On MySQL in strict mode (the default) that update fails with
-- "Data too long for column 'status'", so an admin assigning a professional to
-- a booking was always refused (surfaced as a 409) and no booking could ever
-- reach PROFESSIONAL_ASSIGNED.
--
-- 30 leaves room for a longer status name later. It is the only status enum
-- with a value over 20 characters, so no other table needs the same change.
-- ---------------------------------------------------------------------------

ALTER TABLE bookings
    MODIFY COLUMN status VARCHAR(30) NOT NULL DEFAULT 'NEW';
