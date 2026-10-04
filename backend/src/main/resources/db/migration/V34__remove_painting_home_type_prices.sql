-- Home type identifies the property and does not contribute to pricing.
UPDATE service_options
SET price_paise = NULL
WHERE category_id = (
    SELECT id
    FROM service_categories
    WHERE slug = 'painting'
)
AND question_key = 'home_type';