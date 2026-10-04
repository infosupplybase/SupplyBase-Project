SET @painting_id = (
    SELECT id FROM service_categories WHERE slug = 'painting'
);

INSERT INTO service_options
    (category_id, step_no, question_key, question_text,
     input_type, required, option_value, option_label,
     option_hint, option_group, price_paise, sort_order, active)
VALUES
(@painting_id, 3, 'few_walls_product', 'Choose your paint product',
 'SINGLE', TRUE, 'berger-bison-acrylic-emulsion',
 'Bison Acrylic Emulsion', 'Non-washable',
 'Economy', NULL, 10, TRUE),

(@painting_id, 3, 'few_walls_product', 'Choose your paint product',
 'SINGLE', TRUE, 'berger-easy-clean',
 'Easy Clean', 'Non-washable',
 'Economy', NULL, 11, TRUE),

(@painting_id, 3, 'few_walls_product', 'Choose your paint product',
 'SINGLE', TRUE, 'berger-silk-glamour',
 'Silk Glamour', 'Washable',
 'Premium', NULL, 12, TRUE),

(@painting_id, 3, 'few_walls_product', 'Choose your paint product',
 'SINGLE', TRUE, 'berger-silk-luxury-emulsion',
 'Silk Luxury Emulsion', 'Washable',
 'Premium', NULL, 13, TRUE);

INSERT INTO painting_product_prices
    (flow_key, painting_type, brand, home_type, product_value, price_paise)
SELECT
    flow_key,
    painting_type,
    'berger',
    home_type,
    CASE product_value
        WHEN 'tractor-emulsion' THEN 'berger-bison-acrylic-emulsion'
        WHEN 'tractor-shyne' THEN 'berger-easy-clean'
        WHEN 'royal' THEN 'berger-silk-glamour'
        WHEN 'royal-shyne' THEN 'berger-silk-luxury-emulsion'
    END,
    price_paise
FROM painting_product_prices
WHERE flow_key = 'few_walls_product'
AND brand = 'asian-paints'
AND (
    (painting_type = 'wall-painting'
        AND home_type IN ('1-wall', '2-walls'))
    OR
    (painting_type = 'ceiling-painting'
        AND home_type IN ('plain-ceiling', 'design-ceiling'))
)
AND product_value IN (
    'tractor-emulsion', 'tractor-shyne', 'royal', 'royal-shyne'
);