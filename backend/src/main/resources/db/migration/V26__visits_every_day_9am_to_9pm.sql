-- ---------------------------------------------------------------------------
-- VISITING HOURS: every day of the week, 9 AM to 9 PM, for every service
--
-- Until now visits were offered Monday to Saturday, 10 AM to 7 PM (the V5
-- seed). Supplybase works all seven days, 9 AM to 9 PM.
--
-- Every rule active today is switched off rather than deleted (the admin's
-- soft-delete convention, so this is reversible), and one rule per day is
-- added for all services: hourly visits starting 9:00 AM to 8:00 PM, so the
-- last visit ends by 9 PM, two visits per slot as before.
--
-- Nothing already booked changes: a booking keeps the seat it reserved.
-- ---------------------------------------------------------------------------

UPDATE appointment_slot_rules SET active = FALSE WHERE active = TRUE;

INSERT INTO appointment_slot_rules (category_id, day_of_week, start_time, end_time, slot_minutes, max_bookings, active)
SELECT NULL, d.day, '09:00:00', '21:00:00', 60, 2, TRUE
FROM (SELECT 1 AS day UNION SELECT 2 UNION SELECT 3 UNION SELECT 4
      UNION SELECT 5 UNION SELECT 6 UNION SELECT 7) AS d;
