-- Clear previous painting option prices before introducing revised pricing.
-- Existing booking records and the category site-visit fee are unchanged.
UPDATE service_options
SET price_paise = NULL
WHERE category_id = (
    SELECT id
    FROM service_categories
    WHERE slug = 'painting'
);