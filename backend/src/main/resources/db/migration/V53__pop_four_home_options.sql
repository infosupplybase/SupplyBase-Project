-- Full Home POP: four home choices.
-- Retain removed rows for compatibility with historical records.
UPDATE service_options
SET active = FALSE
WHERE category_id = (
    SELECT id FROM service_categories
    WHERE slug = 'pop-ceiling-design'
)
AND question_key = 'pop_home_type'
AND option_value NOT IN ('1bhk', '2bhk', '3bhk', '4bhk');

UPDATE service_options
SET active = TRUE,
    option_label = CASE option_value
        WHEN '1bhk' THEN '1 BHK'
        WHEN '2bhk' THEN '2 BHK'
        WHEN '3bhk' THEN '3 BHK'
        WHEN '4bhk' THEN '4 BHK / Villa'
    END,
    option_hint = CASE
        WHEN option_value = '4bhk' THEN NULL
        ELSE option_hint
    END,
    sort_order = CASE option_value
        WHEN '1bhk' THEN 1
        WHEN '2bhk' THEN 2
        WHEN '3bhk' THEN 3
        WHEN '4bhk' THEN 4
    END
WHERE category_id = (
    SELECT id FROM service_categories
    WHERE slug = 'pop-ceiling-design'
)
AND question_key = 'pop_home_type'
AND option_value IN ('1bhk', '2bhk', '3bhk', '4bhk');
