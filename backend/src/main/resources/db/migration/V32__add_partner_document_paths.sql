-- Partner applications now include photos of the applicant's Aadhaar card
-- (front and back) and PAN card (front), stored privately in the uploads
-- folder. These columns hold their storage keys; they stay NULL for partners
-- who applied before documents were asked for.
ALTER TABLE partner_profiles
    ADD COLUMN aadhaar_front_path VARCHAR(500) NULL,
    ADD COLUMN aadhaar_back_path VARCHAR(500) NULL,
    ADD COLUMN pan_front_path VARCHAR(500) NULL;
