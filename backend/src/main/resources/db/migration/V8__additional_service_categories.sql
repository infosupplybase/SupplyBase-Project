-- ---------------------------------------------------------------------------
-- SIX MORE BOOKABLE CATEGORIES
--
-- V5 seeded exactly four categories on purpose (the four trades with an
-- instant, fixed-price site-visit booking flow). The marketing site's
-- Services page (frontend/src/data/services.js) always listed ten, and links
-- every one of them to this same booking flow — so the other six 404'd on
-- GET /api/catalogue/services/{slug}/form. This migration adds those six as
-- real bookable categories, matching the ten marketing slugs exactly.
--
-- Same shape as V6: step 1 is always "what do you need" (MULTI, required),
-- step 2 is always property type (SINGLE, required) — the rest varies by
-- trade, then files and notes close every form.
-- ---------------------------------------------------------------------------

INSERT INTO service_categories (slug, name, tagline, description, icon, visit_fee_paise, sort_order) VALUES
('architectural-design', 'Architectural & Design',
 'Plan it properly before you build it.',
 'Complete architectural planning, 2D drawings and photo-real 3D visualisation.',
 'architectural-design', 2500, 5),
('civil-construction', 'Civil Construction',
 'Structure built to last.',
 'New construction, RCC work, brickwork, plaster, flooring and waterproofing.',
 'civil-construction', 2500, 6),
('pop-false-ceiling', 'POP & False Ceiling',
 'Ceilings that carry the lighting design.',
 'POP, gypsum and designer false ceilings with cove and LED lighting.',
 'pop-false-ceiling', 2500, 7),
('furniture', 'Furniture Work',
 'Built to your dimensions.',
 'Modular kitchens, wardrobes, TV units, beds and custom office furniture.',
 'furniture', 2500, 8),
('fabrication', 'Fabrication',
 'Steel work, measured and made.',
 'MS and SS fabrication — gates, railings, grills, staircases, sheds and structures.',
 'fabrication', 2500, 9),
('finishing', 'Finishing Work',
 'The details people actually notice.',
 'Flooring, marble and granite, tile work, doors, windows and final touch-up.',
 'finishing', 2500, 10);

-- ===========================================================================
-- architectural-design
-- ===========================================================================
INSERT INTO service_options
    (category_id, step_no, question_key, question_text, input_type, required,
     option_value, option_label, option_hint, option_group, sort_order)
