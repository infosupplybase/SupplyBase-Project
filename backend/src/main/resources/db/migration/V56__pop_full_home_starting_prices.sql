CREATE TABLE pop_ceiling_package_prices (
    id BIGINT NOT NULL AUTO_INCREMENT,
    home_type VARCHAR(80) NOT NULL,
    ceiling_type VARCHAR(80) NOT NULL,
    price_paise BIGINT NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_pop_home_ceiling (home_type, ceiling_type)
);

INSERT INTO pop_ceiling_package_prices
    (home_type, ceiling_type, price_paise)
VALUES
    ('1bhk', 'flat-ceiling',         2499900),
    ('2bhk', 'flat-ceiling',         3899900),
    ('3bhk', 'flat-ceiling',         4999900),

    ('1bhk', 'double-layer-ceiling', 3399900),
    ('2bhk', 'double-layer-ceiling', 4699900),
    ('3bhk', 'double-layer-ceiling', 5699900),

    ('1bhk', 'floating-ceiling',     3599900),
    ('2bhk', 'floating-ceiling',     4899900),
    ('3bhk', 'floating-ceiling',     5899900),

    ('1bhk', 'border-ceiling',       3499900),
    ('2bhk', 'border-ceiling',       4499900),
    ('3bhk', 'border-ceiling',       5499900),

    ('1bhk', 'profile-pop',          3499900),
    ('2bhk', 'profile-pop',          4799900),
    ('3bhk', 'profile-pop',          5999900),

    ('1bhk', 'pvc-panel-pop',        2499900),
    ('2bhk', 'pvc-panel-pop',        3499900),
    ('3bhk', 'pvc-panel-pop',        4499900);

-- Home and ceiling selections identify a package.
-- They must not show separate prices or add extra charges.
UPDATE service_options
SET price_paise = NULL
WHERE category_id = (
    SELECT id FROM service_categories
    WHERE slug = 'pop-ceiling-design'
)
AND question_key IN (
    'pop_home_type',
    'pop_home_design_style'
);
