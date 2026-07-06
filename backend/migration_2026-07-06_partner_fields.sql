-- Adds the two partner fields the website's "Join Now" form already collects
-- (gender, home-services consent) but the mobile app registration didn't have yet.
-- Already applied to local dev; run this once on the production database.

ALTER TABLE partners ADD COLUMN IF NOT EXISTS gender ENUM('female','male') NULL AFTER professions;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS homeServicesConsent TINYINT(1) NULL DEFAULT 0 AFTER gender;
