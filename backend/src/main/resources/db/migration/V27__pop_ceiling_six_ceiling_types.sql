-- Replace the design-style choices for both POP journeys with ceiling types.
-- Existing booking answers remain unchanged.
DELETE FROM service_options
WHERE category_id = (
    SELECT id FROM service_categories
    WHERE slug = 'pop-ceiling-design'
)
AND question_key IN (
    'pop_home_design_style',
    'pop_room_design_style'
);

INSERT INTO service_options
    (category_id, step_no, question_key, question_text, input_type, required,
     option_value, option_label, option_hint, option_group, sort_order)
SELECT
    c.id, s.step_no, s.question_key, 'Choose ceiling type', 'SINGLE', TRUE,
    o.option_value, o.option_label, o.option_hint, NULL, o.sort_order
FROM service_categories AS c
CROSS JOIN (
    SELECT 11 AS step_no, 'pop_home_design_style' AS question_key
    UNION ALL SELECT 21, 'pop_room_design_style'
) AS s
CROSS JOIN (
    SELECT 'flat-ceiling' AS option_value,
           'Flat Ceiling' AS option_label,
           'A clean, even ceiling' AS option_hint,
           1 AS sort_order
    UNION ALL
    SELECT 'double-layer-ceiling', 'Double Layer Ceiling',
           'Adds depth and dimension', 2
    UNION ALL
    SELECT 'floating-ceiling', 'Floating Ceiling',
           'A sleek floating effect', 3
    UNION ALL
    SELECT 'border-ceiling', 'Border Ceiling',
           'A clean border around the room', 4
    UNION ALL
    SELECT 'non-drop-ceiling', 'Non Drop Ceiling',
           'Simple, minimal and modern', 5
    UNION ALL
    SELECT 'recessed-ceiling', 'Recessed Ceiling',
           'A soft, luxurious glow', 6
) AS o
WHERE c.slug = 'pop-ceiling-design';