-- Adds a 'deleted' status to partners, mirroring users.status, to support
-- self-service account deletion (Apple App Store Guideline 5.1.1(v)).
ALTER TABLE partners
  MODIFY status ENUM('pending','approved','suspended','rejected','deleted') DEFAULT 'pending';
