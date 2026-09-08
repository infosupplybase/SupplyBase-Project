-- ---------------------------------------------------------------------------
-- SCOPE DOWN TO THE FOUR CORE SERVICES
--
-- Per the approved flowchart, the site now offers exactly four services:
-- Interior Design (Interior by Choice included), Painting & Waterproofing,
-- Plumber, Electrician.
--
-- Two groups of rows are deactivated here:
--   1. The six categories V8 added on top of the original four
--      (architectural-design, civil-construction, pop-false-ceiling,
--      furniture, fabrication, finishing) — these mirror the frontend's
--      services.js marketing list one-to-one (post-V9's slug alignment)
--      and were independently bookable at /services/<slug>, not just
--      marketing content.
--   2. The seven detailed electrician sub-categories added in V10, which
--      go back to being one simple Electrician booking flow.
--
-- Soft delete, not a DROP: `active = false` keeps every row, every question,
-- and every historical booking's category reference intact — this is a
-- product decision, not data loss, and it is meant to be reversible by
-- flipping the flag back if any of this is wanted live again later.
-- ---------------------------------------------------------------------------

UPDATE service_categories
SET active = FALSE
WHERE slug IN (
    -- V8's six additional marketing-equivalent categories
    'architectural-design',
    'civil-construction',
    'pop-false-ceiling',
    'furniture',
    'fabrication',
    'finishing',
    -- V10's seven detailed electrician sub-categories
    'home-electrical-services',
    'fan-installation',
    'switch-socket-installation',
    'wiring-rewiring-services',
    'electrical-repair-services',
    'mcb-db-installation',
    'appliance-installation-services'
);
