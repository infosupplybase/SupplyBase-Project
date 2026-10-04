SET @painting_id = (
    SELECT id FROM service_categories WHERE slug = 'painting'
);

DELETE FROM service_options
WHERE category_id = @painting_id
AND question_key = 'few_walls_area';

INSERT INTO service_options
    (category_id, step_no, question_key, question_text,
     input_type, required, option_value, option_label,
     option_hint, option_group, price_paise, sort_order, active)
VALUES
(@painting_id, 1, 'few_walls_area', 'How many walls do you want to paint?',
 'SINGLE', TRUE, '1-wall', '1 Wall',
 NULL, NULL, NULL, 1, TRUE),

(@painting_id, 1, 'few_walls_area', 'How many walls do you want to paint?',
 'SINGLE', TRUE, '2-walls', '2 Walls',
 NULL, NULL, NULL, 2, TRUE),

(@painting_id, 1, 'few_walls_area', 'How many walls do you want to paint?',
 'SINGLE', TRUE, 'multiple-walls', 'Multiple Walls',
 NULL, NULL, NULL, 3, TRUE);