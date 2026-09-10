-- ---------------------------------------------------------------------------
-- PLUMBING: ITEMISED CATALOGUE + CART LINE-ITEM PRICING
--
-- Replaces plumbing's generic multi-step wizard questions with an itemised,
-- cart-style catalogue transcribed from SupplyBase_Actual_Screenshots_Catalog.pdf
-- (11 screens: overview + 8 service tabs + consultation). Every price and
-- description below is copied verbatim from that PDF's screenshots (the
-- selectable PDF text only carries page headers — the actual rate card is
-- image content, read manually page by page).
--
-- Modelling choice: each sellable line item is a `service_options` row
-- under the existing `plumbing` category, question_key = 'cart_item',
-- option_group = the tab it appears under, price_paise = its real price.
-- This reuses the catalogue schema exactly as-is (ServiceOption already has
-- `price_paise`) rather than inventing new tables. `question_key` = 'cart_item'
-- and 'consultation_type' are new synthetic question groups particular to
-- this category, read directly by the frontend rather than folded into the
-- generic wizard question renderer.
--
-- The old V6 generic plumbing questions (service_needed, service_location,
-- property_type, water_supply, has_storage, storage_type, urgency,
-- requirement_type, files, notes) are soft-deactivated, not deleted —
-- consistent with the project's existing soft-delete convention. Any
-- historical booking that already stored answers against them is
-- unaffected (BookingAnswer copies question text/value at booking time and
-- does not depend on the catalogue row staying active).
--
-- ===========================================================================
-- PRICING CONFLICTS FOUND IN THE SOURCE PDF — flagged per the user's request,
-- NOT silently resolved. Defaults below are a reasonable starting point
-- (documented per conflict) pending the user's confirmation; nothing here
-- should be read as a final decision.
--
--   1. Overview "From ₹X" vs. the true lowest itemised price on that
--      category's own detail page — MISMATCHED for 6 of 8 categories:
--        Toilet Installation:            overview ₹799  vs actual lowest ₹199 (Toilet Seat Installation)
--        Tap & Faucet Installation:       overview ₹399  vs actual lowest ₹299 (Angle Valve Installation)
--        Bathroom Fitting:                overview ₹999  vs actual lowest ₹299 (Health Faucet / Towel Rod)
--        Basin & Sink Installation:       overview ₹499  vs actual lowest ₹299 (Sink Drain & Waste Fitting)
--        Bathroom Accessories:            overview ₹299  vs actual lowest ₹149 (Robe Hook Installation)
--        Water Tank & Motor Installation: overview ₹1,199 vs actual lowest ₹299 (Float Valve Installation)
--      (Drainage & Blockage and Leakage Repair & Connections both check out —
--      their overview figure matches their true lowest item.)
--      Default applied below: the overview tile always computes its "From"
--      price live from MIN(price_paise) of that tab's active items, so it
--      can never drift from the real catalogue again — this makes the
--      mismatch moot going forward rather than picking one of the two
--      numbers. Flagging it here anyway since it shows the source PDF's own
--      overview screen was already out of date against its own detail pages.
--
--   2. "Health Faucet Installation" is priced and described differently
--      depending on which tab it's shown on:
--        Toilet Installation tab:      ₹299, "Installation of health faucet with holder and connection."
--        Bathroom Fitting tab:         ₹299, "Installation of health faucet with holder and connection." (identical to Toilet's)
--        Tap & Faucet Installation tab: ₹499, "Installation of health faucet with holder and pipe."
--      Toilet and Bathroom Fitting agree with each other; only the Tap &
--      Faucet tab differs, in both price and scope wording ("with holder
--      and pipe" vs "with holder and connection"). Default applied below:
--      kept as two DISTINCT catalogue items — 'health-faucet-installation'
--      (₹299, used on the Toilet and Bathroom Fitting tabs, matching each
--      other exactly) and 'health-faucet-installation-tapfaucet' (₹499,
--      Tap & Faucet tab only) — rather than silently merging them into one
--      price. Please confirm whether these were meant to be the same
--      service (and if so, which price is correct) or are genuinely two
--      different scopes of work.
--
--   3. "Towel Rod Installation" has matching price (₹299 on both tabs) but
--      different described scope:
--        Bathroom Fitting tab:    "Installation of towel rod, towel rack or shelf." (bundles 3 things)
--        Bathroom Accessories tab: "Installation of towel rod (single or double)." (rod only — rack and
--                                   shelf are their own separate priced items on this tab: Towel Rack
--                                   Installation ₹399, Glass Shelf Installation ₹299)
--      Default applied below: unified as ONE catalogue item using the
--      Bathroom Accessories tab's narrower, more precise description (rod
--      only), shown on both tabs — since Bathroom Accessories already sells
--      "rack" and "shelf" as their own distinct priced items, the Bathroom
--      Fitting tab's bundled wording looks like the outlier. Flagging for
--      confirmation rather than assuming.
--
--   4. "Mirror Installation" (Bathroom Fitting, ₹399) and "Bathroom Mirror
--      Installation" (Bathroom Accessories, ₹399) share an identical
--      description and price — unified as one item, 'bathroom-mirror-installation',
--      shown on both tabs. No conflict, just two names for the same row in
--      the source PDF.
--
--   5. "Wall Mixer Installation" appears on both the Tap & Faucet
--      Installation tab (₹699, "for bathroom") and the Bathroom Fitting tab
--      (₹699, "with hot & cold connection") — same price, near-identical
--      scope. Unified as one item shown on both tabs.
-- ===========================================================================

-- ---- deactivate the old generic wizard questions (soft delete) -----------
UPDATE service_options
SET active = FALSE
WHERE category_id = (SELECT id FROM service_categories WHERE slug = 'plumbing')
  AND question_key IN (
      'service_needed', 'service_location', 'property_type', 'water_supply',
      'has_storage', 'storage_type', 'urgency', 'requirement_type', 'files', 'notes'
  );

-- ---- refresh the category's own copy (still one flat "Plumber" row) ------
UPDATE service_categories
SET tagline = 'Verified plumbers. Transparent pricing. On-time service.',
    description = 'Toilet installation, taps and faucets, bathroom fittings, basins and sinks, bathroom accessories, drainage and blockage clearing, leakage repair and water tank and motor installation — itemised pricing for everything up to ₹5,000, a ₹99 home visit for anything larger.'
WHERE slug = 'plumbing';

-- ===========================================================================
-- TOILET INSTALLATION
-- ===========================================================================
INSERT INTO service_options
    (category_id, step_no, question_key, question_text, input_type, required,
     option_value, option_label, option_hint, option_group, price_paise, sort_order, active)
SELECT id, 1, 'cart_item', 'Select a service', 'MULTI', FALSE, v.option_value, v.option_label, v.option_hint, 'Toilet Installation', v.price_paise, v.sort_order, TRUE
FROM service_categories, (
    SELECT 'western-toilet-installation' AS option_value, 'Western Toilet Installation' AS option_label, 'Installation of floor mounted or wall hung western toilet (commode).' AS option_hint, 79900 AS price_paise, 1 AS sort_order
    UNION ALL SELECT 'indian-toilet-installation', 'Indian Toilet Installation', 'Installation of Indian toilet (squatting pan).', 59900, 2
    UNION ALL SELECT 'flush-tank-installation', 'Flush Tank Installation', 'Installation of flush tank (overhead or concealed).', 39900, 3
    UNION ALL SELECT 'flush-mechanism-repair', 'Flush Mechanism Repair / Replacement', 'Repair or replacement of flush mechanism.', 29900, 4
    UNION ALL SELECT 'toilet-seat-installation', 'Toilet Seat Installation', 'Installation of toilet seat cover (soft close or normal).', 19900, 5
    UNION ALL SELECT 'health-faucet-installation', 'Health Faucet Installation', 'Installation of health faucet with holder and connection.', 29900, 6
) AS v
WHERE slug = 'plumbing';

-- ===========================================================================
-- TAP & FAUCET INSTALLATION
-- ===========================================================================
INSERT INTO service_options
    (category_id, step_no, question_key, question_text, input_type, required,
     option_value, option_label, option_hint, option_group, price_paise, sort_order, active)
SELECT id, 1, 'cart_item', 'Select a service', 'MULTI', FALSE, v.option_value, v.option_label, v.option_hint, 'Tap & Faucet Installation', v.price_paise, v.sort_order, TRUE
FROM service_categories, (
    SELECT 'basin-tap-installation' AS option_value, 'Basin Tap Installation' AS option_label, 'Installation of single lever or pillar tap (for wash basin).' AS option_hint, 39900 AS price_paise, 1 AS sort_order
    UNION ALL SELECT 'kitchen-sink-tap-installation', 'Kitchen Sink Tap Installation', 'Installation of kitchen sink tap (wall mounted or table mounted).', 49900, 2
    UNION ALL SELECT 'wall-mixer-installation', 'Wall Mixer Installation', 'Installation of 2-in-1 or 3-in-1 wall mixer (for bathroom, with hot & cold connection).', 69900, 3
    UNION ALL SELECT 'pillar-tap-installation', 'Pillar Tap Installation', 'Installation of pillar cock / long body tap (for countertop).', 39900, 4
    UNION ALL SELECT 'angle-valve-installation', 'Angle Valve Installation', 'Installation of angle valve (for tap, toilet, geyser, etc.).', 29900, 5
    UNION ALL SELECT 'health-faucet-installation-tapfaucet', 'Health Faucet Installation', 'Installation of health faucet with holder and pipe.', 49900, 6
) AS v
WHERE slug = 'plumbing';

-- ===========================================================================
-- BATHROOM FITTING
-- ===========================================================================
INSERT INTO service_options
    (category_id, step_no, question_key, question_text, input_type, required,
     option_value, option_label, option_hint, option_group, price_paise, sort_order, active)
SELECT id, 1, 'cart_item', 'Select a service', 'MULTI', FALSE, v.option_value, v.option_label, v.option_hint, 'Bathroom Fitting', v.price_paise, v.sort_order, TRUE
FROM service_categories, (
    SELECT 'shower-installation' AS option_value, 'Shower Installation' AS option_label, 'Installation of overhead shower or hand shower with connection.' AS option_hint, 49900 AS price_paise, 1 AS sort_order
    UNION ALL SELECT 'wall-mixer-installation', 'Wall Mixer Installation', 'Installation of 2-in-1 or 3-in-1 wall mixer (for bathroom, with hot & cold connection).', 69900, 2
    UNION ALL SELECT 'health-faucet-installation', 'Health Faucet Installation', 'Installation of health faucet with holder and connection.', 29900, 3
    UNION ALL SELECT 'towel-rod-installation', 'Towel Rod Installation', 'Installation of towel rod (single or double).', 29900, 4
    UNION ALL SELECT 'bathroom-mirror-installation', 'Bathroom Mirror Installation', 'Installation of bathroom mirror (with or without cabinet).', 39900, 5
) AS v
WHERE slug = 'plumbing';

-- ===========================================================================
-- BASIN & SINK INSTALLATION
-- ===========================================================================
INSERT INTO service_options
    (category_id, step_no, question_key, question_text, input_type, required,
     option_value, option_label, option_hint, option_group, price_paise, sort_order, active)
SELECT id, 1, 'cart_item', 'Select a service', 'MULTI', FALSE, v.option_value, v.option_label, v.option_hint, 'Basin & Sink Installation', v.price_paise, v.sort_order, TRUE
FROM service_categories, (
    SELECT 'wash-basin-installation' AS option_value, 'Wash Basin Installation' AS option_label, 'Installation of wall hung, table top or pedestal basin.' AS option_hint, 49900 AS price_paise, 1 AS sort_order
    UNION ALL SELECT 'table-top-basin-installation', 'Table Top Basin Installation', 'Installation of countertop / table top basin (without counter fabrication).', 69900, 2
    UNION ALL SELECT 'under-counter-basin-installation', 'Under Counter Basin Installation', 'Installation of under counter basin (within existing countertop).', 69900, 3
    UNION ALL SELECT 'kitchen-sink-installation', 'Kitchen Sink Installation', 'Installation of single or double bowl sink (with or without existing counter cut).', 79900, 4
    UNION ALL SELECT 'sink-drain-waste-fitting', 'Sink Drain & Waste Fitting', 'Installation of sink waste, bottle trap or drain pipe connection.', 29900, 5
    UNION ALL SELECT 'utility-sink-installation', 'Utility Sink Installation', 'Installation of utility sink (balcony, laundry, etc.).', 59900, 6
) AS v
WHERE slug = 'plumbing';

-- ===========================================================================
-- BATHROOM ACCESSORIES
-- ===========================================================================
INSERT INTO service_options
    (category_id, step_no, question_key, question_text, input_type, required,
     option_value, option_label, option_hint, option_group, price_paise, sort_order, active)
SELECT id, 1, 'cart_item', 'Select a service', 'MULTI', FALSE, v.option_value, v.option_label, v.option_hint, 'Bathroom Accessories', v.price_paise, v.sort_order, TRUE
FROM service_categories, (
    SELECT 'towel-rod-installation' AS option_value, 'Towel Rod Installation' AS option_label, 'Installation of towel rod (single or double).' AS option_hint, 29900 AS price_paise, 1 AS sort_order
    UNION ALL SELECT 'towel-rack-installation', 'Towel Rack Installation', 'Installation of towel rack / shelf.', 39900, 2
    UNION ALL SELECT 'soap-dish-installation', 'Soap Dish Installation', 'Installation of soap dish (wall mounted).', 19900, 3
    UNION ALL SELECT 'tumbler-holder-installation', 'Tumbler Holder Installation', 'Installation of tumbler holder.', 19900, 4
    UNION ALL SELECT 'robe-hook-installation', 'Robe Hook Installation', 'Installation of robe hook / coat hook.', 14900, 5
    UNION ALL SELECT 'toilet-paper-holder-installation', 'Toilet Paper Holder Installation', 'Installation of toilet paper holder.', 19900, 6
    UNION ALL SELECT 'glass-shelf-installation', 'Glass Shelf Installation', 'Installation of glass shelf (with brackets).', 29900, 7
    UNION ALL SELECT 'bathroom-mirror-installation', 'Bathroom Mirror Installation', 'Installation of bathroom mirror (with or without cabinet).', 39900, 8
) AS v
WHERE slug = 'plumbing';

-- ===========================================================================
-- DRAINAGE & BLOCKAGE
-- ===========================================================================
INSERT INTO service_options
    (category_id, step_no, question_key, question_text, input_type, required,
     option_value, option_label, option_hint, option_group, price_paise, sort_order, active)
SELECT id, 1, 'cart_item', 'Select a service', 'MULTI', FALSE, v.option_value, v.option_label, v.option_hint, 'Drainage & Blockage', v.price_paise, v.sort_order, TRUE
FROM service_categories, (
    SELECT 'bathroom-drain-cleaning' AS option_value, 'Bathroom Drain Cleaning' AS option_label, 'Clearing blockage in bathroom floor drain (trap and pipeline).' AS option_hint, 34900 AS price_paise, 1 AS sort_order
    UNION ALL SELECT 'kitchen-sink-blockage-removal', 'Kitchen Sink Blockage Removal', 'Clearing blockage in kitchen sink (grease, food waste, etc.).', 39900, 2
    UNION ALL SELECT 'wash-basin-blockage-removal', 'Wash Basin Blockage Removal', 'Clearing blockage in wash basin drain.', 29900, 3
    UNION ALL SELECT 'toilet-blockage-removal', 'Toilet Blockage Removal', 'Clearing blockage in Indian or Western toilet (using professional tools).', 49900, 4
    UNION ALL SELECT 'floor-drain-jet-cleaning', 'Floor Drain Jet Cleaning', 'High-pressure jet cleaning for stubborn blockage (internal pipeline).', 69900, 5
    UNION ALL SELECT 'drain-pipe-repair', 'Drain Pipe Repair / Replacement', 'Repair or replacement of damaged drain pipes (PVC/CP).', 49900, 6
) AS v
WHERE slug = 'plumbing';

-- ===========================================================================
-- LEAKAGE REPAIR & CONNECTIONS
-- ===========================================================================
INSERT INTO service_options
    (category_id, step_no, question_key, question_text, input_type, required,
     option_value, option_label, option_hint, option_group, price_paise, sort_order, active)
SELECT id, 1, 'cart_item', 'Select a service', 'MULTI', FALSE, v.option_value, v.option_label, v.option_hint, 'Leakage Repair & Connections', v.price_paise, v.sort_order, TRUE
FROM service_categories, (
    SELECT 'pipe-leakage-repair' AS option_value, 'Pipe Leakage Repair' AS option_label, 'Repair of leaking water pipes (CPVC, PVC, GI).' AS option_hint, 39900 AS price_paise, 1 AS sort_order
    UNION ALL SELECT 'tap-faucet-leakage-repair', 'Tap/Faucet Leakage Repair', 'Repair of leaking tap, mixer or faucet.', 29900, 2
    UNION ALL SELECT 'toilet-connection-leak-repair', 'Toilet Connection Leak Repair', 'Repair leakage in inlet/outlet connection, flush pipe or health faucet line.', 39900, 3
    UNION ALL SELECT 'sink-basin-connection-repair', 'Sink/Basin Connection Repair', 'Repair leakage in sink, basin, waste pipe or under-sink fittings.', 39900, 4
    UNION ALL SELECT 'new-water-line-connection', 'New Water Line Connection', 'Installation of new water inlet/outlet connection (for geyser, tap, washing machine, etc.).', 49900, 5
    UNION ALL SELECT 'washing-machine-connection', 'Washing Machine Connection', 'Inlet and outlet connection for washing machine (with leak check).', 39900, 6
) AS v
WHERE slug = 'plumbing';

-- ===========================================================================
-- WATER TANK & MOTOR INSTALLATION
-- ===========================================================================
INSERT INTO service_options
    (category_id, step_no, question_key, question_text, input_type, required,
     option_value, option_label, option_hint, option_group, price_paise, sort_order, active)
SELECT id, 1, 'cart_item', 'Select a service', 'MULTI', FALSE, v.option_value, v.option_label, v.option_hint, 'Water Tank & Motor Installation', v.price_paise, v.sort_order, TRUE
FROM service_categories, (
    SELECT 'overhead-water-tank-installation' AS option_value, 'Overhead Water Tank Installation' AS option_label, 'Installation of water tank (500L - 2000L) with inlet, outlet and float valve connection.' AS option_hint, 99900 AS price_paise, 1 AS sort_order
    UNION ALL SELECT 'underground-water-tank-installation', 'Underground Water Tank Installation', 'Installation of underground water tank with inlet, outlet and proper fittings.', 149900, 2
    UNION ALL SELECT 'water-motor-installation', 'Water Motor Installation', 'Installation of water pump (0.5HP - 2HP) with electrical and pipeline connection.', 99900, 3
    UNION ALL SELECT 'float-valve-installation', 'Float Valve Installation', 'Installation or replacement of float valve to control water level.', 29900, 4
    UNION ALL SELECT 'pipeline-fittings-connection', 'Pipeline & Fittings Connection', 'Installation of PVC/CPVC pipeline, valves and fittings for tank or motor.', 49900, 5
    UNION ALL SELECT 'motor-repair-replacement', 'Motor Repair & Replacement', 'Repair or replacement of existing water motor (bearing, capacitor, impeller, etc.).', 69900, 6
) AS v
WHERE slug = 'plumbing';

-- ===========================================================================
-- CONSULTATION TYPES — flat ₹99, adjusted into the final bill if the
-- customer proceeds. Durations from the PDF are appended to option_hint
-- since service_options has no dedicated duration column.
-- ===========================================================================
INSERT INTO service_options
    (category_id, step_no, question_key, question_text, input_type, required,
     option_value, option_label, option_hint, option_group, price_paise, sort_order, active)
SELECT id, 2, 'consultation_type', 'Choose a consultation type', 'SINGLE', FALSE, v.option_value, v.option_label, v.option_hint, 'Consultation', v.price_paise, v.sort_order, TRUE
FROM service_categories, (
    SELECT 'general-home-service-consultation' AS option_value, 'General Home Service Consultation' AS option_label, 'Get expert advice for plumbing, electrical, carpentry and other home services.|30-45 mins' AS option_hint, 9900 AS price_paise, 1 AS sort_order
    UNION ALL SELECT 'bathroom-solutions-consultation', 'Bathroom Solutions Consultation', 'Expert guidance for bathroom fittings, water supply, drainage, leakage and renovation.|30-45 mins', 9900, 2
    UNION ALL SELECT 'water-tank-motor-consultation', 'Water Tank & Motor Consultation', 'Get the right solution for tank, motor, pipeline and water supply setup.|30-45 mins', 9900, 3
    UNION ALL SELECT 'kitchen-sink-consultation', 'Kitchen & Sink Consultation', 'Guidance for kitchen sink installation, drainage, pipe connections and fittings.|30-45 mins', 9900, 4
    UNION ALL SELECT 'site-inspection-quotation', 'Site Inspection & Quotation', 'On-site inspection and detailed quotation for larger projects (above Rs 5,000).|45-60 mins', 9900, 5
) AS v
WHERE slug = 'plumbing';

-- ===========================================================================
-- CART LINE-ITEM PRICING — quantity and a server-computed, server-trusted
-- price per booking_answers row, so a cart checkout's total is never taken
-- from the client. NULL for every pre-existing row (plain form answers,
-- not cart items).
-- ===========================================================================
ALTER TABLE booking_answers
    ADD COLUMN quantity INT NOT NULL DEFAULT 1 AFTER answer_label,
    ADD COLUMN unit_price_paise BIGINT NULL AFTER quantity,
    ADD COLUMN line_total_paise BIGINT NULL AFTER unit_price_paise;

-- The sum of a booking's cart line items — distinct from visit_fee_paise,
-- which stays the amount actually payable now (see BookingService: the real
-- items total when it is at or under Rs 5,000, or the flat Rs 99 home-visit
-- fee when it is over, or for a pure consultation booking with no items).
ALTER TABLE bookings
    ADD COLUMN items_total_paise BIGINT NULL AFTER visit_fee_paise;
