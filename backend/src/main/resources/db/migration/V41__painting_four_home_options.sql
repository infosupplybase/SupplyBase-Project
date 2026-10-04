SET @painting_id = (
    SELECT id FROM service_categories WHERE slug = 'painting'
);

DELETE FROM service_options
WHERE category_id = @painting_id
AND question_key = 'home_type'
AND option_value IN ('4bhk', '4bhk-villa');

UPDATE service_options
SET option_label = 'Villa / Independent House',
    price_paise = NULL,
    sort_order = 4
WHERE category_id = @painting_id
AND question_key = 'home_type'
AND option_value = 'independent-house';