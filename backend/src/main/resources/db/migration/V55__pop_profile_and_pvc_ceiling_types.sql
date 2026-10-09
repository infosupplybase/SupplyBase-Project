-- Replace two ceiling types in both Full Home POP and Room POP.
-- Existing applied migrations remain unchanged.

DELETE FROM service_options
WHERE category_id = (
    SELECT id FROM service_categories
    WHERE slug = 'pop-ceiling-design'
)
AND question_key IN (
    'pop_home_design_style',
    'pop_room_design_style'
)
AND option_value IN (
    'non-drop-ceiling',
    'recessed-ceiling'
);

INSERT INTO service_options (
    category_id,
    step_no,
    question_key,
    question_text,
    input_type,
    required,
    option_value,
    option_label,
    option_hint,
    option_group,
    sort_order
)
SELECT
    c.id,
    q.step_no,
    q.question_key,
    'Choose ceiling type',
    'SINGLE',
    TRUE,
    o.option_value,
    o.option_label,
    o.option_hint,
    NULL,
    o.sort_order
FROM service_categories c
CROSS JOIN (
    SELECT 11 AS step_no,
           'pop_home_design_style' AS question_key
    UNION ALL
    SELECT 21, 'pop_room_design_style'
) q
CROSS JOIN (
    SELECT
        'profile-pop' AS option_value,
        'Profile POP' AS option_label,
        'POP ceiling with slim profile LED lighting' AS option_hint,
        5 AS sort_order
    UNION ALL
    SELECT
        'pvc-panel-pop',
        'PVC Panel POP',
        'A neat ceiling finished with PVC panels',
        6
) o
WHERE c.slug = 'pop-ceiling-design';
