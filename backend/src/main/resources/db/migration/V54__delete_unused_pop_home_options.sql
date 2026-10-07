DELETE FROM service_options
WHERE category_id = (
    SELECT id
    FROM service_categories
    WHERE slug = 'pop-ceiling-design'
)
AND question_key = 'pop_home_type'
AND option_value IN ('villa-independent-house', 'duplex');
