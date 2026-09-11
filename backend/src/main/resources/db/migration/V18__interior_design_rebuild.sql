-- ---------------------------------------------------------------------------
-- INTERIOR DESIGN — replaces the old 10-step generic wizard with a real
-- catalogue -> package -> customise -> paid consultation journey.
--
-- UNLIKE Plumbing/Painting/POP Ceiling/Waterproofing, this rebuild does NOT
-- introduce a priced itemised catalogue in the database. It follows the
-- exact precedent already shipped for Interior by Choice (V13 — one
-- service_categories row, one free-text `notes` question, everything else
-- — spaces/designs/colours/material detail — lives in a frontend content
-- file). Interior Design's own new catalogue (project categories, projects,
-- package tiers, styles, colours) is added the same way, in
-- frontend/src/data/interiorDesignContent.js, for the same reason Interior
-- by Choice made that choice: nothing here is client-selectable pricing
-- that needs summing or server validation against a cart — a customer
-- picks a project and a package tier, and the real, final price is
-- confirmed at the paid consultation visit, exactly like every other
-- catalogue entry already on this site.
--
-- Decisions flagged for confirmation, not silently finalised:
--
-- 1. VISIT FEE — changed from the category's existing flat 2500 (₹25) to
--    9900 (₹99). The reference is explicit and repeated ("Book Consultation
--    ₹99" appears on nearly every screen), and the brief itself says to
--    report this exact conflict rather than silently apply it. Flagging it
--    here: Interior by Choice — the closest sibling feature, an
--    already-shipped "browse a catalogue, book a paid home visit" flow —
--    already charges exactly ₹99 for the same kind of visit (V13,
--    visit_fee_paise = 9900). Setting Interior Design to the same number
--    makes it consistent with the one directly comparable feature already
--    approved and live, rather than leaving the old ₹25 generic-wizard
--    default in place. No BookingService.java changes were needed either
--    way — no priced items exist here, so the flat category fee is what
--    every booking shows, the same mechanism already governing every
--    other unpriced category (POP's non-detailed subservices, Waterproofing).
--
-- 2. PACKAGE PRICES. Only the illustrated example — 1 BHK "Modern Minimal"
--    (Standard ₹4.99L / Premium ₹6.99L / Luxury ₹9.99L, 650 sq. ft.,
--    45–60 days, 5-year warranty) — has real reference numbers. The brief
--    explicitly says not to invent prices for 2 BHK, 3 BHK, Villa or
--    custom projects, so every OTHER project in the new catalogue shows
--    "Quotation after site visit" instead of a scaled or guessed price —
--    see interiorDesignContent.js's PROJECTS array and its per-project
--    `packages: null` for anything not the reference example.
--
-- 3. The old 10-step generic wizard (service_needed/property_type/
--    property_status/rooms/style/budget/start_timeline/requirement_type/
--    files/notes, from V6, still live on this category since V9 only
--    renamed its slug) is soft-deactivated below — this rebuild covers the
--    category's full scope (there's no equivalent of POP/Waterproofing's
--    "a few non-detailed subservices keep the old wizard" situation here),
--    same precedent as Painting's V15.
-- ---------------------------------------------------------------------------

UPDATE service_categories
SET tagline = 'Your Style. Our Expertise.',
    description = 'Complete home interiors — 1 BHK to Villa, Standard to Luxury packages, styles, materials and colours, with a paid design consultation.',
    visit_fee_paise = 9900
WHERE slug = 'interior-design';

UPDATE service_options
SET active = FALSE
WHERE category_id = (SELECT id FROM service_categories WHERE slug = 'interior-design')
  AND question_key IN (
    'service_needed', 'property_type', 'property_status', 'rooms', 'style',
    'budget', 'start_timeline', 'requirement_type', 'files', 'notes'
  );

-- Same shape as Interior by Choice's own single question (V13): every
-- booking's project/package/style/colour selection is recorded as a
-- descriptive note, not a priced catalogue answer.
INSERT INTO service_options
    (category_id, step_no, question_key, question_text, input_type, required, sort_order, active)
VALUES
((SELECT id FROM service_categories WHERE slug = 'interior-design'), 1, 'notes', 'Selected project, package and requirements', 'TEXT', FALSE, 1, TRUE);
