-- Interior Design service-option prices are pending revised pricing.
-- Keep the existing site-visit fee and historical bookings unchanged.
UPDATE service_options
SET price_paise = NULL
WHERE category_id = (
    SELECT id
    FROM service_categories
    WHERE slug = 'interior-design'
);
