-- ---------------------------------------------------------------------------
-- SEVEN DETAILED ELECTRICIAN SERVICES
--
-- The generic "electrician" category (V6) stays exactly as it is — it is
-- still what /booking/electrical and the "Light Installation" entry point
-- use. These seven are new, additive categories that give each of the main
-- electrician jobs its own richer, purpose-built booking form: a type
-- question, service-specific detail questions, and a priced add-ons
-- question, all rendered by the same catalogue-driven wizard the other
-- services already use.
--
-- price_paise on an option is new (see the ALTER below): it is what lets an
-- add-on question show and total a real amount instead of being purely
-- descriptive text. NULL everywhere else, so no existing row or category is
-- affected by adding the column.
-- ---------------------------------------------------------------------------

ALTER TABLE service_options
    ADD COLUMN price_paise BIGINT NULL AFTER option_group;

ALTER TABLE service_categories
    ADD COLUMN estimate_min_paise BIGINT NULL AFTER visit_fee_paise,
    ADD COLUMN estimate_max_paise BIGINT NULL AFTER estimate_min_paise;

-- ===========================================================================
-- CATEGORIES
-- ===========================================================================
INSERT INTO service_categories
    (slug, name, tagline, description, icon, visit_fee_paise, estimate_min_paise, estimate_max_paise, sort_order) VALUES
('home-electrical-services', 'Home Electrical Services', 'Safe. Reliable. Certified Experts.',
 'Complete home electrical solutions, wiring inspections, and seamless service booking — installation, repair and replacement for the whole home.',
 'bolt', 2500, 1800000, 2800000, 10),
('fan-installation', 'Fan Installation Services', 'Safe. Secure. Reliable.',
 'Ceiling fans, exhaust, designer fans, speed balance testing, and accessory replacement.',
 'fan', 2500, 95000, 120000, 11),
('switch-socket-installation', 'Switch & Socket Installation', 'Safe Installation. Neat Finishing.',
 'Modular switch boards, socket installation, smart automation switches, and TV/data sockets.',
 'plug', 2500, 240000, 420000, 12),
('wiring-rewiring-services', 'Wiring & Rewiring Services', 'Safe. Standard. Future Ready.',
 'Full home rewire, concealed casing wiring, load calculation, earthing, and conduit piping.',
 'bolt', 2500, 4800000, 7200000, 13),
('electrical-repair-services', 'Electrical Repair Services', 'Quick Fixes. Safe Homes.',
 'Troubleshooting, tripping diagnostics, short circuit repairs, and spare part replacements.',
 'wrench', 2500, 30000, 60000, 14),
('mcb-db-installation', 'MCB & DB Installation', 'Safe Homes. Reliable Power.',
 'Distribution boards, single/three-phase SPN/TPN DB, RCCB, ELCB and surge protection units.',
 'shield', 2500, 160000, 240000, 15),
('appliance-installation-services', 'Appliance Installation Services', 'Safe Installation. Expert Technicians.',
 'Air conditioner, geyser, chimney, and heavy appliance electrical integration.',
 'package', 2500, 210000, 280000, 16);

-- ===========================================================================
-- 1. HOME ELECTRICAL SERVICES
-- ===========================================================================
INSERT INTO service_options
    (category_id, step_no, question_key, question_text, input_type, required,
     option_value, option_label, option_hint, option_group, price_paise, sort_order)
VALUES
((SELECT id FROM service_categories WHERE slug = 'home-electrical-services'), 1, 'service_type', 'Select the electrical services you need for your home', 'MULTI', TRUE, 'Complete Home Wiring', 'Complete Home Wiring', 'New wiring for entire home', NULL, NULL, 1),
((SELECT id FROM service_categories WHERE slug = 'home-electrical-services'), 1, 'service_type', 'Select the electrical services you need for your home', 'MULTI', TRUE, 'Switch & Socket Installation', 'Switch & Socket Installation', 'All rooms', NULL, NULL, 2),
((SELECT id FROM service_categories WHERE slug = 'home-electrical-services'), 1, 'service_type', 'Select the electrical services you need for your home', 'MULTI', TRUE, 'Light Installation', 'Light Installation', 'LED, panel, downlight, etc.', NULL, NULL, 3),
((SELECT id FROM service_categories WHERE slug = 'home-electrical-services'), 1, 'service_type', 'Select the electrical services you need for your home', 'MULTI', TRUE, 'Fan Installation', 'Fan Installation', 'Ceiling & exhaust fans', NULL, NULL, 4),
((SELECT id FROM service_categories WHERE slug = 'home-electrical-services'), 1, 'service_type', 'Select the electrical services you need for your home', 'MULTI', TRUE, 'MCB / DB Installation', 'MCB / DB Installation', 'Distribution board, MCB, RCCB', NULL, NULL, 5),
((SELECT id FROM service_categories WHERE slug = 'home-electrical-services'), 1, 'service_type', 'Select the electrical services you need for your home', 'MULTI', TRUE, 'Appliance Points', 'Appliance Points', 'AC, geyser, chimney, etc.', NULL, NULL, 6),
((SELECT id FROM service_categories WHERE slug = 'home-electrical-services'), 1, 'service_type', 'Select the electrical services you need for your home', 'MULTI', TRUE, 'Repair & Troubleshooting', 'Repair & Troubleshooting', 'Fix faults, tripping, short circuit', NULL, NULL, 7),
((SELECT id FROM service_categories WHERE slug = 'home-electrical-services'), 1, 'service_type', 'Select the electrical services you need for your home', 'MULTI', TRUE, 'Smart Home Setup', 'Smart Home Setup', 'Smart switches, automation', NULL, NULL, 8),

