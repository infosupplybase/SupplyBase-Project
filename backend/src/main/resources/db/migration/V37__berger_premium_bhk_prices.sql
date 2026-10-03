SET @painting_id = (
    SELECT id FROM service_categories WHERE slug = 'painting'
);

INSERT INTO service_options
    (category_id, step_no, question_key, question_text,
     input_type, required, option_value, option_label,
     option_hint, option_group, price_paise, sort_order, active)
VALUES
(@painting_id, 3, 'full_home_product', 'Select product range',
 'SINGLE', TRUE, 'berger-silk-glamour',
 'Silk Glamour', 'Washable',
 'Premium', NULL, 30, TRUE),

(@painting_id, 3, 'full_home_product', 'Select product range',
 'SINGLE', TRUE, 'berger-silk-luxury-emulsion',
 'Silk Luxury Emulsion', 'Washable',
 'Premium', NULL, 31, TRUE);

INSERT INTO painting_product_prices
    (flow_key, painting_type, brand, home_type, product_value, price_paise)
VALUES
('full_home_product', 'unfurnished-home', 'berger', '1bhk',
 'berger-silk-glamour', 2399900),
('full_home_product', 'unfurnished-home', 'berger', '2bhk',
 'berger-silk-glamour', 3499900),
('full_home_product', 'unfurnished-home', 'berger', '3bhk',
 'berger-silk-glamour', 4399900),

('full_home_product', 'unfurnished-home', 'berger', '1bhk',
 'berger-silk-luxury-emulsion', 2699900),
('full_home_product', 'unfurnished-home', 'berger', '2bhk',
 'berger-silk-luxury-emulsion', 3799900),
('full_home_product', 'unfurnished-home', 'berger', '3bhk',
 'berger-silk-luxury-emulsion', 4699900);