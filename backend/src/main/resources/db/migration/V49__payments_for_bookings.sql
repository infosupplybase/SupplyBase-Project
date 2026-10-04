-- Lets a customer pay a booking's fee online through Razorpay.
--
-- A booking payment is an ordinary payments row (same order, signature and
-- webhook plumbing as a project invoice) that also points at the booking it
-- pays for, so verifying the payment can mark that booking paid.
ALTER TABLE payments
    ADD COLUMN booking_id BIGINT DEFAULT NULL AFTER stage_id,
    ADD KEY idx_payments_booking (booking_id),
    ADD CONSTRAINT fk_payments_booking FOREIGN KEY (booking_id) REFERENCES bookings (id) ON DELETE SET NULL;
