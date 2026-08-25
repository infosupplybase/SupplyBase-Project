-- ---------------------------------------------------------------------------
-- GOOGLE SIGN-IN
--
-- A user can now arrive by password, by Google, or by both. That makes two
-- previously safe assumptions false:
--   1. every user has a password
--   2. an email address identifies an account on its own
-- ---------------------------------------------------------------------------

-- Someone who only ever signs in with Google has no password, and inventing a
-- random one for them would be a lie the reset flow would later trip over.
ALTER TABLE users
    MODIFY COLUMN password_hash VARCHAR(100) NULL;

-- Google's `sub` claim, not the email. Email is the wrong key: a Google
-- account can change its address, and two providers can assert the same
-- address. `sub` is stable and unique for the life of the account.
ALTER TABLE users
    ADD COLUMN google_sub VARCHAR(64) NULL AFTER password_hash,
    ADD COLUMN picture_url VARCHAR(500) NULL AFTER phone,
    ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT FALSE AFTER email;

-- UNIQUE rather than a plain index: one Google account must map to at most one
-- user here, or a race between two sign-ins could create a duplicate.
ALTER TABLE users
    ADD UNIQUE KEY uk_users_google_sub (google_sub);

-- Existing password accounts predate any verification step, so their addresses
-- are unconfirmed. Google-linked rows get TRUE at link time, not here.
UPDATE users SET email_verified = FALSE WHERE google_sub IS NULL;
