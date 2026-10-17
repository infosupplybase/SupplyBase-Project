-- Asian Paints full-home renovation package prices from Kaif's rate sheet
-- (2026-10-17). Replaces the Rs 999-ending estimates from V61 with the exact
-- amounts. Amounts are in paise.
INSERT INTO painting_product_prices
    (flow_key, painting_type, brand, home_type, product_value, price_paise)
VALUES
('full_home_product', 'renovation-painting', 'asian-paints', '1bhk', 'tractor-emulsion', 2100000),
('full_home_product', 'renovation-painting', 'asian-paints', '2bhk', 'tractor-emulsion', 2700000),
('full_home_product', 'renovation-painting', 'asian-paints', '3bhk', 'tractor-emulsion', 3800000),

('full_home_product', 'renovation-painting', 'asian-paints', '1bhk', 'tractor-sparc', 2700000),
('full_home_product', 'renovation-painting', 'asian-paints', '2bhk', 'tractor-sparc', 3300000),
('full_home_product', 'renovation-painting', 'asian-paints', '3bhk', 'tractor-sparc', 4300000),

('full_home_product', 'renovation-painting', 'asian-paints', '1bhk', 'tractor-shyne', 3300000),
('full_home_product', 'renovation-painting', 'asian-paints', '2bhk', 'tractor-shyne', 3800000),
('full_home_product', 'renovation-painting', 'asian-paints', '3bhk', 'tractor-shyne', 4900000),

('full_home_product', 'renovation-painting', 'asian-paints', '1bhk', 'royal', 3900000),
('full_home_product', 'renovation-painting', 'asian-paints', '2bhk', 'royal', 4900000),
('full_home_product', 'renovation-painting', 'asian-paints', '3bhk', 'royal', 7000000),

('full_home_product', 'renovation-painting', 'asian-paints', '1bhk', 'royal-shyne', 4200000),
('full_home_product', 'renovation-painting', 'asian-paints', '2bhk', 'royal-shyne', 5500000),
('full_home_product', 'renovation-painting', 'asian-paints', '3bhk', 'royal-shyne', 8100000)
ON DUPLICATE KEY UPDATE price_paise = VALUES(price_paise);