VALUES
((SELECT id FROM service_categories WHERE slug = 'architectural-design'), 1, 'service_needed', 'What design service do you need?', 'MULTI', TRUE, 'Architectural Planning', 'Architectural Planning', NULL, NULL, 1),
((SELECT id FROM service_categories WHERE slug = 'architectural-design'), 1, 'service_needed', 'What design service do you need?', 'MULTI', TRUE, '2D Floor Plans', '2D Floor Plans', NULL, NULL, 2),
((SELECT id FROM service_categories WHERE slug = 'architectural-design'), 1, 'service_needed', 'What design service do you need?', 'MULTI', TRUE, '3D Architectural Design', '3D Architectural Design', NULL, NULL, 3),
((SELECT id FROM service_categories WHERE slug = 'architectural-design'), 1, 'service_needed', 'What design service do you need?', 'MULTI', TRUE, '3D Exterior Design', '3D Exterior Design', NULL, NULL, 4),
((SELECT id FROM service_categories WHERE slug = 'architectural-design'), 1, 'service_needed', 'What design service do you need?', 'MULTI', TRUE, '3D Interior Design', '3D Interior Design', NULL, NULL, 5),
((SELECT id FROM service_categories WHERE slug = 'architectural-design'), 1, 'service_needed', 'What design service do you need?', 'MULTI', TRUE, 'Elevation Design', 'Elevation Design', NULL, NULL, 6),
((SELECT id FROM service_categories WHERE slug = 'architectural-design'), 1, 'service_needed', 'What design service do you need?', 'MULTI', TRUE, 'Structural Drawings', 'Structural Drawings', NULL, NULL, 7),
((SELECT id FROM service_categories WHERE slug = 'architectural-design'), 1, 'service_needed', 'What design service do you need?', 'MULTI', TRUE, 'Working Drawings', 'Working Drawings', NULL, NULL, 8),
((SELECT id FROM service_categories WHERE slug = 'architectural-design'), 1, 'service_needed', 'What design service do you need?', 'MULTI', TRUE, 'Other', 'Other', NULL, NULL, 9),
((SELECT id FROM service_categories WHERE slug = 'architectural-design'), 2, 'property_type', 'What kind of property is it?', 'SINGLE', TRUE, '1 BHK', '1 BHK', NULL, NULL, 1),
((SELECT id FROM service_categories WHERE slug = 'architectural-design'), 2, 'property_type', 'What kind of property is it?', 'SINGLE', TRUE, '2 BHK', '2 BHK', NULL, NULL, 2),
((SELECT id FROM service_categories WHERE slug = 'architectural-design'), 2, 'property_type', 'What kind of property is it?', 'SINGLE', TRUE, '3 BHK', '3 BHK', NULL, NULL, 3),
((SELECT id FROM service_categories WHERE slug = 'architectural-design'), 2, 'property_type', 'What kind of property is it?', 'SINGLE', TRUE, '4 BHK+', '4 BHK+', NULL, NULL, 4),
((SELECT id FROM service_categories WHERE slug = 'architectural-design'), 2, 'property_type', 'What kind of property is it?', 'SINGLE', TRUE, 'Villa / Bungalow', 'Villa / Bungalow', NULL, NULL, 5),
((SELECT id FROM service_categories WHERE slug = 'architectural-design'), 2, 'property_type', 'What kind of property is it?', 'SINGLE', TRUE, 'Office', 'Office', NULL, NULL, 6),
((SELECT id FROM service_categories WHERE slug = 'architectural-design'), 2, 'property_type', 'What kind of property is it?', 'SINGLE', TRUE, 'Shop', 'Shop', NULL, NULL, 7),
((SELECT id FROM service_categories WHERE slug = 'architectural-design'), 2, 'property_type', 'What kind of property is it?', 'SINGLE', TRUE, 'Commercial', 'Commercial', NULL, NULL, 8),
((SELECT id FROM service_categories WHERE slug = 'architectural-design'), 2, 'property_type', 'What kind of property is it?', 'SINGLE', TRUE, 'Building / Society', 'Building / Society', NULL, NULL, 9),
((SELECT id FROM service_categories WHERE slug = 'architectural-design'), 2, 'property_type', 'What kind of property is it?', 'SINGLE', TRUE, 'Other', 'Other', NULL, NULL, 10),
((SELECT id FROM service_categories WHERE slug = 'architectural-design'), 3, 'project_stage', 'What stage is the project at?', 'SINGLE', FALSE, 'New Plot / Land', 'New Plot / Land', NULL, NULL, 1),
((SELECT id FROM service_categories WHERE slug = 'architectural-design'), 3, 'project_stage', 'What stage is the project at?', 'SINGLE', FALSE, 'Existing Building - Renovation', 'Existing Building - Renovation', NULL, NULL, 2),
((SELECT id FROM service_categories WHERE slug = 'architectural-design'), 3, 'project_stage', 'What stage is the project at?', 'SINGLE', FALSE, 'Under Construction', 'Under Construction', NULL, NULL, 3),
((SELECT id FROM service_categories WHERE slug = 'architectural-design'), 3, 'project_stage', 'What stage is the project at?', 'SINGLE', FALSE, 'Not Sure', 'Not Sure', NULL, NULL, 4),
((SELECT id FROM service_categories WHERE slug = 'architectural-design'), 4, 'plot_area_sqft', 'Approximate plot / built-up area (sq. ft.)', 'NUMBER', FALSE, NULL, NULL, NULL, NULL, 1),
((SELECT id FROM service_categories WHERE slug = 'architectural-design'), 5, 'files', 'Upload photos, plans or reference images', 'FILE', FALSE, NULL, NULL, NULL, NULL, 1),
((SELECT id FROM service_categories WHERE slug = 'architectural-design'), 6, 'notes', 'Tell us anything else about your project.', 'TEXT', FALSE, NULL, NULL, NULL, NULL, 1),

