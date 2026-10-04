SET @painting_id = (
    SELECT id FROM service_categories WHERE slug = 'painting'
);

-- Remove the previous Premium products from these product questions.
-- Historical booking answers retain their saved names and prices.
DELETE FROM service_options
WHERE category_id = @painting_id
AND question_key IN ('full_home_product', 'few_walls_product')
AND (
    option_group IN ('Premium', 'Luxury')
    OR option_value IN (
        'apcolite-premium',
        'apcolite-advanced',
        'royale-luxury',
        'royale-aspira',
        'royal',
        'royal-shyne'
    )
);

INSERT INTO service_options
    (category_id, step_no, question_key, question_text,
     input_type, required, option_value, option_label,
     option_hint, option_group, price_paise, sort_order, active)
VALUES
(@painting_id, 3, 'full_home_product', 'Select product range',
 'SINGLE', TRUE, 'royal', 'Royal',
 'Washable', 'Premium', NULL, 10, TRUE),

(@painting_id, 3, 'full_home_product', 'Select product range',
 'SINGLE', TRUE, 'royal-shyne', 'Royal Shyne',
 'Washable', 'Premium', NULL, 11, TRUE);

-- Only the two supplied Premium products remain.
-- Economy prices are preserved.
DELETE FROM painting_product_prices
WHERE brand = 'asian-paints'
AND product_value IN (
    'apcolite-premium',
    'apcolite-advanced',
    'royale-luxury',
    'royale-aspira',
    'royal',
    'royal-shyne'
);

INSERT INTO painting_product_prices
    (flow_key, painting_type, brand, home_type, product_value, price_paise)
VALUES
('full_home_product', 'unfurnished-home', 'asian-paints', '1bhk', 'royal', 2499900),
('full_home_product', 'unfurnished-home', 'asian-paints', '2bhk', 'royal', 3599900),
('full_home_product', 'unfurnished-home', 'asian-paints', '3bhk', 'royal', 4499900),

('full_home_product', 'unfurnished-home', 'asian-paints', '1bhk', 'royal-shyne', 2799900),
('full_home_product', 'unfurnished-home', 'asian-paints', '2bhk', 'royal-shyne', 3899900),
('full_home_product', 'unfurnished-home', 'asian-paints', '3bhk', 'royal-shyne', 4799900);