((SELECT id FROM service_categories WHERE slug = 'home-electrical-services'), 2, 'home_type', 'Type of home', 'SINGLE', TRUE, '1 BHK', '1 BHK', NULL, NULL, NULL, 1),
((SELECT id FROM service_categories WHERE slug = 'home-electrical-services'), 2, 'home_type', 'Type of home', 'SINGLE', TRUE, '2 BHK', '2 BHK', NULL, NULL, NULL, 2),
((SELECT id FROM service_categories WHERE slug = 'home-electrical-services'), 2, 'home_type', 'Type of home', 'SINGLE', TRUE, '3 BHK', '3 BHK', NULL, NULL, NULL, 3),
((SELECT id FROM service_categories WHERE slug = 'home-electrical-services'), 2, 'home_type', 'Type of home', 'SINGLE', TRUE, '4 BHK', '4 BHK', NULL, NULL, NULL, 4),
((SELECT id FROM service_categories WHERE slug = 'home-electrical-services'), 2, 'home_type', 'Type of home', 'SINGLE', TRUE, 'Villa', 'Villa', NULL, NULL, NULL, 5),
((SELECT id FROM service_categories WHERE slug = 'home-electrical-services'), 2, 'home_size', 'Home size (approx.)', 'SINGLE', TRUE, 'Below 600 sq.ft.', 'Below 600 sq.ft.', NULL, NULL, NULL, 1),
((SELECT id FROM service_categories WHERE slug = 'home-electrical-services'), 2, 'home_size', 'Home size (approx.)', 'SINGLE', TRUE, '600 - 1000 sq.ft.', '600 - 1000 sq.ft.', NULL, NULL, NULL, 2),
((SELECT id FROM service_categories WHERE slug = 'home-electrical-services'), 2, 'home_size', 'Home size (approx.)', 'SINGLE', TRUE, '1000 - 1500 sq.ft.', '1000 - 1500 sq.ft.', NULL, NULL, NULL, 3),
((SELECT id FROM service_categories WHERE slug = 'home-electrical-services'), 2, 'home_size', 'Home size (approx.)', 'SINGLE', TRUE, '1500 - 2500 sq.ft.', '1500 - 2500 sq.ft.', NULL, NULL, NULL, 4),
((SELECT id FROM service_categories WHERE slug = 'home-electrical-services'), 2, 'home_size', 'Home size (approx.)', 'SINGLE', TRUE, 'Above 2500 sq.ft.', 'Above 2500 sq.ft.', NULL, NULL, NULL, 5),
((SELECT id FROM service_categories WHERE slug = 'home-electrical-services'), 2, 'setup_type', 'Is it a new electrical setup or existing home?', 'SINGLE', TRUE, 'New Setup', 'New Setup', NULL, NULL, NULL, 1),
((SELECT id FROM service_categories WHERE slug = 'home-electrical-services'), 2, 'setup_type', 'Is it a new electrical setup or existing home?', 'SINGLE', TRUE, 'Existing Home', 'Existing Home', NULL, NULL, NULL, 2),
((SELECT id FROM service_categories WHERE slug = 'home-electrical-services'), 2, 'requirements', 'Any specific requirements?', 'TEXT', FALSE, NULL, NULL, NULL, NULL, NULL, 1),

((SELECT id FROM service_categories WHERE slug = 'home-electrical-services'), 3, 'add_ons', 'Add-on services', 'MULTI', FALSE, 'Additional Light Point', 'Additional Light Point', '₹450 / point', NULL, 45000, 1),
((SELECT id FROM service_categories WHERE slug = 'home-electrical-services'), 3, 'add_ons', 'Add-on services', 'MULTI', FALSE, 'Additional Fan Point', 'Additional Fan Point', '₹600 / point', NULL, 60000, 2),
((SELECT id FROM service_categories WHERE slug = 'home-electrical-services'), 3, 'add_ons', 'Add-on services', 'MULTI', FALSE, 'USB Charging Socket', 'USB Charging Socket', '₹850 / point', NULL, 85000, 3),
((SELECT id FROM service_categories WHERE slug = 'home-electrical-services'), 3, 'add_ons', 'Add-on services', 'MULTI', FALSE, 'Smart Switch Installation', 'Smart Switch Installation', '₹1,200 / point', NULL, 120000, 4),
((SELECT id FROM service_categories WHERE slug = 'home-electrical-services'), 3, 'add_ons', 'Add-on services', 'MULTI', FALSE, 'Inverter Point', 'Inverter Point', '₹750 / point', NULL, 75000, 5),
((SELECT id FROM service_categories WHERE slug = 'home-electrical-services'), 3, 'add_ons', 'Add-on services', 'MULTI', FALSE, 'AC Point', 'AC Point', '₹1,000 / point', NULL, 100000, 6),
((SELECT id FROM service_categories WHERE slug = 'home-electrical-services'), 3, 'add_ons', 'Add-on services', 'MULTI', FALSE, 'Geyser Point', 'Geyser Point', '₹800 / point', NULL, 80000, 7),

((SELECT id FROM service_categories WHERE slug = 'home-electrical-services'), 4, 'files', 'Upload photos (optional)', 'FILE', FALSE, NULL, NULL, NULL, NULL, NULL, 1);

-- ===========================================================================
-- 2. FAN INSTALLATION SERVICES
-- ===========================================================================
INSERT INTO service_options
    (category_id, step_no, question_key, question_text, input_type, required,
     option_value, option_label, option_hint, option_group, price_paise, sort_order)
VALUES
((SELECT id FROM service_categories WHERE slug = 'fan-installation'), 1, 'fan_type', 'Select the type of fan you want to install', 'SINGLE', TRUE, 'Ceiling Fan', 'Ceiling Fan', 'Standard ceiling fan', NULL, NULL, 1),
((SELECT id FROM service_categories WHERE slug = 'fan-installation'), 1, 'fan_type', 'Select the type of fan you want to install', 'SINGLE', TRUE, 'Designer Ceiling Fan', 'Designer Ceiling Fan', 'Premium & decorative', NULL, NULL, 2),
((SELECT id FROM service_categories WHERE slug = 'fan-installation'), 1, 'fan_type', 'Select the type of fan you want to install', 'SINGLE', TRUE, 'Exhaust Fan', 'Exhaust Fan', 'For kitchen, bathroom, etc.', NULL, NULL, 3),
((SELECT id FROM service_categories WHERE slug = 'fan-installation'), 1, 'fan_type', 'Select the type of fan you want to install', 'SINGLE', TRUE, 'Wall Fan', 'Wall Fan', 'For walls (residential/commercial)', NULL, NULL, 4),
((SELECT id FROM service_categories WHERE slug = 'fan-installation'), 1, 'fan_type', 'Select the type of fan you want to install', 'SINGLE', TRUE, 'Pedestal Fan', 'Pedestal Fan', 'With base stand', NULL, NULL, 5),
((SELECT id FROM service_categories WHERE slug = 'fan-installation'), 1, 'fan_type', 'Select the type of fan you want to install', 'SINGLE', TRUE, 'Other Fan', 'Other Fan', 'Any other type', NULL, NULL, 6),

