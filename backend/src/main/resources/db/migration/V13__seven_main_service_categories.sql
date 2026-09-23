-- ---------------------------------------------------------------------------
-- SEVEN MAIN SERVICE CATEGORIES, PLUS ONE CATCH-ALL
--
-- The public catalogue shows eight main-level tiles, in this order:
-- Interior Design, Interior by Choice, Painting, Waterproofing,
-- POP Ceiling & Design, Plumber, Electrician, and Other Services — the
-- eighth reactivating five categories that were scoped out earlier (see the
-- OTHER SERVICES block near the end of this file) behind one catch-all tile,
-- the same shape as Electrician's.
--
-- Four things happen here:
--
--   1. `parent_slug` is added so a category can be a sub-service of another
--      one. Today only the seven detailed electrician journeys use it (they
--      point at 'electrical') — they stay fully bookable at their own slug,
--      but drop out of the main catalogue listing, which now filters on
--      parent_slug IS NULL. Nothing about their questions or pricing
--      changes.
--
--   2. "Painting & Waterproofing" (slug `painting`) splits into two real
--      categories. Painting keeps its row, its id and every booking that
--      already references it; Waterproofing is new, with its own questions
--      copied over from the combined form and renumbered into their own
--      step sequence. The waterproofing-flavoured rows are then removed
--      from `painting`, which keeps only its own questions.
--
--   3. `pop-false-ceiling`, deactivated in V11 as one of the six categories
--      outside the approved flow, turns out to belong after all — it is
--      reactivated and renamed to `pop-ceiling-design`. The other five V11
--      deactivated (architectural-design, civil-construction, furniture,
--      fabrication, finishing) stay deactivated; they are not part of the
--      seven.
--
--   4. `interior-by-choice` gets a real row. It was frontend-only content
--      with no backend representation, and its booking step faked its own
--      confirmation client-side rather than calling the real API (see
--      InteriorBooking.jsx) — this row is what that fix now books against.
--
-- Soft delete throughout: nothing referenced by an existing booking is
-- dropped, only deactivated, renamed or reparented.
-- ---------------------------------------------------------------------------

ALTER TABLE service_categories
    ADD COLUMN parent_slug VARCHAR(60) DEFAULT NULL AFTER slug;

UPDATE service_categories
SET parent_slug = 'electrical'
WHERE slug IN (
    'home-electrical-services',
    'fan-installation',
    'switch-socket-installation',
    'wiring-rewiring-services',
    'electrical-repair-services',
    'mcb-db-installation',
    'appliance-installation-services'
);

-- ===========================================================================
-- PAINTING keeps its row; becomes painting-only.
-- ===========================================================================
-- hero_image below points at /assets/popular-services/<slug>.png — real,
-- client-supplied photographs with no baked-in text, one per category
-- (plus a matching <slug>-icon.png the frontend resolves by the same slug;
-- see PopularServices.jsx). These replace the interim choices (cropped
-- hero-banner photos, SVG illustrations, icon-only placeholders) used
-- before real photography existed for every category.
UPDATE service_categories
SET name = 'Painting',
    tagline = 'A finish that holds up.',
    description = 'Interior and exterior painting, putty and primer work, texture finishes, and repainting.',
    icon = 'roller',
    hero_image = '/assets/popular-services/painting.png',
    sort_order = 3
WHERE slug = 'painting';

-- ===========================================================================
-- WATERPROOFING: new category, questions copied from the combined form.
-- ===========================================================================
INSERT INTO service_categories (slug, name, tagline, description, icon, hero_image, visit_fee_paise, sort_order, active)
VALUES ('waterproofing', 'Waterproofing',
        'Stop the leak at the source.',
        'Terrace, bathroom, balcony, basement, wall and water tank waterproofing.',
        'droplet', '/assets/popular-services/waterproofing.png', 2500, 4, TRUE);

-- service_needed: only the options that were grouped 'Waterproofing'.
INSERT INTO service_options
    (category_id, step_no, question_key, question_text, input_type, required,
     option_value, option_label, option_hint, option_group, sort_order, active)
SELECT (SELECT id FROM service_categories WHERE slug = 'waterproofing'),
       1, 'service_needed', 'What waterproofing service do you need?', 'MULTI', TRUE,
       option_value, option_label, option_hint, NULL, sort_order, TRUE
FROM service_options
WHERE category_id = (SELECT id FROM service_categories WHERE slug = 'painting')
  AND question_key = 'service_needed' AND option_group = 'Waterproofing';

-- property_type: the same question painting asks, copied rather than
-- shared — the two are independent categories from here on.
INSERT INTO service_options
    (category_id, step_no, question_key, question_text, input_type, required,
     option_value, option_label, option_hint, option_group, sort_order, active)
SELECT (SELECT id FROM service_categories WHERE slug = 'waterproofing'),
       2, question_key, question_text, input_type, required,
       option_value, option_label, option_hint, option_group, sort_order, TRUE
FROM service_options
WHERE category_id = (SELECT id FROM service_categories WHERE slug = 'painting')
  AND question_key = 'property_type';

