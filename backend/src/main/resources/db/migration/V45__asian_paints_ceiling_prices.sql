SET @painting_id = (
    SELECT id FROM service_categories WHERE slug = 'painting'
);

INSERT INTO service_options
    (category_id, step_no, question_key, question_text,
     input_type, required, option_value, option_label,
     option_hint, option_group, price_paise, sort_order, active)
VALUES
(@painting_id, 2, 'few_walls_ceiling_type', 'Choose your ceiling type',
 'SINGLE', FALSE, 'plain-ceiling', 'Plain Ceiling',
 NULL, NULL, NULL, 1, TRUE),

(@painting_id, 2, 'few_walls_ceiling_type', 'Choose your ceiling type',
 'SINGLE', FALSE, 'design-ceiling', 'Design Ceiling',
 NULL, NULL, NULL, 2, TRUE);

-- Ceiling type is required conditionally when Ceiling Paint is selected.
-- Prices below apply to one ceiling.
INSERT INTO painting_product_prices
    (flow_key, painting_type, brand, home_type, product_value, price_paise)
VALUES
('few_walls_product', 'ceiling-painting', 'asian-paints', 'plain-ceiling',
 'tractor-emulsion', 199900),
('few_walls_product', 'ceiling-painting', 'asian-paints', 'plain-ceiling',
 'tractor-shyne', 249900),
('few_walls_product', 'ceiling-painting', 'asian-paints', 'plain-ceiling',
 'royal', 299900),
('few_walls_product', 'ceiling-painting', 'asian-paints', 'plain-ceiling',
 'royal-shyne', 349900),

('few_walls_product', 'ceiling-painting', 'asian-paints', 'design-ceiling',
 'tractor-emulsion', 299900),
('few_walls_product', 'ceiling-painting', 'asian-paints', 'design-ceiling',
 'tractor-shyne', 399900),
('few_walls_product', 'ceiling-painting', 'asian-paints', 'design-ceiling',
 'royal', 449900),
('few_walls_product', 'ceiling-painting', 'asian-paints', 'design-ceiling',
 'royal-shyne', 499900);