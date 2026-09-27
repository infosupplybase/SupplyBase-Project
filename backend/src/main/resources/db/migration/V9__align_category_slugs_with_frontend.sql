-- ---------------------------------------------------------------------------
-- ALIGN THE ORIGINAL FOUR SLUGS WITH THE MARKETING SITE
--
-- V5 named three of the four original categories differently to how the
-- marketing site (frontend/src/data/services.js) links to them:
--
--   painting-waterproofing  ->  painting
--   electrician              ->  electrical
--   interior-work            ->  interior-design
--
-- Every "Book Now" link on the Services page for these three 404'd for the
-- same reason the six added in V8 did. Only the slug moves — the category's
-- id, questions, appointment rules and any existing bookings are untouched,
-- since everything else references category_id, never the slug string.
-- ---------------------------------------------------------------------------

UPDATE service_categories SET slug = 'painting'        WHERE slug = 'painting-waterproofing';
UPDATE service_categories SET slug = 'electrical'       WHERE slug = 'electrician';
UPDATE service_categories SET slug = 'interior-design'  WHERE slug = 'interior-work';
