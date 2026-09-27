-- ---------------------------------------------------------------------------
-- REACTIVATE THE SEVEN DETAILED ELECTRICIAN SERVICES
--
-- V10 added these; V11 deactivated them along with everything outside the
-- four core services. Per updated direction, the detailed electrician
-- journeys are wanted after all — the flowchart's simpler single-flow
-- Electrician was the wrong call for this category specifically. The other
-- six categories V11 deactivated (architectural-design, civil-construction,
-- pop-false-ceiling, furniture, fabrication, finishing) are untouched here
-- and stay inactive.
--
-- No data changed shape since V11 — this just flips the same flag back.
-- ---------------------------------------------------------------------------

UPDATE service_categories
SET active = TRUE
WHERE slug IN (
    'home-electrical-services',
    'fan-installation',
    'switch-socket-installation',
    'wiring-rewiring-services',
    'electrical-repair-services',
    'mcb-db-installation',
    'appliance-installation-services'
);