((SELECT id FROM service_categories WHERE slug = 'fan-installation'), 2, 'number_of_fans', 'Number of fans', 'NUMBER', TRUE, NULL, NULL, NULL, NULL, NULL, 1),
((SELECT id FROM service_categories WHERE slug = 'fan-installation'), 2, 'fan_brand', 'Fan brand (optional)', 'SINGLE', FALSE, 'Atomberg', 'Atomberg', NULL, NULL, NULL, 1),
((SELECT id FROM service_categories WHERE slug = 'fan-installation'), 2, 'fan_brand', 'Fan brand (optional)', 'SINGLE', FALSE, 'Havells', 'Havells', NULL, NULL, NULL, 2),
((SELECT id FROM service_categories WHERE slug = 'fan-installation'), 2, 'fan_brand', 'Fan brand (optional)', 'SINGLE', FALSE, 'Crompton', 'Crompton', NULL, NULL, NULL, 3),
((SELECT id FROM service_categories WHERE slug = 'fan-installation'), 2, 'fan_brand', 'Fan brand (optional)', 'SINGLE', FALSE, 'Orient Electric', 'Orient Electric', NULL, NULL, NULL, 4),
((SELECT id FROM service_categories WHERE slug = 'fan-installation'), 2, 'fan_brand', 'Fan brand (optional)', 'SINGLE', FALSE, 'Bajaj', 'Bajaj', NULL, NULL, NULL, 5),
((SELECT id FROM service_categories WHERE slug = 'fan-installation'), 2, 'fan_brand', 'Fan brand (optional)', 'SINGLE', FALSE, 'Usha', 'Usha', NULL, NULL, NULL, 6),
((SELECT id FROM service_categories WHERE slug = 'fan-installation'), 2, 'fan_brand', 'Fan brand (optional)', 'SINGLE', FALSE, 'No preference', 'No preference', NULL, NULL, NULL, 7),
((SELECT id FROM service_categories WHERE slug = 'fan-installation'), 2, 'fan_height', 'Fan height', 'SINGLE', FALSE, 'Low Ceiling (Below 8 ft)', 'Low Ceiling (Below 8 ft)', NULL, NULL, NULL, 1),
((SELECT id FROM service_categories WHERE slug = 'fan-installation'), 2, 'fan_height', 'Fan height', 'SINGLE', FALSE, 'Normal Ceiling (8-10 ft)', 'Normal Ceiling (8-10 ft)', NULL, NULL, NULL, 2),
((SELECT id FROM service_categories WHERE slug = 'fan-installation'), 2, 'fan_height', 'Fan height', 'SINGLE', FALSE, 'High Ceiling (Above 10 ft)', 'High Ceiling (Above 10 ft)', NULL, NULL, NULL, 3),
((SELECT id FROM service_categories WHERE slug = 'fan-installation'), 2, 'existing_point', 'Existing electrical point available?', 'SINGLE', TRUE, 'Yes', 'Yes', NULL, NULL, NULL, 1),
((SELECT id FROM service_categories WHERE slug = 'fan-installation'), 2, 'existing_point', 'Existing electrical point available?', 'SINGLE', TRUE, 'No', 'No', NULL, NULL, NULL, 2),
((SELECT id FROM service_categories WHERE slug = 'fan-installation'), 2, 'requirements', 'Any additional requirements?', 'TEXT', FALSE, NULL, NULL, 'E.g. new wiring, regulator installation, old fan removal, etc.', NULL, NULL, 1),

((SELECT id FROM service_categories WHERE slug = 'fan-installation'), 3, 'add_ons', 'Add-on services', 'MULTI', FALSE, 'Regulator Installation', 'Regulator Installation', '₹250 / point', NULL, 25000, 1),
((SELECT id FROM service_categories WHERE slug = 'fan-installation'), 3, 'add_ons', 'Add-on services', 'MULTI', FALSE, 'Old Fan Removal', 'Old Fan Removal', '₹150 / fan', NULL, 15000, 2),
((SELECT id FROM service_categories WHERE slug = 'fan-installation'), 3, 'add_ons', 'Add-on services', 'MULTI', FALSE, 'New Electrical Point', 'New Electrical Point', '₹500 / point', NULL, 50000, 3),
((SELECT id FROM service_categories WHERE slug = 'fan-installation'), 3, 'add_ons', 'Add-on services', 'MULTI', FALSE, 'Wiring Extension', 'Wiring Extension', '₹80 / meter', NULL, 8000, 4),
((SELECT id FROM service_categories WHERE slug = 'fan-installation'), 3, 'add_ons', 'Add-on services', 'MULTI', FALSE, 'Safety Hook', 'Safety Hook', '₹100 / fan', NULL, 10000, 5),
((SELECT id FROM service_categories WHERE slug = 'fan-installation'), 3, 'add_ons', 'Add-on services', 'MULTI', FALSE, 'Ceiling Box Replacement', 'Ceiling Box Replacement', '₹200 / point', NULL, 20000, 6);

-- ===========================================================================
-- 3. SWITCH & SOCKET INSTALLATION
-- ===========================================================================
INSERT INTO service_options
    (category_id, step_no, question_key, question_text, input_type, required,
     option_value, option_label, option_hint, option_group, price_paise, sort_order)
VALUES
((SELECT id FROM service_categories WHERE slug = 'switch-socket-installation'), 1, 'installation_type', 'Choose the type of switches or sockets you want to install', 'SINGLE', TRUE, 'Modular Switches', 'Modular Switches', 'Havells, Legrand, Anchor, etc.', NULL, NULL, 1),
((SELECT id FROM service_categories WHERE slug = 'switch-socket-installation'), 1, 'installation_type', 'Choose the type of switches or sockets you want to install', 'SINGLE', TRUE, 'Standard Switches', 'Standard Switches', 'Regular switches', NULL, NULL, 2),
((SELECT id FROM service_categories WHERE slug = 'switch-socket-installation'), 1, 'installation_type', 'Choose the type of switches or sockets you want to install', 'SINGLE', TRUE, 'Socket Points', 'Socket Points', '5A / 6A / 16A sockets', NULL, NULL, 3),
((SELECT id FROM service_categories WHERE slug = 'switch-socket-installation'), 1, 'installation_type', 'Choose the type of switches or sockets you want to install', 'SINGLE', TRUE, 'Combined Switch + Socket', 'Combined Switch + Socket', 'Switch with socket', NULL, NULL, 4),
((SELECT id FROM service_categories WHERE slug = 'switch-socket-installation'), 1, 'installation_type', 'Choose the type of switches or sockets you want to install', 'SINGLE', TRUE, 'USB Charging Socket', 'USB Charging Socket', 'USB / Type-C', NULL, NULL, 5),
((SELECT id FROM service_categories WHERE slug = 'switch-socket-installation'), 1, 'installation_type', 'Choose the type of switches or sockets you want to install', 'SINGLE', TRUE, 'TV / Data / LAN Socket', 'TV / Data / LAN Socket', 'TV, Internet, Telephone', NULL, NULL, 6),
((SELECT id FROM service_categories WHERE slug = 'switch-socket-installation'), 1, 'installation_type', 'Choose the type of switches or sockets you want to install', 'SINGLE', TRUE, 'Smart Switches', 'Smart Switches', 'WiFi / App Controlled', NULL, NULL, 7),
((SELECT id FROM service_categories WHERE slug = 'switch-socket-installation'), 1, 'installation_type', 'Choose the type of switches or sockets you want to install', 'SINGLE', TRUE, 'Bell Switch', 'Bell Switch', 'For door bell', NULL, NULL, 8),

