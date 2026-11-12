-- Login with OTP (2Factor) creates an account from just a name and a mobile
-- number, so an account may have no email. MySQL's unique key allows any
-- number of NULLs, so uk_users_email still stops two accounts sharing one.
ALTER TABLE users MODIFY email VARCHAR(190) NULL;
