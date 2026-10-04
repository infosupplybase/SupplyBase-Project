UPDATE service_options
SET option_value = 'Interior Waterproofing',
    option_label = 'Interior Waterproofing'
WHERE category_id = (
    SELECT id FROM service_categories
    WHERE slug = 'waterproofing'
)
AND option_value = 'Bathroom Wall Waterproofing';
