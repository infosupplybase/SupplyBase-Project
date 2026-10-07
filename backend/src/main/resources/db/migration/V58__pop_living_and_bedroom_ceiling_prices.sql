CREATE TABLE pop_ceiling_room_design_prices (
    id BIGINT NOT NULL AUTO_INCREMENT,
    room_type VARCHAR(80) NOT NULL,
    ceiling_type VARCHAR(80) NOT NULL,
    price_paise BIGINT NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_pop_room_ceiling_price (room_type, ceiling_type)
);

INSERT INTO pop_ceiling_room_design_prices
    (room_type, ceiling_type, price_paise)
VALUES
    ('living-room', 'flat-ceiling',         1199900),
    ('living-room', 'double-layer-ceiling', 1499900),
    ('living-room', 'floating-ceiling',     1399900),
    ('living-room', 'border-ceiling',       1699900),
    ('living-room', 'profile-pop',          1799900),
    ('living-room', 'pvc-panel-pop',        1099900),

    ('bedroom', 'flat-ceiling',             1199900),
    ('bedroom', 'double-layer-ceiling',     1199900),
    ('bedroom', 'floating-ceiling',         1599900),
    ('bedroom', 'border-ceiling',           1399900),
    ('bedroom', 'profile-pop',              1699900),
    ('bedroom', 'pvc-panel-pop',            1099900);

-- Remove the old single prices for these two rooms.
-- The other four room prices remain unchanged.
DELETE FROM pop_ceiling_room_prices
WHERE room_type IN ('living-room', 'bedroom');
