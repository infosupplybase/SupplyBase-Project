DELETE FROM service_options
WHERE category_id = (
    SELECT id FROM service_categories WHERE slug = 'painting'
)
AND question_key = 'few_walls_painting_type';