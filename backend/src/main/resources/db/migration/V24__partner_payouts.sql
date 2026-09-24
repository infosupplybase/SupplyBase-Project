-- ---------------------------------------------------------------------------
-- PARTNER PAYOUTS: what a partner earns for a job, and whether it was paid
--
-- Until now nothing recorded what a partner is paid, so the partner dashboard
-- could not show earnings. The payout for a job is decided by the office and
-- entered per job in the admin portal:
--
--   partner_payout_paise  what the assigned partner earns for this job
--                         (NULL = not decided yet). Never shown to the customer;
--                         it is not part of the customer's booking response.
--   partner_paid_at       when the office paid it out (NULL = still pending)
--   completed_at          when the work was finished, so "this month" means the
--                         month the job was completed, not the month someone
--                         last edited the booking (updated_at moves on every edit)
--
-- All three are nullable, so existing rows and every existing insert are
-- unaffected.
--
-- DATA WRITTEN TO EXISTING ROWS: completed_at is backfilled for jobs already
-- in WORK_COMPLETED, using updated_at (the best available approximation of
-- when they were completed). Payouts are NOT backfilled — no amount is ever
-- guessed; a completed job shows "payout to be confirmed" until the office
-- enters one.
-- ---------------------------------------------------------------------------

ALTER TABLE bookings
    ADD COLUMN completed_at         DATETIME(6) NULL,
    ADD COLUMN partner_payout_paise BIGINT      NULL,
    ADD COLUMN partner_paid_at      DATETIME(6) NULL;

UPDATE bookings
SET completed_at = updated_at
WHERE status = 'WORK_COMPLETED'
  AND completed_at IS NULL;
