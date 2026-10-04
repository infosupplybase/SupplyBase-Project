-- Lets a customer pay a booking's fee online through Razorpay.
--
-- Nothing to change: V5 already gave payments the booking_id column, its
-- index and its foreign key to bookings (ON DELETE SET NULL), which is all
-- a booking payment needs. This file first tried to add them again and
-- failed with "Duplicate column name 'booking_id'", stopping the API from
-- starting. It is kept as a no-op so the version number stays taken.
SELECT 1;
