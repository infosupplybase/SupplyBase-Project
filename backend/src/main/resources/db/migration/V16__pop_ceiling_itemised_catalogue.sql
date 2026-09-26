-- ---------------------------------------------------------------------------
-- POP CEILING & DESIGN — dedicated Full Home POP and Room POP journeys
--
-- Same modelling approach as V14 (plumbing) and V15 (painting): new,
-- flow-prefixed question_key rows on the existing category, read directly by
-- a dedicated frontend flow rather than the generic wizard. Nothing here
-- touches booking_id/option ids already referenced by historical bookings.
--
-- UNLIKE Painting/Plumbing, this category is only PARTLY rebuilt. The
-- reference (SupplyBase_POP_Gypsum_Services.pdf) fully specifies two
-- journeys — Full Home POP and Room POP — and shows four more subservice
-- names (False Ceiling, POP Design Work, POP TV Wall, POP Repair &
-- Renovation) as plain list rows with no detail screens at all. Per the
-- brief, those four keep using the EXISTING generic site-visit wizard
-- (ServiceBooking.jsx, still fully active, question set unchanged below)
-- rather than inventing packages/prices the reference never shows. Two of
-- the four concepts have no matching option in the existing `service_needed`
-- question at all, so this migration adds them there (additive, same shape
-- as the other seven) so the category page can deep-link into the generic
-- wizard with the right one preselected.
--
-- Decisions flagged for confirmation, not silently finalised:
--
-- 1. NO PRICED ADD-ONS. The reference's seven add-ons are all quoted as a
--    RATE PER SQ. FT. (e.g. "POP Cornice — ₹25 / sq. ft."), never a flat
--    price, and the reference provides no measured ceiling area and no
--    formula for turning a selected home/room type into one. Multiplying by
--    a home type's *maximum* sqft (its own catalogue description, e.g. "Up
--    to 1,000 sq. ft.") would systematically overstate the estimate, which
--    the brief explicitly warns against. So `price_paise` is left NULL on
--    every add-on below — the rate is stored as display text only, in
--    option_hint — and neither flow computes or shows a numeric total.
--    BookingService.java needs NO changes: without an entry in a
--    category-specific priced-keys set, these answers are saved but never
--    summed, so itemsTotalPaise stays null and the booking simply shows the
--    category's existing flat visit fee — exactly the "quotation after site
--    visit" behaviour the reference itself describes ("final price depends
--    on actual site measurements and design complexity").
--
-- 2. VISIT FEE LEFT UNCHANGED. This category's visit_fee_paise has been
--    2500 (₹25) since V8 and is not touched here. Unlike Painting's
--    reference (which showed a competing ₹99 fee), this POP reference shows
--    NO fee or payment screen anywhere in either flow, so there is no
--    conflicting number to flag — the existing ₹25 policy is simply
--    preserved, per the brief's own instruction not to import Painting's or
--    Plumbing's fee rules into a category that never specified one.
--
-- 3. SHARED add-on catalogue. Both flows show the identical seven add-ons at
--    the identical rates (unlike Painting, where per-flow prices genuinely
--    differed) — one `pop_addon` question_key is used by both Full Home and
--    Room POP rather than duplicating seven rows twice.
--
-- 4. Design-style OPTION LABELS are kept flow-specific (`pop_home_design_
--    style` vs `pop_room_design_style`) because the reference itself uses
--    different wording for the "simple" tier between the two flows ("Simple
--    & Elegant" on Full Home vs "Simple" on Room POP) and Room POP adds an
--    eighth option, Custom Design, that Full Home never shows.
--
-- 5. The reference's "1 year service support" and "Genuine Gyproc/Saint-
--    Gobain" materials line are marketing claims, not something this
--    migration or the frontend copy asserts as a contractual promise — see
--    the delivery report for this task.
-- ---------------------------------------------------------------------------

UPDATE service_categories
SET tagline = 'Elegant ceilings. Beautiful spaces. Expert installation.',
    description = 'Designer false ceilings, POP and gypsum work — cove lighting, cornice, wall panelling and POP TV walls, with doorstep measurement and quotation.'
WHERE slug = 'pop-ceiling-design';

-- Additive: two subservice names the reference names but the existing
-- generic wizard's `service_needed` question has no option for yet. Same
-- shape as the other seven (unpriced, this question is never in a
-- priced-keys set for any category).
INSERT INTO service_options
    (category_id, step_no, question_key, question_text, input_type, required,
     option_value, option_label, option_hint, option_group, sort_order)
VALUES
((SELECT id FROM service_categories WHERE slug = 'pop-ceiling-design'), 1, 'service_needed', 'What ceiling service do you need?', 'MULTI', TRUE, 'POP TV Wall', 'POP TV Wall', NULL, NULL, 10),
((SELECT id FROM service_categories WHERE slug = 'pop-ceiling-design'), 1, 'service_needed', 'What ceiling service do you need?', 'MULTI', TRUE, 'POP Repair & Renovation', 'POP Repair & Renovation', NULL, NULL, 11);

-- ===========================================================================
-- Full Home POP — pop_home_*
-- ===========================================================================
INSERT INTO service_options
    (category_id, step_no, question_key, question_text, input_type, required,
     option_value, option_label, option_hint, option_group, sort_order)
VALUES
((SELECT id FROM service_categories WHERE slug = 'pop-ceiling-design'), 10, 'pop_home_type', 'Select your home type', 'SINGLE', TRUE, '1bhk', '1 BHK', 'Up to 500 sq. ft.', NULL, 1),
((SELECT id FROM service_categories WHERE slug = 'pop-ceiling-design'), 10, 'pop_home_type', 'Select your home type', 'SINGLE', TRUE, '2bhk', '2 BHK', 'Up to 1,000 sq. ft.', NULL, 2),
((SELECT id FROM service_categories WHERE slug = 'pop-ceiling-design'), 10, 'pop_home_type', 'Select your home type', 'SINGLE', TRUE, '3bhk', '3 BHK', 'Up to 1,500 sq. ft.', NULL, 3),
((SELECT id FROM service_categories WHERE slug = 'pop-ceiling-design'), 10, 'pop_home_type', 'Select your home type', 'SINGLE', TRUE, '4bhk', '4 BHK', 'Up to 2,000 sq. ft.', NULL, 4),
((SELECT id FROM service_categories WHERE slug = 'pop-ceiling-design'), 10, 'pop_home_type', 'Select your home type', 'SINGLE', TRUE, 'villa-independent-house', 'Villa / Independent House', 'Above 2,000 sq. ft.', NULL, 5),
((SELECT id FROM service_categories WHERE slug = 'pop-ceiling-design'), 10, 'pop_home_type', 'Select your home type', 'SINGLE', TRUE, 'duplex', 'Duplex', 'Multi-level home', NULL, 6),

((SELECT id FROM service_categories WHERE slug = 'pop-ceiling-design'), 11, 'pop_home_design_style', 'Choose design style', 'SINGLE', TRUE, 'simple-elegant', 'Simple & Elegant', 'Clean and minimal', NULL, 1),
((SELECT id FROM service_categories WHERE slug = 'pop-ceiling-design'), 11, 'pop_home_design_style', 'Choose design style', 'SINGLE', TRUE, 'modern', 'Modern', 'Contemporary look', NULL, 2),
((SELECT id FROM service_categories WHERE slug = 'pop-ceiling-design'), 11, 'pop_home_design_style', 'Choose design style', 'SINGLE', TRUE, 'classic', 'Classic', 'Timeless design', NULL, 3),
((SELECT id FROM service_categories WHERE slug = 'pop-ceiling-design'), 11, 'pop_home_design_style', 'Choose design style', 'SINGLE', TRUE, 'luxury', 'Luxury', 'Premium finish', NULL, 4),
((SELECT id FROM service_categories WHERE slug = 'pop-ceiling-design'), 11, 'pop_home_design_style', 'Choose design style', 'SINGLE', TRUE, 'cove-ceiling', 'Cove Ceiling', 'Smooth curved design', NULL, 5),
((SELECT id FROM service_categories WHERE slug = 'pop-ceiling-design'), 11, 'pop_home_design_style', 'Choose design style', 'SINGLE', TRUE, 'tray-ceiling', 'Tray Ceiling', 'Stylish layered look', NULL, 6),
((SELECT id FROM service_categories WHERE slug = 'pop-ceiling-design'), 11, 'pop_home_design_style', 'Choose design style', 'SINGLE', TRUE, 'border-ceiling', 'Border Ceiling', 'Neat and classic', NULL, 7),

-- ===========================================================================
-- Room POP — pop_room_*
-- ===========================================================================
((SELECT id FROM service_categories WHERE slug = 'pop-ceiling-design'), 20, 'pop_room_type', 'Which room do you need POP for?', 'SINGLE', TRUE, 'living-room', 'Living Room', 'Elegant & modern', NULL, 1),
((SELECT id FROM service_categories WHERE slug = 'pop-ceiling-design'), 20, 'pop_room_type', 'Which room do you need POP for?', 'SINGLE', TRUE, 'bedroom', 'Bedroom', 'Comfortable & cozy', NULL, 2),
((SELECT id FROM service_categories WHERE slug = 'pop-ceiling-design'), 20, 'pop_room_type', 'Which room do you need POP for?', 'SINGLE', TRUE, 'dining-room', 'Dining Room', 'Classy & functional', NULL, 3),
((SELECT id FROM service_categories WHERE slug = 'pop-ceiling-design'), 20, 'pop_room_type', 'Which room do you need POP for?', 'SINGLE', TRUE, 'kitchen', 'Kitchen', 'Clean & durable', NULL, 4),
((SELECT id FROM service_categories WHERE slug = 'pop-ceiling-design'), 20, 'pop_room_type', 'Which room do you need POP for?', 'SINGLE', TRUE, 'study-room', 'Study Room', 'Simple & stylish', NULL, 5),
((SELECT id FROM service_categories WHERE slug = 'pop-ceiling-design'), 20, 'pop_room_type', 'Which room do you need POP for?', 'SINGLE', TRUE, 'kids-room', 'Kids Room', 'Fun & creative', NULL, 6),
((SELECT id FROM service_categories WHERE slug = 'pop-ceiling-design'), 20, 'pop_room_type', 'Which room do you need POP for?', 'SINGLE', TRUE, 'other-room', 'Other Room', 'Pooja room, guest room, etc.', NULL, 7),
-- Free-text follow-ups, shown only when their triggering option is chosen
-- (Other Room / Custom Design — see PopCeilingFlow.jsx). Same TEXT shape as
-- the generic wizard's own 'notes' question; every submitted answer key
-- must match a real question on the category, so these exist even though
-- neither has a fixed option list.
((SELECT id FROM service_categories WHERE slug = 'pop-ceiling-design'), 20, 'pop_room_notes', 'Describe the room', 'TEXT', FALSE, NULL, NULL, NULL, NULL, 1),

((SELECT id FROM service_categories WHERE slug = 'pop-ceiling-design'), 21, 'pop_room_design_style', 'Choose design style', 'SINGLE', TRUE, 'simple', 'Simple', 'Clean and minimal', NULL, 1),
((SELECT id FROM service_categories WHERE slug = 'pop-ceiling-design'), 21, 'pop_room_design_style', 'Choose design style', 'SINGLE', TRUE, 'cove-ceiling', 'Cove Ceiling', 'Smooth curved design', NULL, 2),
((SELECT id FROM service_categories WHERE slug = 'pop-ceiling-design'), 21, 'pop_room_design_style', 'Choose design style', 'SINGLE', TRUE, 'tray-ceiling', 'Tray Ceiling', 'Stylish layered look', NULL, 3),
((SELECT id FROM service_categories WHERE slug = 'pop-ceiling-design'), 21, 'pop_room_design_style', 'Choose design style', 'SINGLE', TRUE, 'border-ceiling', 'Border Ceiling', 'Neat and classic', NULL, 4),
((SELECT id FROM service_categories WHERE slug = 'pop-ceiling-design'), 21, 'pop_room_design_style', 'Choose design style', 'SINGLE', TRUE, 'modern', 'Modern', 'Contemporary look', NULL, 5),
((SELECT id FROM service_categories WHERE slug = 'pop-ceiling-design'), 21, 'pop_room_design_style', 'Choose design style', 'SINGLE', TRUE, 'classic', 'Classic', 'Timeless design', NULL, 6),
((SELECT id FROM service_categories WHERE slug = 'pop-ceiling-design'), 21, 'pop_room_design_style', 'Choose design style', 'SINGLE', TRUE, 'luxury', 'Luxury', 'Premium finish', NULL, 7),
((SELECT id FROM service_categories WHERE slug = 'pop-ceiling-design'), 21, 'pop_room_design_style', 'Choose design style', 'SINGLE', TRUE, 'custom-design', 'Custom Design', 'Describe your own idea', NULL, 8),
((SELECT id FROM service_categories WHERE slug = 'pop-ceiling-design'), 21, 'pop_design_notes', 'Your design brief', 'TEXT', FALSE, NULL, NULL, NULL, NULL, 1),

-- ===========================================================================
-- Shared add-ons — pop_addon (see note 1 and 3 above: rate-per-sqft display
-- text only, price_paise intentionally NULL, used by both flows)
-- ===========================================================================
((SELECT id FROM service_categories WHERE slug = 'pop-ceiling-design'), 30, 'pop_addon', 'Additional options (optional)', 'MULTI', FALSE, 'pop-cornice', 'POP Cornice (Ceiling Borders)', '₹25 / sq. ft.', NULL, 1),
((SELECT id FROM service_categories WHERE slug = 'pop-ceiling-design'), 30, 'pop_addon', 'Additional options (optional)', 'MULTI', FALSE, 'pop-moulding', 'POP Moulding', '₹30 / sq. ft.', NULL, 2),
((SELECT id FROM service_categories WHERE slug = 'pop-ceiling-design'), 30, 'pop_addon', 'Additional options (optional)', 'MULTI', FALSE, 'curtain-cove-pelmet', 'Curtain Cove / Pelmet', '₹35 / sq. ft.', NULL, 3),
((SELECT id FROM service_categories WHERE slug = 'pop-ceiling-design'), 30, 'pop_addon', 'Additional options (optional)', 'MULTI', FALSE, 'pop-wall-moulding', 'POP Wall Moulding', '₹40 / sq. ft.', NULL, 4),
((SELECT id FROM service_categories WHERE slug = 'pop-ceiling-design'), 30, 'pop_addon', 'Additional options (optional)', 'MULTI', FALSE, 'pop-wall-panels', 'POP Wall Panels', '₹45 / sq. ft.', NULL, 5),
((SELECT id FROM service_categories WHERE slug = 'pop-ceiling-design'), 30, 'pop_addon', 'Additional options (optional)', 'MULTI', FALSE, 'tv-wall-pop', 'TV Wall (POP)', '₹8,000 onwards', NULL, 6),
((SELECT id FROM service_categories WHERE slug = 'pop-ceiling-design'), 30, 'pop_addon', 'Additional options (optional)', 'MULTI', FALSE, 'ceiling-repair', 'Ceiling Repair (if required)', '₹25 / sq. ft.', NULL, 7);
