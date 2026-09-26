-- ---------------------------------------------------------------------------
-- HOME VISIT FEE: ₹99 for every service
--
-- Fees had drifted: Interior Design, Interior by Choice and Waterproofing
-- charged ₹99, Painting, POP Ceiling, Plumbing, Electrical and Other Services
-- ₹25 (the old default). Supplybase charges one home visit fee, ₹99, for
-- every service, so every category — main services, their sub-services and
-- any switched off today — is set to 9900 paise.
--
-- Only the fee for new bookings changes. A booking already made keeps the fee
-- it was quoted (bookings.visit_fee_paise is its own column).
-- ---------------------------------------------------------------------------

UPDATE service_categories SET visit_fee_paise = 9900 WHERE visit_fee_paise <> 9900;
