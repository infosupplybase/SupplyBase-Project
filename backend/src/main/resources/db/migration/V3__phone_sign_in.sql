-- ---------------------------------------------------------------------------
-- SIGNING IN WITH A PHONE NUMBER
--
-- A phone number can now identify an account, which means it has to be stored
-- in exactly one form and belong to exactly one person.
-- ---------------------------------------------------------------------------

-- Reduce anything already stored to its ten national digits, so old rows match
-- the same rule new ones are written under. Runs in the same order as
-- PhoneNumbers.normalise(): strip non-digits, then the +91, then a leading 0.
UPDATE users
SET phone = REGEXP_REPLACE(phone, '[^0-9]', '')
WHERE phone IS NOT NULL;

UPDATE users
SET phone = SUBSTRING(phone, 3)
WHERE phone IS NOT NULL AND CHAR_LENGTH(phone) = 12 AND phone LIKE '91%';

UPDATE users
SET phone = SUBSTRING(phone, 2)
WHERE phone IS NOT NULL AND CHAR_LENGTH(phone) = 11 AND phone LIKE '0%';

-- Anything still not ten digits was never a usable number. Blank it rather
-- than let it sit there looking like a login credential that will never work.
UPDATE users
SET phone = NULL
WHERE phone IS NOT NULL AND CHAR_LENGTH(phone) <> 10;

-- One number, one account — otherwise "sign in with your phone" has no single
-- answer. MySQL allows many NULLs in a UNIQUE index, so accounts without a
-- number (Google sign-ups) are unaffected.
ALTER TABLE users
    ADD UNIQUE KEY uk_users_phone (phone);
