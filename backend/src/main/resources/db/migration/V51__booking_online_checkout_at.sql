-- When the customer first opened online checkout (Razorpay) for a booking.
--
-- BookingExpiryJob used to cancel every unpaid booking 24 hours after it was
-- made, though customers are told they can pay our team on the day of the
-- visit. Now it only cancels bookings whose customer chose to pay online and
-- did not finish; a NULL here means they never did, so it is never expired.
--
-- Checked before adding: no earlier migration has online_checkout_at.
ALTER TABLE bookings
    ADD COLUMN online_checkout_at DATETIME(6) NULL AFTER paid_at,
    ADD KEY idx_bookings_status_checkout (status, online_checkout_at);

-- Bookings that already opened checkout keep their place in the rules:
-- payments.booking_id (V5) links a booking's fee payment to it.
UPDATE bookings b
    JOIN (SELECT booking_id, MIN(created_at) AS first_checkout
          FROM payments
          WHERE booking_id IS NOT NULL
          GROUP BY booking_id) p ON p.booking_id = b.id
SET b.online_checkout_at = p.first_checkout;
