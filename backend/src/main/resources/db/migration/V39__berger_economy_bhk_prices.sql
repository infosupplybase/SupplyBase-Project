SET @painting_id = (
    SELECT id FROM service_categories WHERE slug = 'painting'
);

INSERT INTO service_options
    (category_id, step_no, question_key, question_text,
     input_type, required, option_value, option_label,
     option_hint, option_group, price_paise, sort_order, active)
VALUES
(@painting_id, 3, 'full_home_product', 'Select product range',
 'SINGLE', TRUE, 'berger-bison-acrylic-emulsion',
 'Bison Acrylic Emulsion', 'Non-washable',
 'Economy', NULL, 20, TRUE),

(@painting_id, 3, 'full_home_product', 'Select product range',
 'SINGLE', TRUE, 'berger-easy-clean',
 'Easy Clean', 'Non-washable',
 'Economy', NULL, 21, TRUE);

INSERT INTO painting_product_prices
    (flow_key, painting_type, brand, home_type, product_value, price_paise)
VALUES
('full_home_product', 'unfurnished-home', 'berger', '1bhk',
 'berger-bison-acrylic-emulsion', 1299900),
('full_home_product', 'unfurnished-home', 'berger', '2bhk',
 'berger-bison-acrylic-emulsion', 1999900),
('full_home_product', 'unfurnished-home', 'berger', '3bhk',
 'berger-bison-acrylic-emulsion', 2899900),

('full_home_product', 'unfurnished-home', 'berger', '1bhk',
 'berger-easy-clean', 1899900),
('full_home_product', 'unfurnished-home', 'berger', '2bhk',
 'berger-easy-clean', 3099900),
('full_home_product', 'unfurnished-home', 'berger', '3bhk',
 'berger-easy-clean', 3899900);