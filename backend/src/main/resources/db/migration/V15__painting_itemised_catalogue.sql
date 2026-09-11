-- ---------------------------------------------------------------------------
-- PAINTING SERVICES — three itemised booking journeys, matching the approved
-- reference (SupplyBase_Painting_Services.pdf): Full Home Painting, Few Walls
-- Painting and Renovation Painting.
--
-- Same modelling choice as V14 (plumbing): no new tables. service_options
-- already carries price_paise (added in V10 for the electrician add-ons) —
-- this migration only adds new question_key values under the existing
-- 'painting' category, scoped so the old generic wizard's questions
-- (service_needed/property_type/wall_condition/work_required/area_sqft/
-- files) are deactivated but not deleted, preserving every historical
-- booking and answer that referenced them.
--
-- FLOW → question_key map (each flow's keys are its own, even where two
-- flows conceptually ask "painting type", because the PRICES differ between
-- flows for the same nominal choice — see the pricing-conflict notes below):
--
--   Full Home Painting:  home_type, full_home_painting_type, paint_brand,
--                        full_home_product, full_home_colour, full_home_addon
--   Few Walls Painting:  few_walls_area, few_walls_painting_type, paint_brand,
--                        few_walls_product, few_walls_colour, few_walls_addon
--   Renovation Painting: renovation_area, renovation_repair, paint_brand,
--                        renovation_product, renovation_wall_colour,
--                        renovation_ceiling_colour, renovation_addon
--
-- paint_brand is shared across all three flows (Asian Paints / Berger —
-- brand choice itself carries no price in the reference, so one question
-- serves everyone). Colour and area/type questions similarly carry no
-- per-option price unless the reference shows one.
--
-- Colour swatches store their preview colour in option_hint as a bare hex
-- value (e.g. '#F5F0E8') — approximate, screen-sampled previews, not
-- official manufacturer shade codes (the reference is a set of screenshots,
-- not a colour catalogue). option_group carries the swatch's tab (Popular /
-- Neutrals / Brights / Pastels for Full Home & Few Walls; Popular / Neutrals
-- / Warm / Cool / Pastels for Renovation, matching the reference exactly —
-- the tab sets are NOT the same between the two).
--
-- =============================================================================
-- PRICING CONFLICTS AND GAPS — flagged per the user's request, NOT silently
-- resolved. Every one of these is implemented so it is visibly correct given
-- what data exists, never a guessed number:
--
--  1. VISIT FEE: the reference shows a flat ₹99 visit fee for Full Home and
--     Few Walls, adjustable into the final bill. This category's EXISTING
--     visit_fee_paise (set when 'painting' was created in V5/V13) is ₹25 —
--     the site's live painting hero banner ("Site Visit & Quotation Fee ₹25
--     Only") already advertises this rate. This migration does NOT change
--     visit_fee_paise — the booking flow will keep showing and charging the
--     category's existing ₹25 until this is confirmed. Update the row below
--     if ₹99 is correct:
--       UPDATE service_categories SET visit_fee_paise = 9900 WHERE slug = 'painting';
--
--  2. FULL HOME — Economy and Luxury product tabs: only the Premium tab's
--     four products (Apcolite Premium/Advanced, Royale Luxury/Aspira) have
--     legible prices in the reference. No Economy or Luxury tier product
--     list is shown anywhere for Full Home specifically. Not invented here —
--     the Economy/Luxury tabs exist in the UI but render an honest
--     "ask us for a quote" state instead of fabricated products.
--
--  3. FEW WALLS — Premium and Luxury product tabs: same gap as above, mirror
--     image — only the Economy tab (Tractor Emulsion/Sparc/Shyne) has
--     legible prices for Few Walls.
--
--  4. BERGER: selectable as a brand (the hero banner explicitly names
--     "Asian Paints & Berger" as the two premium brands), but the reference
--     never shows a single Berger product name or price in any of the three
--     flows — every transcribed product row below is Asian Paints only. The
--     product step shows an honest "our team will help you choose during
--     your free consultation" state when Berger is selected, rather than
--     invented SKUs.
--
--  5. RENOVATION — product/brand step: the reference's own screen numbering
--     skips a step between "5. Repair & Preparation" and "7. Choose Colours"
--     (no "6. Choose Brand & Product" screenshot exists), but the flow's own
--     summary screen shows "Paint Brand: Asian Paints, Product: Apex" —
--     proving the step exists in the real product, just wasn't captured.
--     "Apex" is a real Asian Paints exterior-emulsion line, but no price for
--     it appears anywhere in the reference (the summary's own example total,
--     ₹18,499, does not even arithmetically match its own listed repair +
--     add-on selections, confirming it's illustrative placeholder text, not
--     a derivable formula). renovation_product below is therefore UNPRICED
--     (price_paise NULL) — product choice is recorded but does not add to
--     the estimate. If a real "Apex"/renovation product price is confirmed,
--     add it as a normal priced option here.
--
--  6. RENOVATION — visit fee / payment step: no ₹99 fee, black pricing strip
--     or payment screen appears anywhere in the Renovation flow's 12
--     screenshots (Full Home and Few Walls both show one). Per the brief,
--     the EXISTING category policy is preserved rather than assumed away —
--     Renovation bookings get the same category-level visit_fee_paise as
--     every other painting booking (see gap #1), not zero and not a
--     silently-invented different rule.
--
--  7. Do NOT read plumbing's ₹5,000 actual-pricing-vs-₹99-flat-fee threshold
--     into painting — nothing in this reference or the existing painting
--     policy establishes that rule for painting. BookingService's threshold
--     logic stays scoped to the 'plumbing' category slug only (see that
--     file); painting's visitFeePaise is never threshold-overridden by its
--     itemsTotalPaise the way plumbing's is.
-- =============================================================================

-- Deactivate the old generic wizard's questions for 'painting' — same
-- soft-deactivation approach as V14, so every historical booking's answers
-- remain intact and queryable.
UPDATE service_options
SET active = FALSE
WHERE category_id = (SELECT id FROM service_categories WHERE slug = 'painting')
  AND question_key IN ('service_needed', 'property_type', 'wall_condition', 'work_required',
                        'area_sqft', 'area_unknown', 'files');

UPDATE service_categories
SET tagline = 'Certified painters. Premium brands. Transparent pricing.',
    description = 'Full home painting, few-walls refresh and renovation painting — itemised pricing, Asian Paints & Berger product ranges, and doorstep booking.'
WHERE slug = 'painting';

-- ------------------------------------------------------------ shared: brand
INSERT INTO service_options (category_id, step_no, question_key, question_text, input_type, required,
     option_value, option_label, option_hint, option_group, price_paise, sort_order, active)
SELECT id, 1, 'paint_brand', 'Choose your paint brand', 'SINGLE', TRUE, v.option_value, v.option_label, v.option_hint, NULL, NULL, v.sort_order, TRUE
FROM service_categories,
    (SELECT 'asian-paints' AS option_value, 'Asian Paints' AS option_label, 'Wide range of colours, long lasting finish, trusted brand, low odour options, stain resistant — perfect for Indian homes.' AS option_hint, 1 AS sort_order
     UNION ALL
     SELECT 'berger', 'Berger', 'Paint your imagination — since 1760.', 2
    ) AS v
WHERE slug = 'painting';

-- ================================================================== FULL HOME

INSERT INTO service_options (category_id, step_no, question_key, question_text, input_type, required,
     option_value, option_label, option_hint, option_group, price_paise, sort_order, active)
SELECT id, 1, 'home_type', 'Choose your home type', 'SINGLE', TRUE, v.option_value, v.option_label, v.option_hint, NULL, v.price_paise, v.sort_order, TRUE
FROM service_categories,
    (SELECT '1bhk' AS option_value, '1 BHK' AS option_label, NULL AS option_hint, 2499900 AS price_paise, 1 AS sort_order
     UNION ALL SELECT '2bhk', '2 BHK', NULL, 3499900, 2
     UNION ALL SELECT '3bhk', '3 BHK', NULL, 4499900, 3
     UNION ALL SELECT '4bhk-villa', '4 BHK / Villa', NULL, 5999900, 4
     UNION ALL SELECT 'independent-house', 'Independent House', 'Custom quote — our team will assess and price this on site visit.', NULL, 5
    ) AS v
WHERE slug = 'painting';

INSERT INTO service_options (category_id, step_no, question_key, question_text, input_type, required,
     option_value, option_label, option_hint, option_group, price_paise, sort_order, active)
SELECT id, 2, 'full_home_painting_type', 'Choose painting type', 'SINGLE', TRUE, v.option_value, v.option_label, v.option_hint, NULL, v.price_paise, v.sort_order, TRUE
FROM service_categories,
    (SELECT 'standard-repaint' AS option_value, 'Standard Repaint' AS option_label, 'For walls in good condition.' AS option_hint, 2499900 AS price_paise, 1 AS sort_order
     UNION ALL SELECT 'complete-repaint', 'Complete Repaint', 'For a smooth & long-lasting finish.', 3499900, 2
     UNION ALL SELECT 'renovation-painting', 'Renovation Painting', 'For old / damaged walls.', 4499900, 3
    ) AS v
WHERE slug = 'painting';

-- Premium tier only — see gap #2 above. Prices are per Full Home project,
-- not a per-litre paint price.
INSERT INTO service_options (category_id, step_no, question_key, question_text, input_type, required,
     option_value, option_label, option_hint, option_group, price_paise, sort_order, active)
SELECT id, 3, 'full_home_product', 'Select product range', 'SINGLE', TRUE, v.option_value, v.option_label, v.option_hint, v.option_group, v.price_paise, v.sort_order, TRUE
FROM service_categories,
    (SELECT 'apcolite-premium' AS option_value, 'Apcolite Premium' AS option_label, 'Washable and long-lasting.' AS option_hint, 'Premium' AS option_group, 3499900 AS price_paise, 1 AS sort_order
     UNION ALL SELECT 'apcolite-advanced', 'Apcolite Advanced', 'Stain resistant and durable.', 'Premium', 3899900, 2
     UNION ALL SELECT 'royale-luxury', 'Royale Luxury', 'Rich finish with superior coverage.', 'Premium', 4499900, 3
     UNION ALL SELECT 'royale-aspira', 'Royale Aspira', 'Our most premium range.', 'Premium', 5499900, 4
    ) AS v
WHERE slug = 'painting';

INSERT INTO service_options (category_id, step_no, question_key, question_text, input_type, required,
     option_value, option_label, option_hint, option_group, price_paise, sort_order, active)
SELECT id, 4, 'full_home_colour', 'Choose your colours', 'SINGLE', FALSE, v.option_value, v.option_label, v.hex, v.tab, NULL, v.sort_order, TRUE
FROM service_categories,
    (SELECT 'white-whisper' AS option_value, 'White Whisper' AS option_label, '#F5F1EA' AS hex, 'Popular' AS tab, 1 AS sort_order
     UNION ALL SELECT 'ivory-cream', 'Ivory Cream', '#F0E6CE', 'Popular', 2
     UNION ALL SELECT 'beige-mist', 'Beige Mist', '#DFD3BE', 'Popular', 3
     UNION ALL SELECT 'sand-dune', 'Sand Dune', '#C8B393', 'Popular', 4
     UNION ALL SELECT 'grey-stone', 'Grey Stone', '#9C9B96', 'Neutrals', 5
     UNION ALL SELECT 'sage-green', 'Sage Green', '#9CAF88', 'Neutrals', 6
     UNION ALL SELECT 'sky-blue', 'Sky Blue', '#A9CCE3', 'Neutrals', 7
     UNION ALL SELECT 'mint-fresh', 'Mint Fresh', '#B8E0D2', 'Neutrals', 8
     UNION ALL SELECT 'blush-pink', 'Blush Pink', '#EFC9C9', 'Brights', 9
     UNION ALL SELECT 'lavender', 'Lavender', '#D4C2E0', 'Brights', 10
     UNION ALL SELECT 'peach', 'Peach', '#F1B99B', 'Brights', 11
     UNION ALL SELECT 'terracotta', 'Terracotta', '#B8583F', 'Brights', 12
    ) AS v
WHERE slug = 'painting';

-- Full Home add-on prices (distinct from Few Walls' — see gap notes: the
-- reference shows different amounts per flow for the same add-on name).
INSERT INTO service_options (category_id, step_no, question_key, question_text, input_type, required,
     option_value, option_label, option_hint, option_group, price_paise, sort_order, active)
SELECT id, 5, 'full_home_addon', 'Add-on services (optional)', 'MULTI', FALSE, v.option_value, v.option_label, NULL, NULL, v.price_paise, v.sort_order, TRUE
FROM service_categories,
    (SELECT 'ceiling-painting' AS option_value, 'Ceiling Painting' AS option_label, 299900 AS price_paise, 1 AS sort_order
     UNION ALL SELECT 'doors-windows-painting', 'Doors & Windows Painting', 499900, 2
     UNION ALL SELECT 'grill-painting', 'Grill Painting', 299900, 3
     UNION ALL SELECT 'waterproofing-treatment', 'Waterproofing Treatment', 799900, 4
     UNION ALL SELECT 'texture-feature-wall', 'Texture / Feature Wall', 499900, 5
     UNION ALL SELECT 'deep-cleaning', 'Deep Cleaning', 299900, 6
    ) AS v
WHERE slug = 'painting';

-- ================================================================ FEW WALLS

-- No prices shown for area choice in the reference — informational only.
INSERT INTO service_options (category_id, step_no, question_key, question_text, input_type, required,
     option_value, option_label, option_hint, option_group, price_paise, sort_order, active)
SELECT id, 1, 'few_walls_area', 'Which area do you want to paint?', 'SINGLE', TRUE, v.option_value, v.option_label, NULL, NULL, NULL, v.sort_order, TRUE
FROM service_categories,
    (SELECT 'living-room-walls' AS option_value, 'Living Room Walls' AS option_label, 1 AS sort_order
     UNION ALL SELECT 'bedroom-walls', 'Bedroom Walls', 2
     UNION ALL SELECT 'tv-wall', 'TV Wall', 3
     UNION ALL SELECT 'dining-area', 'Dining Area', 4
     UNION ALL SELECT 'kitchen-walls', 'Kitchen Walls', 5
     UNION ALL SELECT 'kids-room', 'Kids Room', 6
     UNION ALL SELECT 'study-home-office', 'Study / Home Office', 7
     UNION ALL SELECT 'other-area', 'Other Area', 8
    ) AS v
WHERE slug = 'painting';

INSERT INTO service_options (category_id, step_no, question_key, question_text, input_type, required,
     option_value, option_label, option_hint, option_group, price_paise, sort_order, active)
SELECT id, 2, 'few_walls_painting_type', 'Choose painting type', 'SINGLE', TRUE, v.option_value, v.option_label, v.option_hint, NULL, v.price_paise, v.sort_order, TRUE
FROM service_categories,
    (SELECT 'standard-repaint' AS option_value, 'Standard Repaint' AS option_label, 'For walls in good condition.' AS option_hint, 499900 AS price_paise, 1 AS sort_order
     UNION ALL SELECT 'complete-repaint', 'Complete Repaint', 'For a smooth & long-lasting finish.', 699900, 2
     UNION ALL SELECT 'renovation-painting', 'Renovation Painting', 'For old / damaged walls.', 999900, 3
    ) AS v
WHERE slug = 'painting';

-- Economy tier only — see gap #3 above.
INSERT INTO service_options (category_id, step_no, question_key, question_text, input_type, required,
     option_value, option_label, option_hint, option_group, price_paise, sort_order, active)
SELECT id, 3, 'few_walls_product', 'Select product range', 'SINGLE', TRUE, v.option_value, v.option_label, v.option_hint, v.option_group, v.price_paise, v.sort_order, TRUE
FROM service_categories,
    (SELECT 'tractor-emulsion' AS option_value, 'Tractor Emulsion' AS option_label, 'Good quality, value for money.' AS option_hint, 'Economy' AS option_group, 499900 AS price_paise, 1 AS sort_order
     UNION ALL SELECT 'tractor-sparc', 'Tractor Sparc', 'Better coverage and smooth finish.', 'Economy', 599900, 2
     UNION ALL SELECT 'tractor-shyne', 'Tractor Shyne', 'Vibrant colours with good durability.', 'Economy', 699900, 3
    ) AS v
WHERE slug = 'painting';

INSERT INTO service_options (category_id, step_no, question_key, question_text, input_type, required,
     option_value, option_label, option_hint, option_group, price_paise, sort_order, active)
SELECT id, 4, 'few_walls_colour', 'Choose your colours', 'SINGLE', FALSE, v.option_value, v.option_label, v.hex, v.tab, NULL, v.sort_order, TRUE
FROM service_categories,
    (SELECT 'white-whisper' AS option_value, 'White Whisper' AS option_label, '#F5F1EA' AS hex, 'Popular' AS tab, 1 AS sort_order
     UNION ALL SELECT 'ivory-cream', 'Ivory Cream', '#F0E6CE', 'Popular', 2
     UNION ALL SELECT 'beige-mist', 'Beige Mist', '#DFD3BE', 'Popular', 3
     UNION ALL SELECT 'sand-dune', 'Sand Dune', '#C8B393', 'Popular', 4
     UNION ALL SELECT 'grey-stone', 'Grey Stone', '#9C9B96', 'Neutrals', 5
     UNION ALL SELECT 'sage-green', 'Sage Green', '#9CAF88', 'Neutrals', 6
     UNION ALL SELECT 'sky-blue', 'Sky Blue', '#A9CCE3', 'Neutrals', 7
     UNION ALL SELECT 'mint-fresh', 'Mint Fresh', '#B8E0D2', 'Neutrals', 8
     UNION ALL SELECT 'blush-pink', 'Blush Pink', '#EFC9C9', 'Brights', 9
     UNION ALL SELECT 'lavender', 'Lavender', '#D4C2E0', 'Brights', 10
     UNION ALL SELECT 'peach', 'Peach', '#F1B99B', 'Brights', 11
     UNION ALL SELECT 'terracotta', 'Terracotta', '#B8583F', 'Brights', 12
    ) AS v
WHERE slug = 'painting';

-- Few Walls add-on prices (distinct from Full Home's — includes Furniture
-- Shifting, does not include Grill Painting, per the reference).
INSERT INTO service_options (category_id, step_no, question_key, question_text, input_type, required,
     option_value, option_label, option_hint, option_group, price_paise, sort_order, active)
SELECT id, 5, 'few_walls_addon', 'Add-on services (optional)', 'MULTI', FALSE, v.option_value, v.option_label, NULL, NULL, v.price_paise, v.sort_order, TRUE
FROM service_categories,
    (SELECT 'ceiling-painting' AS option_value, 'Ceiling Painting' AS option_label, 199900 AS price_paise, 1 AS sort_order
     UNION ALL SELECT 'doors-windows-painting', 'Doors & Windows Painting', 299900, 2
     UNION ALL SELECT 'texture-feature-wall', 'Texture / Feature Wall', 499900, 3
     UNION ALL SELECT 'waterproofing-treatment', 'Waterproofing Treatment', 399900, 4
     UNION ALL SELECT 'deep-cleaning', 'Deep Cleaning', 199900, 5
     UNION ALL SELECT 'furniture-shifting', 'Furniture Shifting', 99900, 6
    ) AS v
WHERE slug = 'painting';

-- =============================================================== RENOVATION

INSERT INTO service_options (category_id, step_no, question_key, question_text, input_type, required,
     option_value, option_label, option_hint, option_group, price_paise, sort_order, active)
SELECT id, 1, 'renovation_area', 'Where do you need renovation painting?', 'SINGLE', TRUE, v.option_value, v.option_label, v.option_hint, NULL, NULL, v.sort_order, TRUE
FROM service_categories,
    (SELECT 'full-home' AS option_value, 'Full Home' AS option_label, 'All rooms, walls & ceilings.' AS option_hint, 1 AS sort_order
     UNION ALL SELECT 'few-walls', 'Few Walls', 'Select specific walls.', 2
     UNION ALL SELECT 'single-room', 'Single Room', 'Bedroom, Living Room, etc.', 3
     UNION ALL SELECT 'ceiling', 'Ceiling', 'Ceiling renovation & painting.', 4
     UNION ALL SELECT 'exterior-walls', 'Exterior Walls', 'Outer walls / balcony.', 5
     UNION ALL SELECT 'staircase-common-area', 'Staircase / Common Area', 'Passage, staircase, lobby.', 6
    ) AS v
WHERE slug = 'painting';

INSERT INTO service_options (category_id, step_no, question_key, question_text, input_type, required,
     option_value, option_label, option_hint, option_group, price_paise, sort_order, active)
SELECT id, 2, 'renovation_repair', 'Select repair & preparation work', 'MULTI', TRUE, v.option_value, v.option_label, v.option_hint, NULL, v.price_paise, v.sort_order, TRUE
FROM service_categories,
    (SELECT 'crack-filling' AS option_value, 'Crack Filling' AS option_label, 'Fill hairline and major cracks.' AS option_hint, 199900 AS price_paise, 1 AS sort_order
     UNION ALL SELECT 'peeling-paint-removal', 'Peeling Paint Removal', 'Remove loose & old paint.', 249900, 2
     UNION ALL SELECT 'damp-treatment', 'Damp Treatment', 'Anti-fungal treatment for damp walls.', 299900, 3
     UNION ALL SELECT 'wall-putty', 'Wall Putty (1 Coat)', 'Smooth surface preparation.', 199900, 4
     UNION ALL SELECT 'lambi', 'Lambi (1 Coat)', 'For better adhesion & finish.', 149900, 5
     UNION ALL SELECT 'primer', 'Primer (1 Coat)', 'Seals surface, longer life.', 199900, 6
    ) AS v
WHERE slug = 'painting';

-- UNPRICED by design — see gap #5. "Apex" (Asian Paints exterior emulsion)
-- has no legible price anywhere in the reference.
INSERT INTO service_options (category_id, step_no, question_key, question_text, input_type, required,
     option_value, option_label, option_hint, option_group, price_paise, sort_order, active)
SELECT id, 3, 'renovation_product', 'Select paint / finish', 'SINGLE', TRUE, v.option_value, v.option_label, v.option_hint, NULL, NULL, v.sort_order, TRUE
FROM service_categories,
    (SELECT 'apex' AS option_value, 'Apex' AS option_label, 'Weatherproof exterior emulsion — price confirmed during your home visit.' AS option_hint, 1 AS sort_order
    ) AS v
WHERE slug = 'painting';

-- Renovation's own colour tabs differ from Full Home/Few Walls (Warm/Cool
-- instead of Brights), per the reference — and it has two independent
-- pickers, wall and ceiling.
INSERT INTO service_options (category_id, step_no, question_key, question_text, input_type, required,
     option_value, option_label, option_hint, option_group, price_paise, sort_order, active)
