-- Preserve the room question's existing metadata.
CREATE TEMPORARY TABLE pop_room_question_template AS
SELECT category_id, step_no, question_key, question_text,
       input_type, required
FROM service_options
WHERE category_id = (
    SELECT id FROM service_categories
    WHERE slug = 'pop-ceiling-design'
)
AND question_key = 'pop_room_type'
ORDER BY id
LIMIT 1;

-- Physically replace the old room choices.
DELETE FROM service_options
WHERE category_id = (
    SELECT id FROM service_categories
    WHERE slug = 'pop-ceiling-design'
)
AND question_key = 'pop_room_type';

INSERT INTO service_options (
    category_id, step_no, question_key, question_text,
    input_type, required, option_value, option_label,
    option_hint, option_group, sort_order, active, price_paise
)
SELECT
    q.category_id, q.step_no, q.question_key, q.question_text,
    q.input_type, q.required, o.option_value, o.option_label,
    NULL, NULL, o.sort_order, TRUE, NULL
FROM pop_room_question_template q
CROSS JOIN (
    SELECT 'living-room' AS option_value,
           'Living Room' AS option_label, 1 AS sort_order
    UNION ALL SELECT 'bedroom', 'Bedroom', 2
    UNION ALL SELECT 'balcony-pvc', 'Balcony PVC', 3
    UNION ALL SELECT 'kitchen', 'Kitchen', 4
    UNION ALL SELECT 'passage-pvc', 'Passage PVC', 5
    UNION ALL SELECT 'bathroom-pvc', 'Bathroom PVC', 6
) o;

DROP TEMPORARY TABLE pop_room_question_template;

CREATE TABLE pop_ceiling_room_prices (
    id BIGINT NOT NULL AUTO_INCREMENT,
    room_type VARCHAR(80) NOT NULL,
    price_paise BIGINT NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_pop_room_price (room_type)
);

INSERT INTO pop_ceiling_room_prices (room_type, price_paise)
VALUES
    ('living-room', 1199900),
    ('bedroom',      899900),
    ('balcony-pvc',  599900),
    ('kitchen',      699900),
    ('passage-pvc',  499900),
    ('bathroom-pvc', 499900);

-- Prices are shown at the estimate, never on selection cards.
UPDATE service_options
SET price_paise = NULL
WHERE category_id = (
    SELECT id FROM service_categories
    WHERE slug = 'pop-ceiling-design'
)
AND question_key = 'pop_room_design_style';