-- ===========================================================================
-- civil-construction
-- ===========================================================================
((SELECT id FROM service_categories WHERE slug = 'civil-construction'), 1, 'service_needed', 'What construction service do you need?', 'MULTI', TRUE, 'New Construction', 'New Construction', NULL, NULL, 1),
((SELECT id FROM service_categories WHERE slug = 'civil-construction'), 1, 'service_needed', 'What construction service do you need?', 'MULTI', TRUE, 'RCC Work', 'RCC Work', NULL, NULL, 2),
((SELECT id FROM service_categories WHERE slug = 'civil-construction'), 1, 'service_needed', 'What construction service do you need?', 'MULTI', TRUE, 'Brickwork', 'Brickwork', NULL, NULL, 3),
((SELECT id FROM service_categories WHERE slug = 'civil-construction'), 1, 'service_needed', 'What construction service do you need?', 'MULTI', TRUE, 'Plaster Work', 'Plaster Work', NULL, NULL, 4),
((SELECT id FROM service_categories WHERE slug = 'civil-construction'), 1, 'service_needed', 'What construction service do you need?', 'MULTI', TRUE, 'Flooring', 'Flooring', NULL, NULL, 5),
((SELECT id FROM service_categories WHERE slug = 'civil-construction'), 1, 'service_needed', 'What construction service do you need?', 'MULTI', TRUE, 'Tiling', 'Tiling', NULL, NULL, 6),
((SELECT id FROM service_categories WHERE slug = 'civil-construction'), 1, 'service_needed', 'What construction service do you need?', 'MULTI', TRUE, 'Waterproofing', 'Waterproofing', NULL, NULL, 7),
((SELECT id FROM service_categories WHERE slug = 'civil-construction'), 1, 'service_needed', 'What construction service do you need?', 'MULTI', TRUE, 'Repair & Renovation', 'Repair & Renovation', NULL, NULL, 8),
((SELECT id FROM service_categories WHERE slug = 'civil-construction'), 1, 'service_needed', 'What construction service do you need?', 'MULTI', TRUE, 'Other', 'Other', NULL, NULL, 9),
((SELECT id FROM service_categories WHERE slug = 'civil-construction'), 2, 'property_type', 'What kind of property is it?', 'SINGLE', TRUE, '1 BHK', '1 BHK', NULL, NULL, 1),
((SELECT id FROM service_categories WHERE slug = 'civil-construction'), 2, 'property_type', 'What kind of property is it?', 'SINGLE', TRUE, '2 BHK', '2 BHK', NULL, NULL, 2),
((SELECT id FROM service_categories WHERE slug = 'civil-construction'), 2, 'property_type', 'What kind of property is it?', 'SINGLE', TRUE, '3 BHK', '3 BHK', NULL, NULL, 3),
((SELECT id FROM service_categories WHERE slug = 'civil-construction'), 2, 'property_type', 'What kind of property is it?', 'SINGLE', TRUE, '4 BHK+', '4 BHK+', NULL, NULL, 4),
((SELECT id FROM service_categories WHERE slug = 'civil-construction'), 2, 'property_type', 'What kind of property is it?', 'SINGLE', TRUE, 'Villa / Bungalow', 'Villa / Bungalow', NULL, NULL, 5),
((SELECT id FROM service_categories WHERE slug = 'civil-construction'), 2, 'property_type', 'What kind of property is it?', 'SINGLE', TRUE, 'Office', 'Office', NULL, NULL, 6),
((SELECT id FROM service_categories WHERE slug = 'civil-construction'), 2, 'property_type', 'What kind of property is it?', 'SINGLE', TRUE, 'Shop', 'Shop', NULL, NULL, 7),
((SELECT id FROM service_categories WHERE slug = 'civil-construction'), 2, 'property_type', 'What kind of property is it?', 'SINGLE', TRUE, 'Commercial', 'Commercial', NULL, NULL, 8),
((SELECT id FROM service_categories WHERE slug = 'civil-construction'), 2, 'property_type', 'What kind of property is it?', 'SINGLE', TRUE, 'Building / Society', 'Building / Society', NULL, NULL, 9),
((SELECT id FROM service_categories WHERE slug = 'civil-construction'), 2, 'property_type', 'What kind of property is it?', 'SINGLE', TRUE, 'Other', 'Other', NULL, NULL, 10),
((SELECT id FROM service_categories WHERE slug = 'civil-construction'), 3, 'project_stage', 'What stage is the project at?', 'SINGLE', FALSE, 'Not Started / Planning', 'Not Started / Planning', NULL, NULL, 1),
((SELECT id FROM service_categories WHERE slug = 'civil-construction'), 3, 'project_stage', 'What stage is the project at?', 'SINGLE', FALSE, 'Foundation Stage', 'Foundation Stage', NULL, NULL, 2),
((SELECT id FROM service_categories WHERE slug = 'civil-construction'), 3, 'project_stage', 'What stage is the project at?', 'SINGLE', FALSE, 'Structure Stage', 'Structure Stage', NULL, NULL, 3),
((SELECT id FROM service_categories WHERE slug = 'civil-construction'), 3, 'project_stage', 'What stage is the project at?', 'SINGLE', FALSE, 'Finishing Stage', 'Finishing Stage', NULL, NULL, 4),
((SELECT id FROM service_categories WHERE slug = 'civil-construction'), 3, 'project_stage', 'What stage is the project at?', 'SINGLE', FALSE, 'Renovation of Existing Building', 'Renovation of Existing Building', NULL, NULL, 5),
((SELECT id FROM service_categories WHERE slug = 'civil-construction'), 4, 'area_sqft', 'Approximate built-up area (sq. ft.)', 'NUMBER', FALSE, NULL, NULL, NULL, NULL, 1),
((SELECT id FROM service_categories WHERE slug = 'civil-construction'), 5, 'files', 'Upload photos, plans or site videos', 'FILE', FALSE, NULL, NULL, NULL, NULL, 1),
((SELECT id FROM service_categories WHERE slug = 'civil-construction'), 6, 'notes', 'Tell us anything else about your project.', 'TEXT', FALSE, NULL, NULL, NULL, NULL, 1),