SELECT id, 4, 'renovation_wall_colour', 'Choose your wall colour', 'SINGLE', FALSE, v.option_value, v.option_label, v.hex, v.tab, NULL, v.sort_order, TRUE
FROM service_categories,
    (SELECT 'white-classic' AS option_value, 'White Classic' AS option_label, '#F7F5F0' AS hex, 'Popular' AS tab, 1 AS sort_order
     UNION ALL SELECT 'ivory-elegant', 'Ivory Elegant', '#EFE4C8', 'Popular', 2
     UNION ALL SELECT 'beige-calm', 'Beige Calm', '#DCCFB0', 'Popular', 3
     UNION ALL SELECT 'grey-modern', 'Grey Modern', '#ABAEB2', 'Popular', 4
     UNION ALL SELECT 'sage-green-trendy', 'Sage Green', '#93A88A', 'Warm', 5
     UNION ALL SELECT 'sky-blue-fresh', 'Sky Blue', '#9FC6DE', 'Cool', 6
     UNION ALL SELECT 'blush-pink-soft', 'Blush Pink', '#E9C4C4', 'Warm', 7
     UNION ALL SELECT 'taupe-premium', 'Taupe', '#8C7B6B', 'Neutrals', 8
    ) AS v
WHERE slug = 'painting';