-- step 6 (problem_type, problem_location, previous_waterproofing,
-- previous_when) was already waterproofing-only in the combined form.
INSERT INTO service_options
    (category_id, step_no, question_key, question_text, input_type, required,
     option_value, option_label, option_hint, option_group, sort_order, active)
SELECT (SELECT id FROM service_categories WHERE slug = 'waterproofing'),
       3, question_key, question_text, input_type, required,
       option_value, option_label, option_hint, option_group, sort_order, TRUE
FROM service_options
WHERE category_id = (SELECT id FROM service_categories WHERE slug = 'painting')
  AND step_no = 6;

INSERT INTO service_options
    (category_id, step_no, question_key, question_text, input_type, required, sort_order, active)
VALUES
    ((SELECT id FROM service_categories WHERE slug = 'waterproofing'), 4, 'area_sqft', 'Approximate area (sq. ft.)', 'NUMBER', FALSE, 1, TRUE),
    ((SELECT id FROM service_categories WHERE slug = 'waterproofing'), 5, 'files', 'Upload photos or video', 'FILE', FALSE, 1, TRUE),
    ((SELECT id FROM service_categories WHERE slug = 'waterproofing'), 6, 'notes', 'Tell us anything else about your work.', 'TEXT', FALSE, 1, TRUE);

-- Now drop the waterproofing-only rows from `painting`: half of
-- service_needed, and the whole of step 6 — none of it is a painting
-- question.
DELETE FROM service_options
WHERE category_id = (SELECT id FROM service_categories WHERE slug = 'painting')
  AND ((question_key = 'service_needed' AND option_group = 'Waterproofing')
       OR step_no = 6);

-- ===========================================================================
-- POP CEILING & DESIGN: reactivate + rename.
-- ===========================================================================
UPDATE service_categories
SET slug = 'pop-ceiling-design',
    name = 'POP Ceiling & Design',
    icon = 'ceiling',
    hero_image = '/assets/popular-services/pop-ceiling-design.png',
    sort_order = 5,
    active = TRUE
WHERE slug = 'pop-false-ceiling';

-- ===========================================================================
-- INTERIOR BY CHOICE: first backend row for a previously frontend-only flow.
-- ===========================================================================
INSERT INTO service_categories (slug, name, tagline, description, icon, hero_image, visit_fee_paise, sort_order, active)
VALUES ('interior-by-choice', 'Interior by Choice',
        'Browse ready-made designs, pick one, book a home visit.',
        'A catalogue of ready interior designs by space. Pick one and book a paid home visit; the fee is adjusted into your final project cost.',
        'layers', '/assets/popular-services/interior-by-choice.png', 9900, 2, TRUE);

INSERT INTO service_options
    (category_id, step_no, question_key, question_text, input_type, required, sort_order, active)
VALUES ((SELECT id FROM service_categories WHERE slug = 'interior-by-choice'),
        1, 'notes', 'Selected design and requirements', 'TEXT', FALSE, 1, TRUE);

-- ===========================================================================
-- The remaining three: display name, imagery and final sort order.
-- ===========================================================================
-- icon here is corrected to match components/ui/Icon.jsx's actual key names
-- (the original V5/V8 seed used the slug itself as the icon value, which
-- never matched a real icon key — nothing rendered for these three).
UPDATE service_categories SET sort_order = 1, icon = 'sofa', hero_image = '/assets/popular-services/interior-design.png', name = 'Interior Design' WHERE slug = 'interior-design';
UPDATE service_categories SET sort_order = 6, icon = 'tap', hero_image = '/assets/popular-services/plumbing.png', name = 'Plumber' WHERE slug = 'plumbing';
UPDATE service_categories SET sort_order = 7, icon = 'bolt', hero_image = '/assets/popular-services/electrical.png' WHERE slug = 'electrical';

-- ===========================================================================
-- OTHER SERVICES: an eighth catch-all tile, added back on request after
-- being scoped out. Same shape as "electrical" — one tile in the main
-- catalogue, a category-list page in front of what were, until now, five
-- deactivated categories. Reactivating them changes only `active` and
-- `parent_slug`; every question and price they had under V8 is untouched.
-- ===========================================================================
INSERT INTO service_categories (slug, name, tagline, description, icon, hero_image, visit_fee_paise, sort_order, active)
VALUES ('other-services', 'Other Services',
        'Everything else we do.',
        'Architectural design, civil construction, furniture, fabrication and finishing work.',
        'settings', '/assets/popular-services/other-services.png', 2500, 8, TRUE);

UPDATE service_categories
SET active = TRUE,
    parent_slug = 'other-services'
WHERE slug IN ('architectural-design', 'civil-construction', 'furniture', 'fabrication', 'finishing');

-- Same icon-key correction as the main seven: V8's seed used the slug
-- itself as the icon value, which never matched a real Icon.jsx key.
UPDATE service_categories SET icon = 'building' WHERE slug = 'architectural-design';
UPDATE service_categories SET icon = 'crane' WHERE slug = 'civil-construction';
UPDATE service_categories SET icon = 'wardrobe' WHERE slug = 'furniture';
UPDATE service_categories SET icon = 'welding' WHERE slug = 'fabrication';
UPDATE service_categories SET icon = 'trowel' WHERE slug = 'finishing';
