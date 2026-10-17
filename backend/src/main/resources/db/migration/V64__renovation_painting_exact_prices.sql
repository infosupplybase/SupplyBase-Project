-- Full-home renovation package prices from Kaif's rate sheet (2026-10-17).
-- Asian Paints gets the exact amounts (replacing V61's Rs 999-ending
-- estimates); each Berger product is Rs 1,000 below its Asian Paints match,
-- as Kaif asked. Amounts are in paise.
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

-- Berger: Bison = Tractor Emulsion, Easy Clean = Tractor Shyne,
-- Silk Glamour = Royal, Silk Luxury Emulsion = Royal Shyne (same pairing as V62).
INSERT INTO painting_product_prices
    (flow_key, painting_type, brand, home_type, product_value, price_paise)
VALUES
('full_home_product', 'renovation-painting', 'berger', '1bhk', 'berger-bison-acrylic-emulsion', 2000000),
('full_home_product', 'renovation-painting', 'berger', '2bhk', 'berger-bison-acrylic-emulsion', 2600000),
('full_home_product', 'renovation-painting', 'berger', '3bhk', 'berger-bison-acrylic-emulsion', 3700000),

('full_home_product', 'renovation-painting', 'berger', '1bhk', 'berger-easy-clean', 3200000),
('full_home_product', 'renovation-painting', 'berger', '2bhk', 'berger-easy-clean', 3700000),
('full_home_product', 'renovation-painting', 'berger', '3bhk', 'berger-easy-clean', 4800000),

('full_home_product', 'renovation-painting', 'berger', '1bhk', 'berger-silk-glamour', 3800000),
('full_home_product', 'renovation-painting', 'berger', '2bhk', 'berger-silk-glamour', 4800000),
('full_home_product', 'renovation-painting', 'berger', '3bhk', 'berger-silk-glamour', 6900000),

('full_home_product', 'renovation-painting', 'berger', '1bhk', 'berger-silk-luxury-emulsion', 4100000),
('full_home_product', 'renovation-painting', 'berger', '2bhk', 'berger-silk-luxury-emulsion', 5400000),
('full_home_product', 'renovation-painting', 'berger', '3bhk', 'berger-silk-luxury-emulsion', 8000000)
ON DUPLICATE KEY UPDATE price_paise = VALUES(price_paise);