-- ===========================================================================
-- pop-false-ceiling
-- ===========================================================================
((SELECT id FROM service_categories WHERE slug = 'pop-false-ceiling'), 1, 'service_needed', 'What ceiling service do you need?', 'MULTI', TRUE, 'POP Ceiling', 'POP Ceiling', NULL, NULL, 1),
((SELECT id FROM service_categories WHERE slug = 'pop-false-ceiling'), 1, 'service_needed', 'What ceiling service do you need?', 'MULTI', TRUE, 'Gypsum Ceiling', 'Gypsum Ceiling', NULL, NULL, 2),
((SELECT id FROM service_categories WHERE slug = 'pop-false-ceiling'), 1, 'service_needed', 'What ceiling service do you need?', 'MULTI', TRUE, 'False Ceiling', 'False Ceiling', NULL, NULL, 3),
((SELECT id FROM service_categories WHERE slug = 'pop-false-ceiling'), 1, 'service_needed', 'What ceiling service do you need?', 'MULTI', TRUE, 'Designer Ceiling', 'Designer Ceiling', NULL, NULL, 4),
((SELECT id FROM service_categories WHERE slug = 'pop-false-ceiling'), 1, 'service_needed', 'What ceiling service do you need?', 'MULTI', TRUE, 'Wall Moulding', 'Wall Moulding', NULL, NULL, 5),
((SELECT id FROM service_categories WHERE slug = 'pop-false-ceiling'), 1, 'service_needed', 'What ceiling service do you need?', 'MULTI', TRUE, 'Cornice', 'Cornice', NULL, NULL, 6),
((SELECT id FROM service_categories WHERE slug = 'pop-false-ceiling'), 1, 'service_needed', 'What ceiling service do you need?', 'MULTI', TRUE, 'Partition Work', 'Partition Work', NULL, NULL, 7),
((SELECT id FROM service_categories WHERE slug = 'pop-false-ceiling'), 1, 'service_needed', 'What ceiling service do you need?', 'MULTI', TRUE, 'LED Cove & Lighting', 'LED Cove & Lighting', NULL, NULL, 8),
((SELECT id FROM service_categories WHERE slug = 'pop-false-ceiling'), 1, 'service_needed', 'What ceiling service do you need?', 'MULTI', TRUE, 'Other', 'Other', NULL, NULL, 9),
((SELECT id FROM service_categories WHERE slug = 'pop-false-ceiling'), 2, 'property_type', 'What kind of property is it?', 'SINGLE', TRUE, '1 BHK', '1 BHK', NULL, NULL, 1),
((SELECT id FROM service_categories WHERE slug = 'pop-false-ceiling'), 2, 'property_type', 'What kind of property is it?', 'SINGLE', TRUE, '2 BHK', '2 BHK', NULL, NULL, 2),
((SELECT id FROM service_categories WHERE slug = 'pop-false-ceiling'), 2, 'property_type', 'What kind of property is it?', 'SINGLE', TRUE, '3 BHK', '3 BHK', NULL, NULL, 3),
((SELECT id FROM service_categories WHERE slug = 'pop-false-ceiling'), 2, 'property_type', 'What kind of property is it?', 'SINGLE', TRUE, '4 BHK+', '4 BHK+', NULL, NULL, 4),
((SELECT id FROM service_categories WHERE slug = 'pop-false-ceiling'), 2, 'property_type', 'What kind of property is it?', 'SINGLE', TRUE, 'Villa / Bungalow', 'Villa / Bungalow', NULL, NULL, 5),
((SELECT id FROM service_categories WHERE slug = 'pop-false-ceiling'), 2, 'property_type', 'What kind of property is it?', 'SINGLE', TRUE, 'Office', 'Office', NULL, NULL, 6),
((SELECT id FROM service_categories WHERE slug = 'pop-false-ceiling'), 2, 'property_type', 'What kind of property is it?', 'SINGLE', TRUE, 'Shop / Commercial', 'Shop / Commercial', NULL, NULL, 7),
((SELECT id FROM service_categories WHERE slug = 'pop-false-ceiling'), 2, 'property_type', 'What kind of property is it?', 'SINGLE', TRUE, 'Other', 'Other', NULL, NULL, 8),
((SELECT id FROM service_categories WHERE slug = 'pop-false-ceiling'), 3, 'rooms', 'Select rooms / areas', 'MULTI', FALSE, 'Living Room', 'Living Room', NULL, NULL, 1),
((SELECT id FROM service_categories WHERE slug = 'pop-false-ceiling'), 3, 'rooms', 'Select rooms / areas', 'MULTI', FALSE, 'Bedroom', 'Bedroom', NULL, NULL, 2),
((SELECT id FROM service_categories WHERE slug = 'pop-false-ceiling'), 3, 'rooms', 'Select rooms / areas', 'MULTI', FALSE, 'Kitchen', 'Kitchen', NULL, NULL, 3),
((SELECT id FROM service_categories WHERE slug = 'pop-false-ceiling'), 3, 'rooms', 'Select rooms / areas', 'MULTI', FALSE, 'Office / Commercial Space', 'Office / Commercial Space', NULL, NULL, 4),
((SELECT id FROM service_categories WHERE slug = 'pop-false-ceiling'), 3, 'rooms', 'Select rooms / areas', 'MULTI', FALSE, 'Other', 'Other', NULL, NULL, 5),
((SELECT id FROM service_categories WHERE slug = 'pop-false-ceiling'), 4, 'area_sqft', 'Approximate ceiling area (sq. ft.)', 'NUMBER', FALSE, NULL, NULL, NULL, NULL, 1),
((SELECT id FROM service_categories WHERE slug = 'pop-false-ceiling'), 5, 'files', 'Upload photos or a design reference', 'FILE', FALSE, NULL, NULL, NULL, NULL, 1),
((SELECT id FROM service_categories WHERE slug = 'pop-false-ceiling'), 6, 'notes', 'Tell us anything else about your work.', 'TEXT', FALSE, NULL, NULL, NULL, NULL, 1),

