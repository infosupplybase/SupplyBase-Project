-- Berger renovation estimates: Rs 1,000 below matching Asian Paints packages.
-- Amounts are stored in paise.
INSERT INTO painting_product_prices
    (flow_key, painting_type, brand, home_type, product_value, price_paise)
VALUES
('full_home_product', 'renovation-painting', 'berger', '1bhk', 'berger-bison-acrylic-emulsion', 1999900),
('full_home_product', 'renovation-painting', 'berger', '2bhk', 'berger-bison-acrylic-emulsion', 2599900),
('full_home_product', 'renovation-painting', 'berger', '3bhk', 'berger-bison-acrylic-emulsion', 3699900),

('full_home_product', 'renovation-painting', 'berger', '1bhk', 'berger-easy-clean', 3199900),
('full_home_product', 'renovation-painting', 'berger', '2bhk', 'berger-easy-clean', 3699900),
('full_home_product', 'renovation-painting', 'berger', '3bhk', 'berger-easy-clean', 4799900),

('full_home_product', 'renovation-painting', 'berger', '1bhk', 'berger-silk-glamour', 3799900),
('full_home_product', 'renovation-painting', 'berger', '2bhk', 'berger-silk-glamour', 4799900),
('full_home_product', 'renovation-painting', 'berger', '3bhk', 'berger-silk-glamour', 6899900),

('full_home_product', 'renovation-painting', 'berger', '1bhk', 'berger-silk-luxury-emulsion', 4099900),
('full_home_product', 'renovation-painting', 'berger', '2bhk', 'berger-silk-luxury-emulsion', 5299900),
('full_home_product', 'renovation-painting', 'berger', '3bhk', 'berger-silk-luxury-emulsion', 7899900)
ON DUPLICATE KEY UPDATE price_paise = VALUES(price_paise);