((SELECT id FROM service_categories WHERE slug = 'switch-socket-installation'), 2, 'number_of_points', 'Number of points', 'NUMBER', TRUE, NULL, NULL, NULL, NULL, NULL, 1),
((SELECT id FROM service_categories WHERE slug = 'switch-socket-installation'), 2, 'brand', 'Brand (optional)', 'SINGLE', FALSE, 'Havells', 'Havells', NULL, NULL, NULL, 1),
((SELECT id FROM service_categories WHERE slug = 'switch-socket-installation'), 2, 'brand', 'Brand (optional)', 'SINGLE', FALSE, 'Legrand', 'Legrand', NULL, NULL, NULL, 2),
((SELECT id FROM service_categories WHERE slug = 'switch-socket-installation'), 2, 'brand', 'Brand (optional)', 'SINGLE', FALSE, 'Anchor', 'Anchor', NULL, NULL, NULL, 3),
((SELECT id FROM service_categories WHERE slug = 'switch-socket-installation'), 2, 'brand', 'Brand (optional)', 'SINGLE', FALSE, 'Schneider Electric', 'Schneider Electric', NULL, NULL, NULL, 4),
((SELECT id FROM service_categories WHERE slug = 'switch-socket-installation'), 2, 'brand', 'Brand (optional)', 'SINGLE', FALSE, 'No preference', 'No preference', NULL, NULL, NULL, 5),
((SELECT id FROM service_categories WHERE slug = 'switch-socket-installation'), 2, 'installation_mode', 'Type of installation', 'SINGLE', TRUE, 'New Installation', 'New Installation', NULL, NULL, NULL, 1),
((SELECT id FROM service_categories WHERE slug = 'switch-socket-installation'), 2, 'installation_mode', 'Type of installation', 'SINGLE', TRUE, 'Replacement', 'Replacement', NULL, NULL, NULL, 2),
((SELECT id FROM service_categories WHERE slug = 'switch-socket-installation'), 2, 'rooms', 'Applicable rooms', 'MULTI', TRUE, 'Living Room', 'Living Room', NULL, NULL, NULL, 1),
((SELECT id FROM service_categories WHERE slug = 'switch-socket-installation'), 2, 'rooms', 'Applicable rooms', 'MULTI', TRUE, 'Bedroom', 'Bedroom', NULL, NULL, NULL, 2),
((SELECT id FROM service_categories WHERE slug = 'switch-socket-installation'), 2, 'rooms', 'Applicable rooms', 'MULTI', TRUE, 'Kitchen', 'Kitchen', NULL, NULL, NULL, 3),
((SELECT id FROM service_categories WHERE slug = 'switch-socket-installation'), 2, 'rooms', 'Applicable rooms', 'MULTI', TRUE, 'Master Bedroom', 'Master Bedroom', NULL, NULL, NULL, 4),
((SELECT id FROM service_categories WHERE slug = 'switch-socket-installation'), 2, 'rooms', 'Applicable rooms', 'MULTI', TRUE, 'Study Room', 'Study Room', NULL, NULL, NULL, 5),
((SELECT id FROM service_categories WHERE slug = 'switch-socket-installation'), 2, 'rooms', 'Applicable rooms', 'MULTI', TRUE, 'Dining Room', 'Dining Room', NULL, NULL, NULL, 6),
((SELECT id FROM service_categories WHERE slug = 'switch-socket-installation'), 2, 'rooms', 'Applicable rooms', 'MULTI', TRUE, 'Passage / Lobby', 'Passage / Lobby', NULL, NULL, NULL, 7),
((SELECT id FROM service_categories WHERE slug = 'switch-socket-installation'), 2, 'rooms', 'Applicable rooms', 'MULTI', TRUE, 'Other', 'Other', NULL, NULL, NULL, 8),
((SELECT id FROM service_categories WHERE slug = 'switch-socket-installation'), 2, 'requirements', 'Any specific requirements?', 'TEXT', FALSE, NULL, NULL, 'E.g. modular switch, colour, height, etc.', NULL, NULL, 1),

((SELECT id FROM service_categories WHERE slug = 'switch-socket-installation'), 3, 'add_ons', 'Add-on services', 'MULTI', FALSE, 'Old Switch Removal', 'Old Switch Removal', '₹50 / point', NULL, 5000, 1),
((SELECT id FROM service_categories WHERE slug = 'switch-socket-installation'), 3, 'add_ons', 'Add-on services', 'MULTI', FALSE, 'Wiring Extension', 'Wiring Extension', '₹80 / point', NULL, 8000, 2),
((SELECT id FROM service_categories WHERE slug = 'switch-socket-installation'), 3, 'add_ons', 'Add-on services', 'MULTI', FALSE, 'Switch Board Replacement', 'Switch Board Replacement', '₹150 / board', NULL, 15000, 3),
((SELECT id FROM service_categories WHERE slug = 'switch-socket-installation'), 3, 'add_ons', 'Add-on services', 'MULTI', FALSE, 'USB Charging Installation', 'USB Charging Installation', '₹350 / point', NULL, 35000, 4),
((SELECT id FROM service_categories WHERE slug = 'switch-socket-installation'), 3, 'add_ons', 'Add-on services', 'MULTI', FALSE, 'TV / Data Point Installation', 'TV / Data Point Installation', '₹500 / point', NULL, 50000, 5),
((SELECT id FROM service_categories WHERE slug = 'switch-socket-installation'), 3, 'add_ons', 'Add-on services', 'MULTI', FALSE, 'Smart Switch Setup', 'Smart Switch Setup', '₹600 / point', NULL, 60000, 6);

-- ===========================================================================
-- 4. WIRING & REWIRING SERVICES
-- ===========================================================================
INSERT INTO service_options
    (category_id, step_no, question_key, question_text, input_type, required,
     option_value, option_label, option_hint, option_group, price_paise, sort_order)
VALUES
((SELECT id FROM service_categories WHERE slug = 'wiring-rewiring-services'), 1, 'wiring_type', 'Choose the type of wiring service you need', 'SINGLE', TRUE, 'New Wiring Installation', 'New Wiring Installation', 'For new homes / under construction', NULL, NULL, 1),
((SELECT id FROM service_categories WHERE slug = 'wiring-rewiring-services'), 1, 'wiring_type', 'Choose the type of wiring service you need', 'SINGLE', TRUE, 'Rewiring (Old Wiring Replacement)', 'Rewiring (Old Wiring Replacement)', 'Replace old or damaged wiring', NULL, NULL, 2),
((SELECT id FROM service_categories WHERE slug = 'wiring-rewiring-services'), 1, 'wiring_type', 'Choose the type of wiring service you need', 'SINGLE', TRUE, 'Additional Wiring Point', 'Additional Wiring Point', 'Add new points & circuits', NULL, NULL, 3),
((SELECT id FROM service_categories WHERE slug = 'wiring-rewiring-services'), 1, 'wiring_type', 'Choose the type of wiring service you need', 'SINGLE', TRUE, 'Partial Wiring', 'Partial Wiring', 'For specific areas (e.g. kitchen, bedroom)', NULL, NULL, 4),
((SELECT id FROM service_categories WHERE slug = 'wiring-rewiring-services'), 1, 'wiring_type', 'Choose the type of wiring service you need', 'SINGLE', TRUE, 'Complete Home Wiring', 'Complete Home Wiring', 'Full home electrical wiring', NULL, NULL, 5),
((SELECT id FROM service_categories WHERE slug = 'wiring-rewiring-services'), 1, 'wiring_type', 'Choose the type of wiring service you need', 'SINGLE', TRUE, 'Commercial Wiring', 'Commercial Wiring', 'For office, shop, etc.', NULL, NULL, 6),