-- ===========================================================================
-- furniture
-- ===========================================================================
((SELECT id FROM service_categories WHERE slug = 'furniture'), 1, 'service_needed', 'What furniture do you need?', 'MULTI', TRUE, 'Modular Furniture', 'Modular Furniture', NULL, NULL, 1),
((SELECT id FROM service_categories WHERE slug = 'furniture'), 1, 'service_needed', 'What furniture do you need?', 'MULTI', TRUE, 'Modular Kitchen', 'Modular Kitchen', NULL, NULL, 2),
((SELECT id FROM service_categories WHERE slug = 'furniture'), 1, 'service_needed', 'What furniture do you need?', 'MULTI', TRUE, 'Wardrobes', 'Wardrobes', NULL, NULL, 3),
((SELECT id FROM service_categories WHERE slug = 'furniture'), 1, 'service_needed', 'What furniture do you need?', 'MULTI', TRUE, 'TV Units', 'TV Units', NULL, NULL, 4),
((SELECT id FROM service_categories WHERE slug = 'furniture'), 1, 'service_needed', 'What furniture do you need?', 'MULTI', TRUE, 'Beds', 'Beds', NULL, NULL, 5),
((SELECT id FROM service_categories WHERE slug = 'furniture'), 1, 'service_needed', 'What furniture do you need?', 'MULTI', TRUE, 'Office Furniture', 'Office Furniture', NULL, NULL, 6),
((SELECT id FROM service_categories WHERE slug = 'furniture'), 1, 'service_needed', 'What furniture do you need?', 'MULTI', TRUE, 'Custom Furniture', 'Custom Furniture', NULL, NULL, 7),
((SELECT id FROM service_categories WHERE slug = 'furniture'), 1, 'service_needed', 'What furniture do you need?', 'MULTI', TRUE, 'Other', 'Other', NULL, NULL, 8),
((SELECT id FROM service_categories WHERE slug = 'furniture'), 2, 'property_type', 'What kind of property is it?', 'SINGLE', TRUE, '1 BHK', '1 BHK', NULL, NULL, 1),
((SELECT id FROM service_categories WHERE slug = 'furniture'), 2, 'property_type', 'What kind of property is it?', 'SINGLE', TRUE, '2 BHK', '2 BHK', NULL, NULL, 2),
((SELECT id FROM service_categories WHERE slug = 'furniture'), 2, 'property_type', 'What kind of property is it?', 'SINGLE', TRUE, '3 BHK', '3 BHK', NULL, NULL, 3),
((SELECT id FROM service_categories WHERE slug = 'furniture'), 2, 'property_type', 'What kind of property is it?', 'SINGLE', TRUE, '4 BHK+', '4 BHK+', NULL, NULL, 4),
((SELECT id FROM service_categories WHERE slug = 'furniture'), 2, 'property_type', 'What kind of property is it?', 'SINGLE', TRUE, 'Villa / Bungalow', 'Villa / Bungalow', NULL, NULL, 5),
((SELECT id FROM service_categories WHERE slug = 'furniture'), 2, 'property_type', 'What kind of property is it?', 'SINGLE', TRUE, 'Office', 'Office', NULL, NULL, 6),
((SELECT id FROM service_categories WHERE slug = 'furniture'), 2, 'property_type', 'What kind of property is it?', 'SINGLE', TRUE, 'Shop / Commercial', 'Shop / Commercial', NULL, NULL, 7),
((SELECT id FROM service_categories WHERE slug = 'furniture'), 2, 'property_type', 'What kind of property is it?', 'SINGLE', TRUE, 'Other', 'Other', NULL, NULL, 8),
((SELECT id FROM service_categories WHERE slug = 'furniture'), 3, 'material_preference', 'Preferred material', 'SINGLE', FALSE, 'Plywood', 'Plywood', NULL, NULL, 1),
((SELECT id FROM service_categories WHERE slug = 'furniture'), 3, 'material_preference', 'Preferred material', 'SINGLE', FALSE, 'MDF', 'MDF', NULL, NULL, 2),
((SELECT id FROM service_categories WHERE slug = 'furniture'), 3, 'material_preference', 'Preferred material', 'SINGLE', FALSE, 'Not Sure', 'Not Sure', 'Our team will recommend one during the visit.', NULL, 3),
((SELECT id FROM service_categories WHERE slug = 'furniture'), 4, 'files', 'Upload photos, measurements or a reference design', 'FILE', FALSE, NULL, NULL, NULL, NULL, 1),
((SELECT id FROM service_categories WHERE slug = 'furniture'), 5, 'notes', 'Tell us anything else about your work.', 'TEXT', FALSE, NULL, NULL, NULL, NULL, 1),

