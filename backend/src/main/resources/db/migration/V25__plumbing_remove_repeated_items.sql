-- ---------------------------------------------------------------------------
-- PLUMBING: SHOW EACH SERVICE ONCE
--
-- V14 transcribed the plumbing rate card faithfully, including four jobs that
-- the card lists under more than one tab, so the same job appeared two or
-- three times on the website:
--
--   Health Faucet Installation   Toilet Installation (₹299), Bathroom Fitting (₹299)
--                                and Tap & Faucet Installation (₹499, a separate
--                                'health-faucet-installation-tapfaucet' row) —
--                                one job, three listings, two prices.
--   Wall Mixer Installation      Tap & Faucet Installation, Bathroom Fitting (both ₹699)
--   Towel Rod Installation       Bathroom Fitting, Bathroom Accessories (both ₹299)
--   Bathroom Mirror Installation Bathroom Fitting, Bathroom Accessories (both ₹399)
--
-- Each job now lives under one tab:
--
--   Health Faucet Installation   -> Bathroom Fitting      (₹299)
--   Wall Mixer Installation      -> Bathroom Fitting      (₹699)
--   Towel Rod Installation       -> Bathroom Accessories  (₹299)
--   Bathroom Mirror Installation -> Bathroom Accessories  (₹399)
--
-- PRICE DECISION TO CONFIRM: Health Faucet is kept at ₹299 — the price the
-- Toilet and Bathroom Fitting tabs already agreed on (V14's note 2 flagged
-- the ₹499 Tap & Faucet listing, described "with holder and pipe", as the
-- odd one out and asked for confirmation). If ₹499 was the right price,
-- update price_paise on the surviving 'health-faucet-installation' row.
--
-- Soft-deactivated, not deleted, per the project's convention: a booking
-- already made keeps its own copy of what was ordered, and the frontend
-- (CartContext) maps an old saved cart's retired item onto the one that
-- replaced it. The frontend also shows each item once by itself
-- (PLUMBING_ITEM_HOME), so the site is correct with or without this
-- migration; this makes the database say the same thing.
-- ---------------------------------------------------------------------------

UPDATE service_options
SET active = FALSE
WHERE category_id = (SELECT id FROM service_categories WHERE slug = 'plumbing')
  AND question_key = 'cart_item'
  AND (
       (option_value = 'health-faucet-installation'           AND option_group = 'Toilet Installation')
    OR (option_value = 'health-faucet-installation-tapfaucet' AND option_group = 'Tap & Faucet Installation')
    OR (option_value = 'wall-mixer-installation'              AND option_group = 'Tap & Faucet Installation')
    OR (option_value = 'towel-rod-installation'               AND option_group = 'Bathroom Fitting')
    OR (option_value = 'bathroom-mirror-installation'         AND option_group = 'Bathroom Fitting')
  );