INSERT INTO service_options (category_id, step_no, question_key, question_text, input_type, required,
     option_value, option_label, option_hint, option_group, price_paise, sort_order, active)
SELECT id, 4, 'renovation_ceiling_colour', 'Choose your ceiling colour', 'SINGLE', FALSE, v.option_value, v.option_label, v.hex, v.tab, NULL, v.sort_order, TRUE
FROM service_categories,
    (SELECT 'white-classic' AS option_value, 'White Classic' AS option_label, '#F7F5F0' AS hex, 'Popular' AS tab, 1 AS sort_order
     UNION ALL SELECT 'ivory-elegant', 'Ivory Elegant', '#EFE4C8', 'Popular', 2
     UNION ALL SELECT 'beige-calm', 'Beige Calm', '#DCCFB0', 'Popular', 3
     UNION ALL SELECT 'grey-modern', 'Grey Modern', '#ABAEB2', 'Popular', 4
    ) AS v
WHERE slug = 'painting';

INSERT INTO service_options (category_id, step_no, question_key, question_text, input_type, required,
     option_value, option_label, option_hint, option_group, price_paise, sort_order, active)
SELECT id, 5, 'renovation_addon', 'Add-on services (optional)', 'MULTI', FALSE, v.option_value, v.option_label, NULL, NULL, v.price_paise, v.sort_order, TRUE
FROM service_categories,
    (SELECT 'texture-feature-wall' AS option_value, 'Texture / Feature Wall' AS option_label, 499900 AS price_paise, 1 AS sort_order
     UNION ALL SELECT 'waterproofing-treatment', 'Waterproofing Treatment', 399900, 2
     UNION ALL SELECT 'anti-fungal-coating', 'Anti-Fungal Coating', 249900, 3
     UNION ALL SELECT 'wall-stencil-design', 'Wall Stencil / Design', 299900, 4
     UNION ALL SELECT 'wood-metal-painting', 'Wood / Metal Painting', 199900, 5
    ) AS v
WHERE slug = 'painting';