-- ===========================================================================
-- fabrication
-- ===========================================================================
((SELECT id FROM service_categories WHERE slug = 'fabrication'), 1, 'service_needed', 'What fabrication work do you need?', 'MULTI', TRUE, 'MS Fabrication', 'MS Fabrication', NULL, NULL, 1),
((SELECT id FROM service_categories WHERE slug = 'fabrication'), 1, 'service_needed', 'What fabrication work do you need?', 'MULTI', TRUE, 'SS Fabrication', 'SS Fabrication', NULL, NULL, 2),
((SELECT id FROM service_categories WHERE slug = 'fabrication'), 1, 'service_needed', 'What fabrication work do you need?', 'MULTI', TRUE, 'Gates', 'Gates', NULL, NULL, 3),
((SELECT id FROM service_categories WHERE slug = 'fabrication'), 1, 'service_needed', 'What fabrication work do you need?', 'MULTI', TRUE, 'Railings', 'Railings', NULL, NULL, 4),
((SELECT id FROM service_categories WHERE slug = 'fabrication'), 1, 'service_needed', 'What fabrication work do you need?', 'MULTI', TRUE, 'Grills', 'Grills', NULL, NULL, 5),
((SELECT id FROM service_categories WHERE slug = 'fabrication'), 1, 'service_needed', 'What fabrication work do you need?', 'MULTI', TRUE, 'Staircase', 'Staircase', NULL, NULL, 6),
((SELECT id FROM service_categories WHERE slug = 'fabrication'), 1, 'service_needed', 'What fabrication work do you need?', 'MULTI', TRUE, 'Shed & Roofing', 'Shed & Roofing', NULL, NULL, 7),
((SELECT id FROM service_categories WHERE slug = 'fabrication'), 1, 'service_needed', 'What fabrication work do you need?', 'MULTI', TRUE, 'Structural Fabrication', 'Structural Fabrication', NULL, NULL, 8),
((SELECT id FROM service_categories WHERE slug = 'fabrication'), 1, 'service_needed', 'What fabrication work do you need?', 'MULTI', TRUE, 'Other', 'Other', NULL, NULL, 9),
((SELECT id FROM service_categories WHERE slug = 'fabrication'), 2, 'property_type', 'What kind of property is it?', 'SINGLE', TRUE, '1 BHK', '1 BHK', NULL, NULL, 1),
((SELECT id FROM service_categories WHERE slug = 'fabrication'), 2, 'property_type', 'What kind of property is it?', 'SINGLE', TRUE, '2 BHK', '2 BHK', NULL, NULL, 2),
((SELECT id FROM service_categories WHERE slug = 'fabrication'), 2, 'property_type', 'What kind of property is it?', 'SINGLE', TRUE, '3 BHK', '3 BHK', NULL, NULL, 3),
((SELECT id FROM service_categories WHERE slug = 'fabrication'), 2, 'property_type', 'What kind of property is it?', 'SINGLE', TRUE, '4 BHK+', '4 BHK+', NULL, NULL, 4),
((SELECT id FROM service_categories WHERE slug = 'fabrication'), 2, 'property_type', 'What kind of property is it?', 'SINGLE', TRUE, 'Villa / Bungalow', 'Villa / Bungalow', NULL, NULL, 5),
((SELECT id FROM service_categories WHERE slug = 'fabrication'), 2, 'property_type', 'What kind of property is it?', 'SINGLE', TRUE, 'Office', 'Office', NULL, NULL, 6),
((SELECT id FROM service_categories WHERE slug = 'fabrication'), 2, 'property_type', 'What kind of property is it?', 'SINGLE', TRUE, 'Shop / Commercial', 'Shop / Commercial', NULL, NULL, 7),
((SELECT id FROM service_categories WHERE slug = 'fabrication'), 2, 'property_type', 'What kind of property is it?', 'SINGLE', TRUE, 'Industrial', 'Industrial', NULL, NULL, 8),
((SELECT id FROM service_categories WHERE slug = 'fabrication'), 2, 'property_type', 'What kind of property is it?', 'SINGLE', TRUE, 'Other', 'Other', NULL, NULL, 9),
((SELECT id FROM service_categories WHERE slug = 'fabrication'), 3, 'material_type', 'Preferred material', 'SINGLE', FALSE, 'Mild Steel (MS)', 'Mild Steel (MS)', NULL, NULL, 1),
((SELECT id FROM service_categories WHERE slug = 'fabrication'), 3, 'material_type', 'Preferred material', 'SINGLE', FALSE, 'Stainless Steel (SS)', 'Stainless Steel (SS)', NULL, NULL, 2),
((SELECT id FROM service_categories WHERE slug = 'fabrication'), 3, 'material_type', 'Preferred material', 'SINGLE', FALSE, 'Not Sure', 'Not Sure', 'Our team will recommend one during the visit.', NULL, 3),
((SELECT id FROM service_categories WHERE slug = 'fabrication'), 4, 'files', 'Upload photos or measurements', 'FILE', FALSE, NULL, NULL, NULL, NULL, 1),
((SELECT id FROM service_categories WHERE slug = 'fabrication'), 5, 'notes', 'Tell us anything else about your work.', 'TEXT', FALSE, NULL, NULL, NULL, NULL, 1),

