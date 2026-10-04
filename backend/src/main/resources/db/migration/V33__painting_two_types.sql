-- Replace the old painting types in both current painting flows.
-- Existing booking answers are historical snapshots and remain unchanged.

UPDATE service_options AS options
JOIN service_categories AS category ON category.id = options.category_id
SET options.option_value = 'unfurnished-home',
    options.option_label = 'Unfurnished Home',
    options.option_hint = 'For an empty home without furniture.',
    options.sort_order = 1
WHERE category.slug = 'painting'
  AND options.question_key IN (
      'full_home_painting_type',
      'few_walls_painting_type'
  )
  AND options.option_value = 'standard-repaint';

UPDATE service_options AS options
JOIN service_categories AS category ON category.id = options.category_id
SET options.option_label = 'Renovation Painting',
    options.option_hint = 'For repainting existing or damaged walls.',
    options.sort_order = 2
WHERE category.slug = 'painting'
  AND options.question_key IN (
      'full_home_painting_type',
      'few_walls_painting_type'
  )
  AND options.option_value = 'renovation-painting';

DELETE options
FROM service_options AS options
JOIN service_categories AS category ON category.id = options.category_id
WHERE category.slug = 'painting'
  AND options.question_key IN (
      'full_home_painting_type',
      'few_walls_painting_type'
  )
  AND options.option_value = 'complete-repaint';