-- Product package prices depend on the home, brand and painting type.
-- Home type itself remains unpriced.
CREATE TABLE painting_product_prices (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    flow_key VARCHAR(60) NOT NULL,
    painting_type VARCHAR(80) NOT NULL,
    brand VARCHAR(80) NOT NULL,
    home_type VARCHAR(80) NOT NULL,
    product_value VARCHAR(80) NOT NULL,
    price_paise BIGINT NOT NULL,
    UNIQUE KEY uk_painting_product_price
        (flow_key, painting_type, brand, home_type, product_value)
);

INSERT INTO painting_product_prices
    (flow_key, painting_type, brand, home_type, product_value, price_paise)
VALUES
('full_home_product', 'unfurnished-home', 'asian-paints', '1bhk', 'tractor-emulsion', 1399900),
('full_home_product', 'unfurnished-home', 'asian-paints', '2bhk', 'tractor-emulsion', 2099900),
('full_home_product', 'unfurnished-home', 'asian-paints', '3bhk', 'tractor-emulsion', 3099900),

('full_home_product', 'unfurnished-home', 'asian-paints', '1bhk', 'tractor-sparc', 1699900),
('full_home_product', 'unfurnished-home', 'asian-paints', '2bhk', 'tractor-sparc', 2399900),
('full_home_product', 'unfurnished-home', 'asian-paints', '3bhk', 'tractor-sparc', 3599900),

('full_home_product', 'unfurnished-home', 'asian-paints', '1bhk', 'tractor-shyne', 1899900),
('full_home_product', 'unfurnished-home', 'asian-paints', '2bhk', 'tractor-shyne', 2899900),
('full_home_product', 'unfurnished-home', 'asian-paints', '3bhk', 'tractor-shyne', 4099900);

-- Correct the product descriptions without changing colour shades.
UPDATE service_options
SET option_hint = CASE option_value
    WHEN 'tractor-emulsion' THEN 'Non-washable'
    WHEN 'tractor-sparc' THEN 'Non-washable'
    WHEN 'tractor-shyne' THEN 'Washable'
END,
option_group = 'Economy',
price_paise = NULL
WHERE category_id = (
    SELECT id FROM service_categories WHERE slug = 'painting'
)
AND question_key IN ('full_home_product', 'few_walls_product')
AND option_value IN ('tractor-emulsion', 'tractor-sparc', 'tractor-shyne');

-- Register Economy products under the Full Home product question.
INSERT INTO service_options
    (category_id, step_no, question_key, question_text,
     input_type, required, option_value, option_label,
     option_hint, option_group, price_paise, sort_order, active)
SELECT
    source.category_id,
    3,
    'full_home_product',
    'Select product range',
    'SINGLE',
    TRUE,
    source.option_value,
    source.option_label,
    source.option_hint,
    'Economy',
    NULL,
    source.sort_order,
    TRUE
FROM service_options source
JOIN service_categories category
    ON category.id = source.category_id
WHERE category.slug = 'painting'
AND source.question_key = 'few_walls_product'
AND source.active = TRUE
AND source.option_value IN (
    'tractor-emulsion', 'tractor-sparc', 'tractor-shyne'
)
AND NOT EXISTS (
    SELECT 1
    FROM service_options existing
    WHERE existing.category_id = source.category_id
    AND existing.question_key = 'full_home_product'
    AND existing.option_value = source.option_value
);

-- Ensure existing Full Home Economy entries are available.
UPDATE service_options
SET active = TRUE
WHERE category_id = (
    SELECT id FROM service_categories WHERE slug = 'painting'
)
AND question_key = 'full_home_product'
AND option_value IN ('tractor-emulsion', 'tractor-sparc', 'tractor-shyne');