((SELECT id FROM service_categories WHERE slug = 'wiring-rewiring-services'), 2, 'property_type', 'Property type', 'SINGLE', TRUE, '1 BHK', '1 BHK', NULL, NULL, NULL, 1),
((SELECT id FROM service_categories WHERE slug = 'wiring-rewiring-services'), 2, 'property_type', 'Property type', 'SINGLE', TRUE, '2 BHK', '2 BHK', NULL, NULL, NULL, 2),
((SELECT id FROM service_categories WHERE slug = 'wiring-rewiring-services'), 2, 'property_type', 'Property type', 'SINGLE', TRUE, '3 BHK', '3 BHK', NULL, NULL, NULL, 3),
((SELECT id FROM service_categories WHERE slug = 'wiring-rewiring-services'), 2, 'property_type', 'Property type', 'SINGLE', TRUE, '4 BHK', '4 BHK', NULL, NULL, NULL, 4),
((SELECT id FROM service_categories WHERE slug = 'wiring-rewiring-services'), 2, 'property_type', 'Property type', 'SINGLE', TRUE, 'Villa', 'Villa', NULL, NULL, NULL, 5),
((SELECT id FROM service_categories WHERE slug = 'wiring-rewiring-services'), 2, 'property_size', 'Property size (approx.)', 'SINGLE', TRUE, 'Below 600 sq.ft.', 'Below 600 sq.ft.', NULL, NULL, NULL, 1),
((SELECT id FROM service_categories WHERE slug = 'wiring-rewiring-services'), 2, 'property_size', 'Property size (approx.)', 'SINGLE', TRUE, '600 - 1000 sq.ft.', '600 - 1000 sq.ft.', NULL, NULL, NULL, 2),
((SELECT id FROM service_categories WHERE slug = 'wiring-rewiring-services'), 2, 'property_size', 'Property size (approx.)', 'SINGLE', TRUE, '1000 - 1500 sq.ft.', '1000 - 1500 sq.ft.', NULL, NULL, NULL, 3),
((SELECT id FROM service_categories WHERE slug = 'wiring-rewiring-services'), 2, 'property_size', 'Property size (approx.)', 'SINGLE', TRUE, '1500 - 2500 sq.ft.', '1500 - 2500 sq.ft.', NULL, NULL, NULL, 4),
((SELECT id FROM service_categories WHERE slug = 'wiring-rewiring-services'), 2, 'property_size', 'Property size (approx.)', 'SINGLE', TRUE, 'Above 2500 sq.ft.', 'Above 2500 sq.ft.', NULL, NULL, NULL, 5),
((SELECT id FROM service_categories WHERE slug = 'wiring-rewiring-services'), 2, 'wiring_condition', 'Current wiring condition', 'SINGLE', FALSE, 'Very Old (10+ years)', 'Very Old (10+ years)', NULL, NULL, NULL, 1),
((SELECT id FROM service_categories WHERE slug = 'wiring-rewiring-services'), 2, 'wiring_condition', 'Current wiring condition', 'SINGLE', FALSE, 'Damaged / Faulty', 'Damaged / Faulty', NULL, NULL, NULL, 2),
((SELECT id FROM service_categories WHERE slug = 'wiring-rewiring-services'), 2, 'wiring_condition', 'Current wiring condition', 'SINGLE', FALSE, 'Needs Upgrade', 'Needs Upgrade', NULL, NULL, NULL, 3),
((SELECT id FROM service_categories WHERE slug = 'wiring-rewiring-services'), 2, 'wiring_condition', 'Current wiring condition', 'SINGLE', FALSE, 'Not Sure', 'Not Sure', NULL, NULL, NULL, 4),
((SELECT id FROM service_categories WHERE slug = 'wiring-rewiring-services'), 2, 'wiring_style', 'Type of wiring', 'SINGLE', TRUE, 'Concealed (inside wall)', 'Concealed (inside wall)', NULL, NULL, NULL, 1),
((SELECT id FROM service_categories WHERE slug = 'wiring-rewiring-services'), 2, 'wiring_style', 'Type of wiring', 'SINGLE', TRUE, 'Surface (with casing)', 'Surface (with casing)', NULL, NULL, NULL, 2),
((SELECT id FROM service_categories WHERE slug = 'wiring-rewiring-services'), 2, 'requirements', 'Any specific requirements?', 'TEXT', FALSE, NULL, NULL, 'E.g. brand preference, extra points, inverter wiring, etc.', NULL, NULL, 1),

((SELECT id FROM service_categories WHERE slug = 'wiring-rewiring-services'), 3, 'add_ons', 'Add-on services', 'MULTI', FALSE, 'Extra Wiring Point', 'Extra Wiring Point', '₹350 / point', NULL, 35000, 1),
((SELECT id FROM service_categories WHERE slug = 'wiring-rewiring-services'), 3, 'add_ons', 'Add-on services', 'MULTI', FALSE, 'Conduit Piping', 'Conduit Piping', '₹80 / meter', NULL, 8000, 2),
((SELECT id FROM service_categories WHERE slug = 'wiring-rewiring-services'), 3, 'add_ons', 'Add-on services', 'MULTI', FALSE, 'Inverter / UPS Wiring', 'Inverter / UPS Wiring', '₹600 / point', NULL, 60000, 3),
((SELECT id FROM service_categories WHERE slug = 'wiring-rewiring-services'), 3, 'add_ons', 'Add-on services', 'MULTI', FALSE, 'MCB / DB Upgrade', 'MCB / DB Upgrade', '₹1,200 / unit', NULL, 120000, 4),
((SELECT id FROM service_categories WHERE slug = 'wiring-rewiring-services'), 3, 'add_ons', 'Add-on services', 'MULTI', FALSE, 'Earthing Installation', 'Earthing Installation', '₹800 / point', NULL, 80000, 5),
((SELECT id FROM service_categories WHERE slug = 'wiring-rewiring-services'), 3, 'add_ons', 'Add-on services', 'MULTI', FALSE, 'Wall Cutting & Patching', 'Wall Cutting & Patching', '₹250 / point', NULL, 25000, 6);

-- ===========================================================================
-- 5. ELECTRICAL REPAIR SERVICES
-- ===========================================================================
INSERT INTO service_options
    (category_id, step_no, question_key, question_text, input_type, required,
     option_value, option_label, option_hint, option_group, price_paise, sort_order)