-- ===========================================================================
-- finishing
-- ===========================================================================
((SELECT id FROM service_categories WHERE slug = 'finishing'), 1, 'service_needed', 'What finishing work do you need?', 'MULTI', TRUE, 'Flooring', 'Flooring', NULL, NULL, 1),
((SELECT id FROM service_categories WHERE slug = 'finishing'), 1, 'service_needed', 'What finishing work do you need?', 'MULTI', TRUE, 'Wall Finishing', 'Wall Finishing', NULL, NULL, 2),
((SELECT id FROM service_categories WHERE slug = 'finishing'), 1, 'service_needed', 'What finishing work do you need?', 'MULTI', TRUE, 'Tile Work', 'Tile Work', NULL, NULL, 3),
((SELECT id FROM service_categories WHERE slug = 'finishing'), 1, 'service_needed', 'What finishing work do you need?', 'MULTI', TRUE, 'Marble & Granite', 'Marble & Granite', NULL, NULL, 4),
((SELECT id FROM service_categories WHERE slug = 'finishing'), 1, 'service_needed', 'What finishing work do you need?', 'MULTI', TRUE, 'Doors & Windows', 'Doors & Windows', NULL, NULL, 5),
((SELECT id FROM service_categories WHERE slug = 'finishing'), 1, 'service_needed', 'What finishing work do you need?', 'MULTI', TRUE, 'Sanitary Fixtures', 'Sanitary Fixtures', NULL, NULL, 6),
((SELECT id FROM service_categories WHERE slug = 'finishing'), 1, 'service_needed', 'What finishing work do you need?', 'MULTI', TRUE, 'Final Touch-up', 'Final Touch-up', NULL, NULL, 7),
((SELECT id FROM service_categories WHERE slug = 'finishing'), 1, 'service_needed', 'What finishing work do you need?', 'MULTI', TRUE, 'Other', 'Other', NULL, NULL, 8),
((SELECT id FROM service_categories WHERE slug = 'finishing'), 2, 'property_type', 'What kind of property is it?', 'SINGLE', TRUE, '1 BHK', '1 BHK', NULL, NULL, 1),
((SELECT id FROM service_categories WHERE slug = 'finishing'), 2, 'property_type', 'What kind of property is it?', 'SINGLE', TRUE, '2 BHK', '2 BHK', NULL, NULL, 2),
((SELECT id FROM service_categories WHERE slug = 'finishing'), 2, 'property_type', 'What kind of property is it?', 'SINGLE', TRUE, '3 BHK', '3 BHK', NULL, NULL, 3),
((SELECT id FROM service_categories WHERE slug = 'finishing'), 2, 'property_type', 'What kind of property is it?', 'SINGLE', TRUE, '4 BHK+', '4 BHK+', NULL, NULL, 4),
((SELECT id FROM service_categories WHERE slug = 'finishing'), 2, 'property_type', 'What kind of property is it?', 'SINGLE', TRUE, 'Villa / Bungalow', 'Villa / Bungalow', NULL, NULL, 5),
((SELECT id FROM service_categories WHERE slug = 'finishing'), 2, 'property_type', 'What kind of property is it?', 'SINGLE', TRUE, 'Office', 'Office', NULL, NULL, 6),
((SELECT id FROM service_categories WHERE slug = 'finishing'), 2, 'property_type', 'What kind of property is it?', 'SINGLE', TRUE, 'Shop / Commercial', 'Shop / Commercial', NULL, NULL, 7),
((SELECT id FROM service_categories WHERE slug = 'finishing'), 2, 'property_type', 'What kind of property is it?', 'SINGLE', TRUE, 'Building / Society', 'Building / Society', NULL, NULL, 8),
((SELECT id FROM service_categories WHERE slug = 'finishing'), 2, 'property_type', 'What kind of property is it?', 'SINGLE', TRUE, 'Other', 'Other', NULL, NULL, 9),
((SELECT id FROM service_categories WHERE slug = 'finishing'), 3, 'area_sqft', 'Approximate area (sq. ft.)', 'NUMBER', FALSE, NULL, NULL, NULL, NULL, 1),
((SELECT id FROM service_categories WHERE slug = 'finishing'), 4, 'files', 'Upload photos or a material reference', 'FILE', FALSE, NULL, NULL, NULL, NULL, 1),
((SELECT id FROM service_categories WHERE slug = 'finishing'), 5, 'notes', 'Tell us anything else about your work.', 'TEXT', FALSE, NULL, NULL, NULL, NULL, 1);
