-- Reversible account deletion (Apple App Store Guideline 5.1.1(v)).
-- Prefer: node scripts/addAccountDeletionColumns.js  (idempotent, uses the server's .env)

-- 1. Allow partners to be marked deleted, mirroring users.status.
ALTER TABLE partners
  MODIFY status ENUM('pending','approved','suspended','rejected','deleted') DEFAULT 'pending';

-- 2. Keep when the account was deleted, and the identifying fields the delete wipes, so an
--    admin can toggle the account back off "deleted" and recover the data.
ALTER TABLE users
  ADD COLUMN deletedAt DATETIME NULL DEFAULT NULL,
  ADD COLUMN deletedSnapshot JSON NULL DEFAULT NULL;

ALTER TABLE partners
  ADD COLUMN deletedAt DATETIME NULL DEFAULT NULL,
  ADD COLUMN deletedSnapshot JSON NULL DEFAULT NULL;
