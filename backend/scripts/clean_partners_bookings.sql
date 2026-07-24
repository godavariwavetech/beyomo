-- Clears all partners (app + website sign-ups), customers/users, bookings/orders,
-- and their directly-dependent tables. Run manually on the production database
-- (e.g. via phpMyAdmin, or `mysql -u USER -p beyomo < clean_partners_bookings.sql`).
-- IRREVERSIBLE — back up the database first.

SET FOREIGN_KEY_CHECKS = 0;

-- Dependent on bookings
TRUNCATE TABLE payments;
TRUNCATE TABLE reviews;

-- Dependent on partners
TRUNCATE TABLE partner_services;
TRUNCATE TABLE partner_skill_categories;
TRUNCATE TABLE partner_settlements;
TRUNCATE TABLE partner_ledger_entries;

-- Dependent on users
TRUNCATE TABLE user_addresses;
TRUNCATE TABLE app_feedback;

-- Notifications tied to a specific partner or user (keeps general/broadcast notifications intact)
DELETE FROM notifications WHERE partnerId IS NOT NULL OR userId IS NOT NULL;

-- Main tables (partners includes both source='app' and source='website' rows)
TRUNCATE TABLE bookings;
TRUNCATE TABLE partners;
TRUNCATE TABLE users;

SET FOREIGN_KEY_CHECKS = 1;
