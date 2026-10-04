-- SupplyBase starting prices for existing painting add-ons.
-- Amounts are stored in paise.
UPDATE service_options
SET price_paise = CASE option_value
    WHEN 'ceiling-painting' THEN 199900
    WHEN 'doors-windows-painting' THEN 299900
    WHEN 'grill-painting' THEN 149900
    WHEN 'texture-feature-wall' THEN 499900
    WHEN 'waterproofing-treatment' THEN 399900
    WHEN 'deep-cleaning' THEN 199900
    WHEN 'furniture-shifting' THEN 99900
END
WHERE category_id = (
    SELECT id
    FROM service_categories
    WHERE slug = 'painting'
)
AND question_key IN ('full_home_addon', 'few_walls_addon')
AND option_value IN (
    'ceiling-painting',
    'doors-windows-painting',
    'grill-painting',
    'texture-feature-wall',
    'waterproofing-treatment',
    'deep-cleaning',
    'furniture-shifting'
);