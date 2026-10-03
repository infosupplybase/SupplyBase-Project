ALTER TABLE partner_profiles
    ADD COLUMN aadhaar_front_path VARCHAR(500),
    ADD COLUMN aadhaar_back_path VARCHAR(500),
    ADD COLUMN pan_front_path VARCHAR(500);