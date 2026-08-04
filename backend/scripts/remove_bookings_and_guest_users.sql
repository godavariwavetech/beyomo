-- Wipes ALL bookings (and rows that hang directly off a booking), then deletes
-- "guest" users — anyone matching status='deleted', no name set, a listed test
-- phone number, or (snapshotted BEFORE the wipe) zero existing bookings.
-- Real users with a name/activity are left untouched. Partners are NOT touched.
--
-- IRREVERSIBLE. Back up first:
--   mysqldump -u USER -p beyomo > beyomo_backup_$(date +%Y%m%d).sql
--
-- Run with:
--   mysql -u USER -p beyomo < remove_bookings_and_guest_users.sql

SET FOREIGN_KEY_CHECKS = 0;

-- 0. Snapshot users with zero bookings RIGHT NOW — must happen before bookings
--    is truncated, since afterwards every user would trivially have zero bookings.
CREATE TEMPORARY TABLE _zero_booking_users AS
SELECT u.id FROM users u
LEFT JOIN bookings b ON b.userId = u.id
WHERE b.id IS NULL;

-- 1. Wipe bookings and everything that hangs directly off a booking row.
TRUNCATE TABLE payments;
TRUNCATE TABLE reviews;
-- partner_ledger_entries records partner wallet/settlement history keyed off
-- bookingId. Left in place by default since it affects partner payout records —
-- uncomment only if you also want that history gone:
-- TRUNCATE TABLE partner_ledger_entries;
TRUNCATE TABLE bookings;

-- 2. Build the guest-user id list.
--    Fill TEST_PHONES in with your actual dummy/test numbers.
CREATE TEMPORARY TABLE _guest_users AS
SELECT id FROM users
WHERE status = 'deleted'
   OR name IS NULL OR name = ''
   OR phone IN (/* TEST_PHONES: '9999999999', '8888888888' */ '__REPLACE_ME__')
   OR id IN (SELECT id FROM _zero_booking_users);

-- 3. Delete rows that reference those users.
DELETE FROM user_addresses WHERE userId IN (SELECT id FROM _guest_users);
DELETE FROM app_feedback   WHERE userId IN (SELECT id FROM _guest_users);
DELETE FROM notifications  WHERE userId IN (SELECT id FROM _guest_users);

-- 4. Delete the guest users themselves.
DELETE FROM users WHERE id IN (SELECT id FROM _guest_users);

SET FOREIGN_KEY_CHECKS = 1;

-- Sanity check after running:
-- SELECT (SELECT COUNT(*) FROM bookings) AS bookings_left,
--        (SELECT COUNT(*) FROM users)    AS users_left;
