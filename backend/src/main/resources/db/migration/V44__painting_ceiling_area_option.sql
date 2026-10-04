SET @painting_id = (
    SELECT id FROM service_categories WHERE slug = 'painting'
);

UPDATE service_options
SET question_text = 'What do you want to paint?'
WHERE category_id = @painting_id
AND question_key = 'few_walls_area';

INSERT INTO service_options
    (category_id, step_no, question_key, question_text,
     input_type, required, option_value, option_label,
     option_hint, option_group, price_paise, sort_order, active)
VALUES
(@painting_id, 1, 'few_walls_area', 'What do you want to paint?',
 'SINGLE', TRUE, 'ceiling-paint', 'Ceiling Paint',
 NULL, NULL, NULL, 4, TRUE);