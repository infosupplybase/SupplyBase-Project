-- Asian Paints full-home renovation package estimates.
-- Amounts are in paise. Existing unfurnished-home prices are preserved.
INSERT INTO painting_product_prices
    (flow_key, painting_type, brand, home_type, product_value, price_paise)
VALUES
('full_home_product', 'renovation-painting', 'asian-paints', '1bhk', 'tractor-emulsion', 2099900),
('full_home_product', 'renovation-painting', 'asian-paints', '2bhk', 'tractor-emulsion', 2699900),
('full_home_product', 'renovation-painting', 'asian-paints', '3bhk', 'tractor-emulsion', 3799900),

('full_home_product', 'renovation-painting', 'asian-paints', '1bhk', 'tractor-sparc', 2699900),
('full_home_product', 'renovation-painting', 'asian-paints', '2bhk', 'tractor-sparc', 3299900),
('full_home_product', 'renovation-painting', 'asian-paints', '3bhk', 'tractor-sparc', 4299900),

('full_home_product', 'renovation-painting', 'asian-paints', '1bhk', 'tractor-shyne', 3299900),
('full_home_product', 'renovation-painting', 'asian-paints', '2bhk', 'tractor-shyne', 3799900),
('full_home_product', 'renovation-painting', 'asian-paints', '3bhk', 'tractor-shyne', 4899900),

('full_home_product', 'renovation-painting', 'asian-paints', '1bhk', 'royal', 3899900),
('full_home_product', 'renovation-painting', 'asian-paints', '2bhk', 'royal', 4899900),
('full_home_product', 'renovation-painting', 'asian-paints', '3bhk', 'royal', 6999900),

('full_home_product', 'renovation-painting', 'asian-paints', '1bhk', 'royal-shyne', 4199900),
('full_home_product', 'renovation-painting', 'asian-paints', '2bhk', 'royal-shyne', 5499900),
('full_home_product', 'renovation-painting', 'asian-paints', '3bhk', 'royal-shyne', 8099900)
ON DUPLICATE KEY UPDATE price_paise = VALUES(price_paise);
