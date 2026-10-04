UPDATE painting_product_prices
SET price_paise = CASE product_value
    WHEN 'tractor-emulsion' THEN 399900
    WHEN 'tractor-shyne' THEN 599900
    WHEN 'royal' THEN 719900
    WHEN 'royal-shyne' THEN 799900
END
WHERE flow_key = 'few_walls_product'
AND painting_type = 'wall-painting'
AND brand = 'asian-paints'
AND home_type = '2-walls'
AND product_value IN (
    'tractor-emulsion', 'tractor-shyne', 'royal', 'royal-shyne'
);