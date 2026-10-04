-- Adds the AC Services category (Yash's AC booking flow) next to the existing
-- services. Nothing existing is switched off: Other Services stays active.
-- Starting service prices remain reference information in the frontend.
-- Final service pricing is confirmed before work begins.

INSERT INTO service_categories
    (slug, name, tagline, description, icon, hero_image,
     visit_fee_paise, sort_order, active, parent_slug)
SELECT
    'ac-services',
    'AC Services',
    'AC servicing, repair and installation.',
    'Regular AC service, repairs, installation, uninstallation, gas charging and annual maintenance.',
    'fan',
    NULL,
    COALESCE(
        (SELECT visit_fee_paise
         FROM service_categories
         WHERE slug = 'other-services'),
        9900
    ),
    8,
    TRUE,
    NULL
WHERE NOT EXISTS (
    SELECT 1 FROM service_categories WHERE slug = 'ac-services'
);

-- Other Services is the catch-all, so it goes last: AC Services takes its old
-- place in the order and Other Services moves one step down. (Order only.)
UPDATE service_categories
SET sort_order = 9
WHERE slug = 'other-services'
  AND sort_order <= 8;

SET @ac_category_id = (
    SELECT id FROM service_categories WHERE slug = 'ac-services'
);

-- Booking keys match AcCheckout.jsx.
-- Capacity and refrigerant are conditional requirements in the AC flow.

INSERT INTO service_options
    (category_id, step_no, question_key, question_text,
     input_type, required, option_value, option_label, sort_order)
VALUES
(@ac_category_id, 1, 'ac_category', 'Choose AC service category', 'SINGLE', TRUE, 'regular', 'Regular AC Services', 1),
(@ac_category_id, 1, 'ac_category', 'Choose AC service category', 'SINGLE', TRUE, 'repair', 'AC Repair', 2),
(@ac_category_id, 1, 'ac_category', 'Choose AC service category', 'SINGLE', TRUE, 'installation', 'AC Installation', 3),
(@ac_category_id, 1, 'ac_category', 'Choose AC service category', 'SINGLE', TRUE, 'uninstallation', 'AC Uninstallation', 4),
(@ac_category_id, 1, 'ac_category', 'Choose AC service category', 'SINGLE', TRUE, 'gas-charging', 'Gas Charging', 5),
(@ac_category_id, 1, 'ac_category', 'Choose AC service category', 'SINGLE', TRUE, 'amc', 'Annual Maintenance (AMC)', 6),

(@ac_category_id, 2, 'ac_service', 'Choose your AC service', 'SINGLE', TRUE, 'general-service', 'AC General Service', 1),
(@ac_category_id, 2, 'ac_service', 'Choose your AC service', 'SINGLE', TRUE, 'jet-service', 'AC Jet Service', 2),
(@ac_category_id, 2, 'ac_service', 'Choose your AC service', 'SINGLE', TRUE, 'deep-cleaning', 'AC Deep Cleaning', 3),
(@ac_category_id, 2, 'ac_service', 'Choose your AC service', 'SINGLE', TRUE, 'filter-cleaning', 'AC Filter Cleaning', 4),
(@ac_category_id, 2, 'ac_service', 'Choose your AC service', 'SINGLE', TRUE, 'cooling-check', 'AC Cooling Check', 5),
(@ac_category_id, 2, 'ac_service', 'Choose your AC service', 'SINGLE', TRUE, 'water-leakage-check', 'Water Leakage Check', 6),
(@ac_category_id, 2, 'ac_service', 'Choose your AC service', 'SINGLE', TRUE, 'drain-pipe-cleaning', 'AC Drain Pipe Cleaning', 7),
(@ac_category_id, 2, 'ac_service', 'Choose your AC service', 'SINGLE', TRUE, 'outdoor-unit-cleaning', 'Outdoor Unit Cleaning', 8),
(@ac_category_id, 2, 'ac_service', 'Choose your AC service', 'SINGLE', TRUE, 'not-cooling', 'AC Not Cooling', 9),
(@ac_category_id, 2, 'ac_service', 'Choose your AC service', 'SINGLE', TRUE, 'water-leakage', 'Water Leakage', 10),
(@ac_category_id, 2, 'ac_service', 'Choose your AC service', 'SINGLE', TRUE, 'not-starting', 'AC Not Starting', 11),
(@ac_category_id, 2, 'ac_service', 'Choose your AC service', 'SINGLE', TRUE, 'unusual-noise', 'Unusual Noise', 12),
(@ac_category_id, 2, 'ac_service', 'Choose your AC service', 'SINGLE', TRUE, 'bad-smell', 'Bad Smell', 13),
(@ac_category_id, 2, 'ac_service', 'Choose your AC service', 'SINGLE', TRUE, 'electrical-fault', 'Electrical Fault', 14),
(@ac_category_id, 2, 'ac_service', 'Choose your AC service', 'SINGLE', TRUE, 'ac-installation', 'AC Installation', 15),
(@ac_category_id, 2, 'ac_service', 'Choose your AC service', 'SINGLE', TRUE, 'ac-uninstallation', 'AC Uninstallation', 16),
(@ac_category_id, 2, 'ac_service', 'Choose your AC service', 'SINGLE', TRUE, 'gas-charging', 'AC Gas Charging', 17),
(@ac_category_id, 2, 'ac_service', 'Choose your AC service', 'SINGLE', TRUE, 'amc-2-services', '2 Service AMC', 18),
(@ac_category_id, 2, 'ac_service', 'Choose your AC service', 'SINGLE', TRUE, 'amc-3-services', '3 Service AMC', 19),
(@ac_category_id, 2, 'ac_service', 'Choose your AC service', 'SINGLE', TRUE, 'amc-4-services', '4 Service AMC', 20),

(@ac_category_id, 3, 'ac_type', 'Choose your AC type', 'SINGLE', TRUE, 'split', 'Split AC', 1),
(@ac_category_id, 3, 'ac_type', 'Choose your AC type', 'SINGLE', TRUE, 'window', 'Window AC', 2),
(@ac_category_id, 3, 'ac_type', 'Choose your AC type', 'SINGLE', TRUE, 'inverter', 'Inverter AC', 3),
(@ac_category_id, 3, 'ac_type', 'Choose your AC type', 'SINGLE', TRUE, 'cassette', 'Cassette AC', 4),
(@ac_category_id, 3, 'ac_type', 'Choose your AC type', 'SINGLE', TRUE, 'ductable', 'Ductable AC', 5),
(@ac_category_id, 3, 'ac_type', 'Choose your AC type', 'SINGLE', TRUE, 'concealed', 'Concealed AC', 6),

(@ac_category_id, 3, 'ac_units', 'Number of AC units', 'NUMBER', TRUE, NULL, NULL, 1),

(@ac_category_id, 3, 'ac_capacity', 'Choose AC capacity', 'SINGLE', FALSE, '1-ton', '1 Ton', 1),
(@ac_category_id, 3, 'ac_capacity', 'Choose AC capacity', 'SINGLE', FALSE, '1-5-ton', '1.5 Ton', 2),
(@ac_category_id, 3, 'ac_capacity', 'Choose AC capacity', 'SINGLE', FALSE, '2-ton', '2 Ton', 3),

(@ac_category_id, 3, 'ac_refrigerant', 'Choose refrigerant', 'SINGLE', FALSE, 'r32', 'R32', 1),

(@ac_category_id, 4, 'ac_addons', 'Additional services (optional)', 'MULTI', FALSE, 'gas-check', 'Gas Check', 1),
(@ac_category_id, 4, 'ac_addons', 'Additional services (optional)', 'MULTI', FALSE, 'stand-check', 'Outdoor Stand Check', 2),
(@ac_category_id, 4, 'ac_addons', 'Additional services (optional)', 'MULTI', FALSE, 'anti-rust', 'Anti-Rust Coating', 3),
(@ac_category_id, 4, 'ac_addons', 'Additional services (optional)', 'MULTI', FALSE, 'extended-copper-pipe', 'Extended Copper Pipe', 4),
(@ac_category_id, 4, 'ac_addons', 'Additional services (optional)', 'MULTI', FALSE, 'outdoor-stand', 'Outdoor Stand (Heavy Duty)', 5),
(@ac_category_id, 4, 'ac_addons', 'Additional services (optional)', 'MULTI', FALSE, 'stabilizer-installation', 'Stabilizer Installation', 6),
(@ac_category_id, 4, 'ac_addons', 'Additional services (optional)', 'MULTI', FALSE, 'mcb-installation', 'MCB / Isolator Installation', 7),
(@ac_category_id, 4, 'ac_addons', 'Additional services (optional)', 'MULTI', FALSE, 'core-cutting', 'Core Cutting', 8),
(@ac_category_id, 4, 'ac_addons', 'Additional services (optional)', 'MULTI', FALSE, 'drain-extension', 'Drain Pipe Extension', 9),
(@ac_category_id, 4, 'ac_addons', 'Additional services (optional)', 'MULTI', FALSE, 'outdoor-dismantling', 'Outdoor Unit Dismantling (separate location)', 10),
(@ac_category_id, 4, 'ac_addons', 'Additional services (optional)', 'MULTI', FALSE, 'pipe-packing', 'Copper Pipe Care & Packing', 11),
(@ac_category_id, 4, 'ac_addons', 'Additional services (optional)', 'MULTI', FALSE, 'safe-transport', 'Safe Transport (within same building)', 12),
(@ac_category_id, 4, 'ac_addons', 'Additional services (optional)', 'MULTI', FALSE, 'stand-removal', 'Outdoor Stand Removal', 13),
(@ac_category_id, 4, 'ac_addons', 'Additional services (optional)', 'MULTI', FALSE, 'gas-recovery', 'Gas Recovery (if required)', 14),
(@ac_category_id, 4, 'ac_addons', 'Additional services (optional)', 'MULTI', FALSE, 'leakage-detection', 'Leakage Detection (Soap Test)', 15),
(@ac_category_id, 4, 'ac_addons', 'Additional services (optional)', 'MULTI', FALSE, 'copper-pipe-repair', 'Copper Pipe Repair (if required)', 16),
(@ac_category_id, 4, 'ac_addons', 'Additional services (optional)', 'MULTI', FALSE, 'vacuum-pressure-test', 'Vacuuming & Pressure Test', 17),

(@ac_category_id, 4, 'ac_qty_extended_copper_pipe', 'Extended copper pipe length (ft)', 'NUMBER', FALSE, NULL, NULL, 1),
(@ac_category_id, 4, 'ac_qty_core_cutting', 'Number of core cutting holes', 'NUMBER', FALSE, NULL, NULL, 1),
(@ac_category_id, 4, 'ac_qty_drain_extension', 'Drain pipe extension length (ft)', 'NUMBER', FALSE, NULL, NULL, 1);