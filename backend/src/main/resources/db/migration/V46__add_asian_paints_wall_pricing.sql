SET @painting_id = (
    SELECT id FROM service_categories WHERE slug = 'painting'
);

DELETE FROM service_options
WHERE category_id = @painting_id
AND question_key = 'few_walls_product';

INSERT INTO service_options
    (category_id, step_no, question_key, question_text,
     input_type, required, option_value, option_label,
     option_hint, option_group, price_paise, sort_order, active)
VALUES
(@painting_id, 3, 'few_walls_product', 'Choose your paint product',
 'SINGLE', TRUE, 'tractor-emulsion', 'Tractor Emulsion',
 'Non-washable', 'Economy', NULL, 1, TRUE),
(@painting_id, 3, 'few_walls_product', 'Choose your paint product',
 'SINGLE', TRUE, 'tractor-shyne', 'Tractor Shyne',
 'Washable', 'Economy', NULL, 2, TRUE),
(@painting_id, 3, 'few_walls_product', 'Choose your paint product',
 'SINGLE', TRUE, 'royal', 'Royal',
 'Washable', 'Premium', NULL, 3, TRUE),
(@painting_id, 3, 'few_walls_product', 'Choose your paint product',
 'SINGLE', TRUE, 'royal-shyne', 'Royal Shyne',
 'Washable', 'Premium', NULL, 4, TRUE);

INSERT INTO painting_product_prices
    (flow_key, painting_type, brand, home_type, product_value, price_paise)
VALUES
('few_walls_product', 'wall-painting', 'asian-paints', '1-wall', 'tractor-emulsion', 199900),
('few_walls_product', 'wall-painting', 'asian-paints', '2-walls', 'tractor-emulsion', 399900),
('few_walls_product', 'wall-painting', 'asian-paints', '1-wall', 'tractor-shyne', 299900),
('few_walls_product', 'wall-painting', 'asian-paints', '2-walls', 'tractor-shyne', 599900),
('few_walls_product', 'wall-painting', 'asian-paints', '1-wall', 'royal', 359900),
('few_walls_product', 'wall-painting', 'asian-paints', '2-walls', 'royal', 719900),
('few_walls_product', 'wall-painting', 'asian-paints', '1-wall', 'royal-shyne', 399900),
('few_walls_product', 'wall-painting', 'asian-paints', '2-walls', 'royal-shyne', 799900);