VALUES
((SELECT id FROM service_categories WHERE slug = 'electrical-repair-services'), 1, 'issue_type', 'Choose the electrical issue you are facing', 'SINGLE', TRUE, 'Light Not Working', 'Light Not Working', 'Bulb, holder or wiring issue', NULL, NULL, 1),
((SELECT id FROM service_categories WHERE slug = 'electrical-repair-services'), 1, 'issue_type', 'Choose the electrical issue you are facing', 'SINGLE', TRUE, 'Switch / Socket Not Working', 'Switch / Socket Not Working', 'Loose, damaged or no power', NULL, NULL, 2),
((SELECT id FROM service_categories WHERE slug = 'electrical-repair-services'), 1, 'issue_type', 'Choose the electrical issue you are facing', 'SINGLE', TRUE, 'Fan Not Working', 'Fan Not Working', 'Ceiling or exhaust fan issue', NULL, NULL, 3),
((SELECT id FROM service_categories WHERE slug = 'electrical-repair-services'), 1, 'issue_type', 'Choose the electrical issue you are facing', 'SINGLE', TRUE, 'Power Tripping', 'Power Tripping', 'MCB keeps tripping', NULL, NULL, 4),
((SELECT id FROM service_categories WHERE slug = 'electrical-repair-services'), 1, 'issue_type', 'Choose the electrical issue you are facing', 'SINGLE', TRUE, 'Short Circuit', 'Short Circuit', 'Sparking or burning smell', NULL, NULL, 5),
((SELECT id FROM service_categories WHERE slug = 'electrical-repair-services'), 1, 'issue_type', 'Choose the electrical issue you are facing', 'SINGLE', TRUE, 'Wiring Fault', 'Wiring Fault', 'Loose or damaged wiring', NULL, NULL, 6),
((SELECT id FROM service_categories WHERE slug = 'electrical-repair-services'), 1, 'issue_type', 'Choose the electrical issue you are facing', 'SINGLE', TRUE, 'Other Electrical Issue', 'Other Electrical Issue', 'Any other problem', NULL, NULL, 7),

((SELECT id FROM service_categories WHERE slug = 'electrical-repair-services'), 2, 'issue_location', 'Where is the issue?', 'SINGLE', TRUE, 'Living Room', 'Living Room', NULL, NULL, NULL, 1),
((SELECT id FROM service_categories WHERE slug = 'electrical-repair-services'), 2, 'issue_location', 'Where is the issue?', 'SINGLE', TRUE, 'Bedroom', 'Bedroom', NULL, NULL, NULL, 2),
((SELECT id FROM service_categories WHERE slug = 'electrical-repair-services'), 2, 'issue_location', 'Where is the issue?', 'SINGLE', TRUE, 'Kitchen', 'Kitchen', NULL, NULL, NULL, 3),
((SELECT id FROM service_categories WHERE slug = 'electrical-repair-services'), 2, 'issue_location', 'Where is the issue?', 'SINGLE', TRUE, 'Bathroom / Toilet', 'Bathroom / Toilet', NULL, NULL, NULL, 4),
((SELECT id FROM service_categories WHERE slug = 'electrical-repair-services'), 2, 'issue_location', 'Where is the issue?', 'SINGLE', TRUE, 'Balcony', 'Balcony', NULL, NULL, NULL, 5),
((SELECT id FROM service_categories WHERE slug = 'electrical-repair-services'), 2, 'issue_location', 'Where is the issue?', 'SINGLE', TRUE, 'Whole House', 'Whole House', NULL, NULL, NULL, 6),
((SELECT id FROM service_categories WHERE slug = 'electrical-repair-services'), 2, 'issue_location', 'Where is the issue?', 'SINGLE', TRUE, 'Other', 'Other', NULL, NULL, NULL, 7),
((SELECT id FROM service_categories WHERE slug = 'electrical-repair-services'), 2, 'issue_description', 'Describe the issue', 'TEXT', TRUE, NULL, NULL, 'E.g. light not turning on, switch is loose, sparking, etc.', NULL, NULL, 1),
((SELECT id FROM service_categories WHERE slug = 'electrical-repair-services'), 2, 'issue_duration', 'How long has this issue been there?', 'SINGLE', FALSE, 'Just Started (Today)', 'Just Started (Today)', NULL, NULL, NULL, 1),
((SELECT id FROM service_categories WHERE slug = 'electrical-repair-services'), 2, 'issue_duration', 'How long has this issue been there?', 'SINGLE', FALSE, '1-3 Days', '1-3 Days', NULL, NULL, NULL, 2),
((SELECT id FROM service_categories WHERE slug = 'electrical-repair-services'), 2, 'issue_duration', 'How long has this issue been there?', 'SINGLE', FALSE, 'About a Week', 'About a Week', NULL, NULL, NULL, 3),
((SELECT id FROM service_categories WHERE slug = 'electrical-repair-services'), 2, 'issue_duration', 'How long has this issue been there?', 'SINGLE', FALSE, 'More Than a Week', 'More Than a Week', NULL, NULL, NULL, 4),
((SELECT id FROM service_categories WHERE slug = 'electrical-repair-services'), 2, 'preference', 'Any specific preference?', 'TEXT', FALSE, NULL, NULL, 'E.g. bring spare parts, check full circuit, etc.', NULL, NULL, 1),

((SELECT id FROM service_categories WHERE slug = 'electrical-repair-services'), 3, 'add_ons', 'Add-on services', 'MULTI', FALSE, 'Replace Switch / Socket', 'Replace Switch / Socket', '₹150 / point', NULL, 15000, 1),
((SELECT id FROM service_categories WHERE slug = 'electrical-repair-services'), 3, 'add_ons', 'Add-on services', 'MULTI', FALSE, 'Replace LED Bulb', 'Replace LED Bulb', '₹100 / bulb', NULL, 10000, 2),
((SELECT id FROM service_categories WHERE slug = 'electrical-repair-services'), 3, 'add_ons', 'Add-on services', 'MULTI', FALSE, 'Fix Fan Regulator', 'Fix Fan Regulator', '₹250 / point', NULL, 25000, 3),
((SELECT id FROM service_categories WHERE slug = 'electrical-repair-services'), 3, 'add_ons', 'Add-on services', 'MULTI', FALSE, 'Replace MCB', 'Replace MCB', '₹450 / unit', NULL, 45000, 4),
((SELECT id FROM service_categories WHERE slug = 'electrical-repair-services'), 3, 'add_ons', 'Add-on services', 'MULTI', FALSE, 'Repair / Replace Wiring', 'Repair / Replace Wiring', '₹350 / point', NULL, 35000, 5),
((SELECT id FROM service_categories WHERE slug = 'electrical-repair-services'), 3, 'add_ons', 'Add-on services', 'MULTI', FALSE, 'Install New Holder', 'Install New Holder', '₹100 / point', NULL, 10000, 6),

((SELECT id FROM service_categories WHERE slug = 'electrical-repair-services'), 4, 'files', 'Upload photos (optional)', 'FILE', FALSE, NULL, NULL, NULL, NULL, NULL, 1);

-- ===========================================================================
-- 6. MCB & DB INSTALLATION
-- ===========================================================================
INSERT INTO service_options
    (category_id, step_no, question_key, question_text, input_type, required,
     option_value, option_label, option_hint, option_group, price_paise, sort_order)
