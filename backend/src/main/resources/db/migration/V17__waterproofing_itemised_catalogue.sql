-- ---------------------------------------------------------------------------
-- WATERPROOFING — six dedicated service journeys (Terrace, Exterior Wall,
-- Bathroom/Floor, Interior Wall, Water Tank, Basement)
--
-- Same modelling approach as V14 (plumbing) / V15 (painting) / V16 (pop
-- ceiling): new, flow-prefixed question_key rows on the existing category,
-- read by a dedicated frontend flow rather than the generic wizard. Nothing
-- here touches historical booking_answer rows or the old generic-wizard
-- question set, which stays fully active and unchanged (still used by
-- Bathroom's five non-detailed subservices — see note 3).
--
-- STRUCTURAL DIFFERENCE FROM PAINTING/POP: the reference
-- (SupplyBase_Waterproofing_Services.pdf) never shows an "add items to a
-- cart" UI anywhere in any of its 6 flows — every rate screen is a plain,
-- read-only table (Service/Solution -> rate RANGE per sq. ft.), and the
-- only thing a customer actually SELECTS is a preferred BRAND. So unlike
-- Painting's per-item add-ons, there is nothing here for a customer to add
-- up into a real itemsTotalPaise — unavoidable, since a rate *range* with
-- no measured area is not a number you can sum without inventing one
-- (exactly what the brief prohibits: "do not sum ... into a fabricated
-- total").
--
-- Decisions flagged for confirmation, not silently finalised:
--
-- 1. VISIT FEE — changed from the category's existing flat 2500 (₹25) to
--    9900 (₹99). The reference is explicit and repeated across all 6
--    flows: "For projects above ₹5,000, a ₹99 home visit fee applies,
--    adjusted in the final bill if you proceed" — but because no real
--    priced cart exists here (see above), there is no way for this app to
--    ever know a project's value BEFORE inspection, so the "≤₹5,000, pay
--    the actual total instead" branch (the same mechanism Plumbing uses,
--    BookingService.ACTUAL_PRICING_THRESHOLD_PAISE) can never be
--    meaningfully evaluated for this category — project value here is
--    always "unknown until the site visit", which the brief's own
--    fallback instruction says to treat as flagged-and-configurable rather
--    than inventing an estimate. In practice this means every
--    Waterproofing booking shows/charges the flat ₹99 — set directly on
--    this category so BookingService.java needed NO code changes (no new
--    priced-keys set, no slug-gated threshold branch to extend — see the
--    delivery report for the full reasoning). If a future real, measured
--    cart is added for this category, extending BookingService's existing
--    PLUMBING_SLUG threshold check to include 'waterproofing' at that
--    point is a one-line change.
--
-- 2. BRAND-SPECIFIC RATES. Only Dr. Fixit has legible, complete rate data
--    in the reference for five of the six flows (Terrace, Exterior Wall,
--    Bathroom/Floor, Interior Wall, Basement) — Asian Paints and Berger
--    are shown only as unexpanded "> Rates" links with no visible numbers.
--    Water Tank is the one exception: the reference gives real numbers for
--    all three brands, separately for overhead and underground tanks.
--    Inventing Asian Paints/Berger numbers for the other five flows was
--    not done; the frontend shows an honest "quote after inspection"
--    state for any brand/flow combination with no rate rows below,
--    matching the precedent already established in Painting's ProductPicker.
--
-- 3. BATHROOM stays a two-tier structure. The reference gives Floor
--    Waterproofing a full detail screen (hero, benefits, brand, rates) but
--    only a plain list row for its other five subservices (Wall, Corner &
--    Joint Sealing, Shower Area, Pipeline & Fixture Sealing, Tile
--    Re-sealing). Those five continue to use the EXISTING generic
--    site-visit wizard (ServiceBooking.jsx, untouched) via the same
--    ?preselect= deep link built for POP Ceiling's non-detailed
--    subservices. 'Bathroom Waterproofing' already existed as a
--    service_needed option; the five below are additive, newly-scoped
--    options so each subservice can preselect precisely rather than all
--    five bucketing under one generic value.
--
-- 4. price_paise is NULL on every rate row below — see the "no real cart"
--    note above. option_hint carries the rate range as display text (e.g.
--    "₹70 – ₹90"), option_group carries the brand label so the frontend
--    can filter/tab by brand, matching the exact mechanism already used
--    for Painting's colour-swatch tabs (V15).
--
-- 5. Two reference claims are NOT carried into this migration's copy or
--    the frontend: "100% leak-free performance" (Water Tank's final
--    testing stage) and "keeps drinking water clean and safe" (Water
--    Tank's benefits list) — both are the kind of unsupported guarantee
--    the brief explicitly says not to repeat. Softened wording is used
--    instead; see the delivery report.
-- ---------------------------------------------------------------------------

UPDATE service_categories
SET tagline = 'Leak-Free Spaces. Longer Life.',
    description = 'Terrace, exterior wall, bathroom, interior wall, water tank and basement waterproofing — Dr. Fixit, Asian Paints and Berger systems, with doorstep inspection and quotation.',
    visit_fee_paise = 9900
WHERE slug = 'waterproofing';

-- Additive: five subservice names the reference names under Bathroom but
-- gives no detail screen to. Same shape as the ten existing service_needed
-- options (unpriced, never in a priced-keys set).
INSERT INTO service_options
    (category_id, step_no, question_key, question_text, input_type, required,
     option_value, option_label, option_hint, option_group, sort_order)
VALUES
((SELECT id FROM service_categories WHERE slug = 'waterproofing'), 1, 'service_needed', 'What waterproofing service do you need?', 'MULTI', TRUE, 'Bathroom Wall Waterproofing', 'Bathroom Wall Waterproofing', NULL, NULL, 11),
((SELECT id FROM service_categories WHERE slug = 'waterproofing'), 1, 'service_needed', 'What waterproofing service do you need?', 'MULTI', TRUE, 'Bathroom Corner & Joint Sealing', 'Bathroom Corner & Joint Sealing', NULL, NULL, 12),
((SELECT id FROM service_categories WHERE slug = 'waterproofing'), 1, 'service_needed', 'What waterproofing service do you need?', 'MULTI', TRUE, 'Bathroom Shower Area Waterproofing', 'Bathroom Shower Area Waterproofing', NULL, NULL, 13),
((SELECT id FROM service_categories WHERE slug = 'waterproofing'), 1, 'service_needed', 'What waterproofing service do you need?', 'MULTI', TRUE, 'Bathroom Pipeline & Fixture Sealing', 'Bathroom Pipeline & Fixture Sealing', NULL, NULL, 14),
((SELECT id FROM service_categories WHERE slug = 'waterproofing'), 1, 'service_needed', 'What waterproofing service do you need?', 'MULTI', TRUE, 'Bathroom Tile Re-sealing', 'Bathroom Tile Re-sealing', NULL, NULL, 15);

-- ===========================================================================
-- Shared brand choice — wp_brand (used by all six detailed flows)
-- ===========================================================================
INSERT INTO service_options
    (category_id, step_no, question_key, question_text, input_type, required,
     option_value, option_label, option_hint, option_group, sort_order)
VALUES
((SELECT id FROM service_categories WHERE slug = 'waterproofing'), 30, 'wp_brand', 'Select your preferred brand', 'SINGLE', TRUE, 'dr-fixit', 'Dr. Fixit', 'Trusted waterproofing solutions with advanced technology and long-term durability.', NULL, 1),
((SELECT id FROM service_categories WHERE slug = 'waterproofing'), 30, 'wp_brand', 'Select your preferred brand', 'SINGLE', TRUE, 'asian-paints', 'Asian Paints', 'High-performance waterproofing systems with superior durability and UV resistance.', NULL, 2),
((SELECT id FROM service_categories WHERE slug = 'waterproofing'), 30, 'wp_brand', 'Select your preferred brand', 'SINGLE', TRUE, 'berger', 'Berger', 'Reliable waterproofing solutions with excellent adhesion, weather resistance and durability.', NULL, 3);

-- ===========================================================================
-- Terrace Waterproofing — wp_terrace_rates (Dr. Fixit only; see note 2)
-- ===========================================================================
INSERT INTO service_options
    (category_id, step_no, question_key, question_text, input_type, required,
     option_value, option_label, option_hint, option_group, sort_order)
VALUES
((SELECT id FROM service_categories WHERE slug = 'waterproofing'), 31, 'wp_terrace_rates', 'Terrace Waterproofing rates', 'SINGLE', FALSE, 'acrylic', 'Acrylic Waterproofing (Raincoat)', '₹70 – ₹90 / sq. ft.', 'Dr. Fixit', 1),
((SELECT id FROM service_categories WHERE slug = 'waterproofing'), 31, 'wp_terrace_rates', 'Terrace Waterproofing rates', 'SINGLE', FALSE, 'pu', 'PU Waterproofing (Newcoat)', '₹110 – ₹130 / sq. ft.', 'Dr. Fixit', 2),
((SELECT id FROM service_categories WHERE slug = 'waterproofing'), 31, 'wp_terrace_rates', 'Terrace Waterproofing rates', 'SINGLE', FALSE, 'cementitious', 'Cementitious Waterproofing (Pidicrete)', '₹90 – ₹110 / sq. ft.', 'Dr. Fixit', 3),
((SELECT id FROM service_categories WHERE slug = 'waterproofing'), 31, 'wp_terrace_rates', 'Terrace Waterproofing rates', 'SINGLE', FALSE, 'tile-area', 'Tile Area Waterproofing (Tile Guard)', '₹80 – ₹100 / sq. ft.', 'Dr. Fixit', 4),
((SELECT id FROM service_categories WHERE slug = 'waterproofing'), 31, 'wp_terrace_rates', 'Terrace Waterproofing rates', 'SINGLE', FALSE, 'crack-joint', 'Crack & Joint Treatment (Crack-X)', '₹60 – ₹90 / sq. ft.', 'Dr. Fixit', 5),
((SELECT id FROM service_categories WHERE slug = 'waterproofing'), 31, 'wp_terrace_rates', 'Terrace Waterproofing rates', 'SINGLE', FALSE, 'drainage', 'Drainage & Finishing', '₹50 – ₹80 / sq. ft.', 'Dr. Fixit', 6),

-- ===========================================================================
-- Exterior Wall Waterproofing — wp_exterior_rates (Dr. Fixit only)
-- ===========================================================================
((SELECT id FROM service_categories WHERE slug = 'waterproofing'), 32, 'wp_exterior_rates', 'Exterior Wall Waterproofing rates', 'SINGLE', FALSE, 'exterior-wall', 'Exterior Wall Waterproofing (Raincoat)', '₹70 – ₹90 / sq. ft.', 'Dr. Fixit', 1),
((SELECT id FROM service_categories WHERE slug = 'waterproofing'), 32, 'wp_exterior_rates', 'Exterior Wall Waterproofing rates', 'SINGLE', FALSE, 'crack-sealing', 'Crack Sealing (Crack-X)', '₹50 – ₹70 / sq. ft.', 'Dr. Fixit', 2),
((SELECT id FROM service_categories WHERE slug = 'waterproofing'), 32, 'wp_exterior_rates', 'Exterior Wall Waterproofing rates', 'SINGLE', FALSE, 'coating', 'Exterior Waterproof Coating (Weatherseal / Similar)', '₹80 – ₹110 / sq. ft.', 'Dr. Fixit', 3),
((SELECT id FROM service_categories WHERE slug = 'waterproofing'), 32, 'wp_exterior_rates', 'Exterior Wall Waterproofing rates', 'SINGLE', FALSE, 'exterior-paint', 'Exterior Paint (Optional) (Weathercoat)', '₹70 – ₹100 / sq. ft.', 'Dr. Fixit', 4),

-- ===========================================================================
-- Bathroom / Floor Waterproofing — wp_bathroom_floor_rates (Dr. Fixit only)
-- ===========================================================================
((SELECT id FROM service_categories WHERE slug = 'waterproofing'), 33, 'wp_bathroom_floor_rates', 'Floor Waterproofing rates', 'SINGLE', FALSE, 'floor', 'Bathroom Floor Waterproofing (Raincoat)', '₹70 – ₹90 / sq. ft.', 'Dr. Fixit', 1),
((SELECT id FROM service_categories WHERE slug = 'waterproofing'), 33, 'wp_bathroom_floor_rates', 'Floor Waterproofing rates', 'SINGLE', FALSE, 'corner-joint', 'Corner & Joint Sealing', '₹60 – ₹80 / sq. ft.', 'Dr. Fixit', 2),
((SELECT id FROM service_categories WHERE slug = 'waterproofing'), 33, 'wp_bathroom_floor_rates', 'Floor Waterproofing rates', 'SINGLE', FALSE, 'tile-resealing', 'Tile Re-sealing', '₹40 – ₹60 / sq. ft.', 'Dr. Fixit', 3),

-- ===========================================================================
-- Interior Wall Waterproofing — wp_interior_rates (Dr. Fixit only)
-- ===========================================================================
((SELECT id FROM service_categories WHERE slug = 'waterproofing'), 34, 'wp_interior_rates', 'Interior Wall Waterproofing rates', 'SINGLE', FALSE, 'dampness', 'Dampness Treatment (Dampguard)', '₹60 – ₹80 / sq. ft.', 'Dr. Fixit', 1),
((SELECT id FROM service_categories WHERE slug = 'waterproofing'), 34, 'wp_interior_rates', 'Interior Wall Waterproofing rates', 'SINGLE', FALSE, 'crack-sealing', 'Crack Sealing (Crack-X)', '₹50 – ₹70 / sq. ft.', 'Dr. Fixit', 2),
((SELECT id FROM service_categories WHERE slug = 'waterproofing'), 34, 'wp_interior_rates', 'Interior Wall Waterproofing rates', 'SINGLE', FALSE, 'coating', 'Waterproof Coating (Raincoat)', '₹70 – ₹90 / sq. ft.', 'Dr. Fixit', 3),
((SELECT id FROM service_categories WHERE slug = 'waterproofing'), 34, 'wp_interior_rates', 'Interior Wall Waterproofing rates', 'SINGLE', FALSE, 'mould-fungus', 'Mould & Fungus Treatment (Bio-Wash)', '₹40 – ₹60 / sq. ft.', 'Dr. Fixit', 4),
((SELECT id FROM service_categories WHERE slug = 'waterproofing'), 34, 'wp_interior_rates', 'Interior Wall Waterproofing rates', 'SINGLE', FALSE, 'surface-prep', 'Surface Preparation', '₹30 – ₹50 / sq. ft.', 'Dr. Fixit', 5),
((SELECT id FROM service_categories WHERE slug = 'waterproofing'), 34, 'wp_interior_rates', 'Interior Wall Waterproofing rates', 'SINGLE', FALSE, 'finishing-paint', 'Finishing & Paint (Optional) (Lukcoat)', '₹50 – ₹80 / sq. ft.', 'Dr. Fixit', 6),

-- ===========================================================================
-- Water Tank Waterproofing — wp_water_tank_rates (all 3 brands; overhead +
-- underground groups, per note 2 / the reference's own explicit table)
-- ===========================================================================
((SELECT id FROM service_categories WHERE slug = 'waterproofing'), 35, 'wp_water_tank_rates', 'Water Tank Waterproofing rates', 'SINGLE', FALSE, 'overhead-dr-fixit', 'Overhead Tank — Dr. Fixit (Pidicrete URP)', '₹70 – ₹90 / sq. ft.', 'Overhead Tank', 1),
((SELECT id FROM service_categories WHERE slug = 'waterproofing'), 35, 'wp_water_tank_rates', 'Water Tank Waterproofing rates', 'SINGLE', FALSE, 'overhead-asian-paints', 'Overhead Tank — Asian Paints (SmartCare)', '₹65 – ₹85 / sq. ft.', 'Overhead Tank', 2),
((SELECT id FROM service_categories WHERE slug = 'waterproofing'), 35, 'wp_water_tank_rates', 'Water Tank Waterproofing rates', 'SINGLE', FALSE, 'overhead-berger', 'Overhead Tank — Berger (HomeShield)', '₹60 – ₹80 / sq. ft.', 'Overhead Tank', 3),
((SELECT id FROM service_categories WHERE slug = 'waterproofing'), 35, 'wp_water_tank_rates', 'Water Tank Waterproofing rates', 'SINGLE', FALSE, 'underground-dr-fixit', 'Underground Sump — Dr. Fixit (Tanking System)', '₹90 – ₹120 / sq. ft.', 'Underground Sump', 1),
((SELECT id FROM service_categories WHERE slug = 'waterproofing'), 35, 'wp_water_tank_rates', 'Water Tank Waterproofing rates', 'SINGLE', FALSE, 'underground-asian-paints', 'Underground Sump — Asian Paints (SmartCare)', '₹85 – ₹110 / sq. ft.', 'Underground Sump', 2),
((SELECT id FROM service_categories WHERE slug = 'waterproofing'), 35, 'wp_water_tank_rates', 'Water Tank Waterproofing rates', 'SINGLE', FALSE, 'underground-berger', 'Underground Sump — Berger (BP Waterproof)', '₹80 – ₹100 / sq. ft.', 'Underground Sump', 3),

-- ===========================================================================
-- Basement Waterproofing — wp_basement_rates (Dr. Fixit only)
-- ===========================================================================
((SELECT id FROM service_categories WHERE slug = 'waterproofing'), 36, 'wp_basement_rates', 'Basement Waterproofing rates', 'SINGLE', FALSE, 'basement-wall', 'Basement Wall Waterproofing (Pidicrete)', '₹85 – ₹120 / sq. ft.', 'Dr. Fixit', 1),
((SELECT id FROM service_categories WHERE slug = 'waterproofing'), 36, 'wp_basement_rates', 'Basement Waterproofing rates', 'SINGLE', FALSE, 'basement-floor', 'Basement Floor Waterproofing (Newcoat)', '₹75 – ₹110 / sq. ft.', 'Dr. Fixit', 2),
((SELECT id FROM service_categories WHERE slug = 'waterproofing'), 36, 'wp_basement_rates', 'Basement Waterproofing rates', 'SINGLE', FALSE, 'crack-joint', 'Crack & Joint Treatment (Crack-X)', '₹60 – ₹90 / sq. ft.', 'Dr. Fixit', 3),
((SELECT id FROM service_categories WHERE slug = 'waterproofing'), 36, 'wp_basement_rates', 'Basement Waterproofing rates', 'SINGLE', FALSE, 'injection-grouting', 'Injection Grouting (Pidigrout)', '₹150 – ₹220 / sq. ft.', 'Dr. Fixit', 4),
((SELECT id FROM service_categories WHERE slug = 'waterproofing'), 36, 'wp_basement_rates', 'Basement Waterproofing rates', 'SINGLE', FALSE, 'drainage-system', 'Drainage System (as per requirement)', '₹200 – ₹400 / sq. ft.', 'Dr. Fixit', 5);