VALUES
((SELECT id FROM service_categories WHERE slug = 'mcb-db-installation'), 1, 'product_type', 'Choose the MCB/DB type you want to install', 'SINGLE', TRUE, 'Single MCB Installation', 'Single MCB Installation', 'For individual circuits (lighting, sockets, etc.)', NULL, NULL, 1),
((SELECT id FROM service_categories WHERE slug = 'mcb-db-installation'), 1, 'product_type', 'Choose the MCB/DB type you want to install', 'SINGLE', TRUE, 'RCCB / ELCB Installation', 'RCCB / ELCB Installation', 'For shock protection (earth leakage)', NULL, NULL, 2),
((SELECT id FROM service_categories WHERE slug = 'mcb-db-installation'), 1, 'product_type', 'Choose the MCB/DB type you want to install', 'SINGLE', TRUE, 'MCB Distribution Board (DB) Installation', 'MCB Distribution Board (DB) Installation', 'For complete home', NULL, NULL, 3),
((SELECT id FROM service_categories WHERE slug = 'mcb-db-installation'), 1, 'product_type', 'Choose the MCB/DB type you want to install', 'SINGLE', TRUE, 'Upgrade Existing DB', 'Upgrade Existing DB', 'Replace old DB with new and safer system', NULL, NULL, 4),
((SELECT id FROM service_categories WHERE slug = 'mcb-db-installation'), 1, 'product_type', 'Choose the MCB/DB type you want to install', 'SINGLE', TRUE, 'SPN / TPN DB Installation', 'SPN / TPN DB Installation', 'For larger homes / commercial', NULL, NULL, 5),
((SELECT id FROM service_categories WHERE slug = 'mcb-db-installation'), 1, 'product_type', 'Choose the MCB/DB type you want to install', 'SINGLE', TRUE, 'MCB with Surge Protection', 'MCB with Surge Protection', 'For extra safety', NULL, NULL, 6),

((SELECT id FROM service_categories WHERE slug = 'mcb-db-installation'), 2, 'number_of_mcbs', 'Number of MCBs', 'NUMBER', TRUE, NULL, NULL, NULL, NULL, NULL, 1),
((SELECT id FROM service_categories WHERE slug = 'mcb-db-installation'), 2, 'db_type', 'DB type', 'SINGLE', TRUE, 'Single Phase (SPN)', 'Single Phase (SPN)', NULL, NULL, NULL, 1),
((SELECT id FROM service_categories WHERE slug = 'mcb-db-installation'), 2, 'db_type', 'DB type', 'SINGLE', TRUE, 'Three Phase (TPN)', 'Three Phase (TPN)', NULL, NULL, NULL, 2),
((SELECT id FROM service_categories WHERE slug = 'mcb-db-installation'), 2, 'brand', 'Brand (optional)', 'SINGLE', FALSE, 'Schneider Electric', 'Schneider Electric', NULL, NULL, NULL, 1),
((SELECT id FROM service_categories WHERE slug = 'mcb-db-installation'), 2, 'brand', 'Brand (optional)', 'SINGLE', FALSE, 'Havells', 'Havells', NULL, NULL, NULL, 2),
((SELECT id FROM service_categories WHERE slug = 'mcb-db-installation'), 2, 'brand', 'Brand (optional)', 'SINGLE', FALSE, 'Legrand', 'Legrand', NULL, NULL, NULL, 3),
((SELECT id FROM service_categories WHERE slug = 'mcb-db-installation'), 2, 'brand', 'Brand (optional)', 'SINGLE', FALSE, 'Siemens', 'Siemens', NULL, NULL, NULL, 4),
((SELECT id FROM service_categories WHERE slug = 'mcb-db-installation'), 2, 'brand', 'Brand (optional)', 'SINGLE', FALSE, 'ABB', 'ABB', NULL, NULL, NULL, 5),
((SELECT id FROM service_categories WHERE slug = 'mcb-db-installation'), 2, 'brand', 'Brand (optional)', 'SINGLE', FALSE, 'L&T', 'L&T', NULL, NULL, NULL, 6),
((SELECT id FROM service_categories WHERE slug = 'mcb-db-installation'), 2, 'existing_db', 'Existing DB available?', 'SINGLE', TRUE, 'Yes', 'Yes', NULL, NULL, NULL, 1),
((SELECT id FROM service_categories WHERE slug = 'mcb-db-installation'), 2, 'existing_db', 'Existing DB available?', 'SINGLE', TRUE, 'No', 'No', NULL, NULL, NULL, 2),
((SELECT id FROM service_categories WHERE slug = 'mcb-db-installation'), 2, 'installation_location', 'Installation location', 'SINGLE', TRUE, 'Living Room', 'Living Room', NULL, NULL, NULL, 1),
((SELECT id FROM service_categories WHERE slug = 'mcb-db-installation'), 2, 'installation_location', 'Installation location', 'SINGLE', TRUE, 'Kitchen', 'Kitchen', NULL, NULL, NULL, 2),
((SELECT id FROM service_categories WHERE slug = 'mcb-db-installation'), 2, 'installation_location', 'Installation location', 'SINGLE', TRUE, 'Passage / Meter Room', 'Passage / Meter Room', NULL, NULL, NULL, 3),
((SELECT id FROM service_categories WHERE slug = 'mcb-db-installation'), 2, 'installation_location', 'Installation location', 'SINGLE', TRUE, 'Other', 'Other', NULL, NULL, NULL, 4),
((SELECT id FROM service_categories WHERE slug = 'mcb-db-installation'), 2, 'requirements', 'Any specific requirements?', 'TEXT', FALSE, NULL, NULL, 'E.g. replace old DB, add RCCB, surge protection, etc.', NULL, NULL, 1),

((SELECT id FROM service_categories WHERE slug = 'mcb-db-installation'), 3, 'add_ons', 'Add-on services', 'MULTI', FALSE, 'RCCB Installation', 'RCCB Installation', '₹800 / unit', NULL, 80000, 1),
((SELECT id FROM service_categories WHERE slug = 'mcb-db-installation'), 3, 'add_ons', 'Add-on services', 'MULTI', FALSE, 'Surge Protection Device', 'Surge Protection Device', '₹1,200 / unit', NULL, 120000, 2),
((SELECT id FROM service_categories WHERE slug = 'mcb-db-installation'), 3, 'add_ons', 'Add-on services', 'MULTI', FALSE, 'Additional MCB', 'Additional MCB', '₹250 / unit', NULL, 25000, 3),
((SELECT id FROM service_categories WHERE slug = 'mcb-db-installation'), 3, 'add_ons', 'Add-on services', 'MULTI', FALSE, 'Neutral Link / Busbar', 'Neutral Link / Busbar', '₹350 / unit', NULL, 35000, 4),
((SELECT id FROM service_categories WHERE slug = 'mcb-db-installation'), 3, 'add_ons', 'Add-on services', 'MULTI', FALSE, 'Earthing Connection', 'Earthing Connection', '₹500 / point', NULL, 50000, 5),
((SELECT id FROM service_categories WHERE slug = 'mcb-db-installation'), 3, 'add_ons', 'Add-on services', 'MULTI', FALSE, 'Old DB Removal', 'Old DB Removal', '₹600 / unit', NULL, 60000, 6);

-- ===========================================================================
-- 7. APPLIANCE INSTALLATION SERVICES
-- ===========================================================================
INSERT INTO service_options
    (category_id, step_no, question_key, question_text, input_type, required,
     option_value, option_label, option_hint, option_group, price_paise, sort_order)
VALUES
((SELECT id FROM service_categories WHERE slug = 'appliance-installation-services'), 1, 'appliance_type', 'Choose the appliance you want to install', 'SINGLE', TRUE, 'Air Conditioner (AC)', 'Air Conditioner (AC)', 'Split AC, Window AC', NULL, NULL, 1),
((SELECT id FROM service_categories WHERE slug = 'appliance-installation-services'), 1, 'appliance_type', 'Choose the appliance you want to install', 'SINGLE', TRUE, 'Geyser / Water Heater', 'Geyser / Water Heater', 'Instant & storage geyser', NULL, NULL, 2),
((SELECT id FROM service_categories WHERE slug = 'appliance-installation-services'), 1, 'appliance_type', 'Choose the appliance you want to install', 'SINGLE', TRUE, 'Chimney', 'Chimney', 'Kitchen chimney & exhaust', NULL, NULL, 3),
((SELECT id FROM service_categories WHERE slug = 'appliance-installation-services'), 1, 'appliance_type', 'Choose the appliance you want to install', 'SINGLE', TRUE, 'Washing Machine', 'Washing Machine', 'Front load & top load', NULL, NULL, 4),
((SELECT id FROM service_categories WHERE slug = 'appliance-installation-services'), 1, 'appliance_type', 'Choose the appliance you want to install', 'SINGLE', TRUE, 'Refrigerator', 'Refrigerator', 'Single & double door', NULL, NULL, 5),
((SELECT id FROM service_categories WHERE slug = 'appliance-installation-services'), 1, 'appliance_type', 'Choose the appliance you want to install', 'SINGLE', TRUE, 'Microwave Oven', 'Microwave Oven', 'OTG & microwave', NULL, NULL, 6),
((SELECT id FROM service_categories WHERE slug = 'appliance-installation-services'), 1, 'appliance_type', 'Choose the appliance you want to install', 'SINGLE', TRUE, 'Water Purifier', 'Water Purifier', 'RO / UV / UF', NULL, NULL, 7),
((SELECT id FROM service_categories WHERE slug = 'appliance-installation-services'), 1, 'appliance_type', 'Choose the appliance you want to install', 'SINGLE', TRUE, 'Other Appliance', 'Other Appliance', 'Please specify', NULL, NULL, 8),

((SELECT id FROM service_categories WHERE slug = 'appliance-installation-services'), 2, 'brand', 'Brand (optional)', 'TEXT', FALSE, NULL, NULL, 'E.g. Daikin, LG, Samsung, Voltas, etc.', NULL, NULL, 1),
((SELECT id FROM service_categories WHERE slug = 'appliance-installation-services'), 2, 'model', 'Model (optional)', 'TEXT', FALSE, NULL, NULL, 'E.g. FTKM50UV16', NULL, NULL, 1),
((SELECT id FROM service_categories WHERE slug = 'appliance-installation-services'), 2, 'installation_location', 'Installation location', 'SINGLE', TRUE, 'Living Room', 'Living Room', NULL, NULL, NULL, 1),
((SELECT id FROM service_categories WHERE slug = 'appliance-installation-services'), 2, 'installation_location', 'Installation location', 'SINGLE', TRUE, 'Bedroom', 'Bedroom', NULL, NULL, NULL, 2),
((SELECT id FROM service_categories WHERE slug = 'appliance-installation-services'), 2, 'installation_location', 'Installation location', 'SINGLE', TRUE, 'Kitchen', 'Kitchen', NULL, NULL, NULL, 3),
((SELECT id FROM service_categories WHERE slug = 'appliance-installation-services'), 2, 'installation_location', 'Installation location', 'SINGLE', TRUE, 'Balcony / Utility', 'Balcony / Utility', NULL, NULL, NULL, 4),
((SELECT id FROM service_categories WHERE slug = 'appliance-installation-services'), 2, 'installation_location', 'Installation location', 'SINGLE', TRUE, 'Other', 'Other', NULL, NULL, NULL, 5),
((SELECT id FROM service_categories WHERE slug = 'appliance-installation-services'), 2, 'installation_mode', 'Is this a new installation or reinstallation?', 'SINGLE', TRUE, 'New Installation', 'New Installation', NULL, NULL, NULL, 1),
((SELECT id FROM service_categories WHERE slug = 'appliance-installation-services'), 2, 'installation_mode', 'Is this a new installation or reinstallation?', 'SINGLE', TRUE, 'Reinstallation', 'Reinstallation', NULL, NULL, NULL, 2),
((SELECT id FROM service_categories WHERE slug = 'appliance-installation-services'), 2, 'requirements', 'Additional requirements', 'TEXT', FALSE, NULL, NULL, 'E.g. wall mounting, outdoor unit setup, drilling, etc.', NULL, NULL, 1),

((SELECT id FROM service_categories WHERE slug = 'appliance-installation-services'), 3, 'add_ons', 'Add-on services', 'MULTI', FALSE, 'Additional Electrical Point', 'Additional Electrical Point', '₹300 / point', NULL, 30000, 1),
((SELECT id FROM service_categories WHERE slug = 'appliance-installation-services'), 3, 'add_ons', 'Add-on services', 'MULTI', FALSE, 'Stabilizer Installation', 'Stabilizer Installation', '₹500 / unit', NULL, 50000, 2),
((SELECT id FROM service_categories WHERE slug = 'appliance-installation-services'), 3, 'add_ons', 'Add-on services', 'MULTI', FALSE, 'Outdoor Unit Fixing', 'Outdoor Unit Fixing', '₹400 / unit', NULL, 40000, 3),
((SELECT id FROM service_categories WHERE slug = 'appliance-installation-services'), 3, 'add_ons', 'Add-on services', 'MULTI', FALSE, 'Piping Extension', 'Piping Extension', '₹250 / meter', NULL, 25000, 4),
((SELECT id FROM service_categories WHERE slug = 'appliance-installation-services'), 3, 'add_ons', 'Add-on services', 'MULTI', FALSE, 'Drilling (Concrete Wall)', 'Drilling (Concrete Wall)', '₹200 / point', NULL, 20000, 5),
((SELECT id FROM service_categories WHERE slug = 'appliance-installation-services'), 3, 'add_ons', 'Add-on services', 'MULTI', FALSE, 'Old Appliance Removal', 'Old Appliance Removal', '₹300 / unit', NULL, 30000, 6),

((SELECT id FROM service_categories WHERE slug = 'appliance-installation-services'), 4, 'files', 'Upload photos (optional)', 'FILE', FALSE, NULL, NULL, NULL, NULL, NULL, 1);
