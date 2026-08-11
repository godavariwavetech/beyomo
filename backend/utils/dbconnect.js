const { Sequelize } = require("sequelize");
const logger = require("./logger");
const config = require("../config");

const sequelize = new Sequelize(config.DB_NAME, config.DB_USER, config.DB_PASS, {
  host: config.DB_HOST,
  port: config.DB_PORT,
  dialect: "mysql",
  logging: false,
  pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
  define: { underscored: false, freezeTableName: false },
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    logger.info("MySQL connected successfully");

    // Load all models (registers them with sequelize)
    require("./models");

    // Sync tables — create if not exists, never alter (alter:true duplicates indexes on every restart)
    await sequelize.sync();
    logger.info("Database tables synced");

    // One-time safe column additions (IF NOT EXISTS is idempotent)
    await sequelize.query("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS services JSON NULL").catch(() => {});
    await sequelize.query("ALTER TABLE cities ADD COLUMN IF NOT EXISTS lat FLOAT NULL").catch(() => {});
    await sequelize.query("ALTER TABLE cities ADD COLUMN IF NOT EXISTS lng FLOAT NULL").catch(() => {});
    await sequelize.query("ALTER TABLE cities ADD COLUMN IF NOT EXISTS radius FLOAT NULL DEFAULT 30").catch(() => {});
    await sequelize.query("ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS fcmToken TEXT NULL").catch(() => {});
    await sequelize.query("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS offerId INT NULL").catch(() => {});
    await sequelize.query("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS serviceUpdatePending TINYINT(1) NOT NULL DEFAULT 0").catch(() => {});
    await sequelize.query("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS pendingServicesUpdate JSON NULL").catch(() => {});
    await sequelize.query("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS lastServiceUpdateDecision ENUM('approved','rejected') NULL").catch(() => {});
    await sequelize.query("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS arrivedAt DATETIME NULL").catch(() => {});
    // Migrate legacy services.cityId → service_city_map (idempotent via INSERT IGNORE)
    await sequelize.query(`
      INSERT IGNORE INTO service_city_map (serviceId, cityId, isActive, createdAt, updatedAt)
      SELECT id, cityId, isActive, NOW(), NOW()
      FROM services
      WHERE cityId IS NOT NULL
    `).catch(() => {});
    // Add cityIds JSON column to service_categories (replaces single cityId)
    await sequelize.query("ALTER TABLE service_categories ADD COLUMN IF NOT EXISTS cityIds JSON NULL").catch(() => {});
    // Add cityIds JSON column to coupons (empty array = all cities)
    await sequelize.query("ALTER TABLE coupons ADD COLUMN IF NOT EXISTS cityIds JSON NULL").catch(() => {});
    // Revenue split on service categories
    await sequelize.query("ALTER TABLE service_categories ADD COLUMN IF NOT EXISTS adminPercent DECIMAL(5,2) NOT NULL DEFAULT 20.00").catch(() => {});
    await sequelize.query("ALTER TABLE service_categories ADD COLUMN IF NOT EXISTS partnerPercent DECIMAL(5,2) NOT NULL DEFAULT 80.00").catch(() => {});
    await sequelize.query("ALTER TABLE service_categories ADD COLUMN IF NOT EXISTS gstPercent DECIMAL(5,2) NOT NULL DEFAULT 18.00").catch(() => {});
    // cityIds on service_packages (city-restricted packages)
    await sequelize.query("ALTER TABLE service_packages ADD COLUMN IF NOT EXISTS cityIds JSON NULL").catch(() => {});
    // Add packageId to bookings
    await sequelize.query("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS packageId INT NULL").catch(() => {});
    // Reschedule tracking on bookings
    await sequelize.query("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS previousScheduledAt DATETIME NULL").catch(() => {});
    await sequelize.query("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS rescheduledCount INT NOT NULL DEFAULT 0").catch(() => {});
    await sequelize.query("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS rescheduledBy ENUM('user','partner','admin') NULL").catch(() => {});
    await sequelize.query("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS rescheduleReason TEXT NULL").catch(() => {});
    // Payment mode (online vs cash-on-delivery) + partner settlement wallet
    await sequelize.query("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS paymentMode ENUM('online','cod') NOT NULL DEFAULT 'online'").catch(() => {});
    await sequelize.query("ALTER TABLE partners ADD COLUMN IF NOT EXISTS walletBalance DECIMAL(12,2) NOT NULL DEFAULT 0").catch(() => {});
    // Offer banner image
    await sequelize.query("ALTER TABLE offers ADD COLUMN IF NOT EXISTS image TEXT NULL").catch(() => {});
    // GST lowered from 18% to 5% — backfill categories still sitting at the old default
    await sequelize.query("UPDATE service_categories SET gstPercent = 5.00 WHERE gstPercent = 18.00").catch(() => {});
    // Revenue split + GST overrides on packages and offers (mirrors service_categories)
    await sequelize.query("ALTER TABLE service_packages ADD COLUMN IF NOT EXISTS adminPercent DECIMAL(5,2) NOT NULL DEFAULT 20.00").catch(() => {});
    await sequelize.query("ALTER TABLE service_packages ADD COLUMN IF NOT EXISTS partnerPercent DECIMAL(5,2) NOT NULL DEFAULT 80.00").catch(() => {});
    await sequelize.query("ALTER TABLE service_packages ADD COLUMN IF NOT EXISTS gstPercent DECIMAL(5,2) NOT NULL DEFAULT 5.00").catch(() => {});
    await sequelize.query("ALTER TABLE offers ADD COLUMN IF NOT EXISTS adminPercent DECIMAL(5,2) NOT NULL DEFAULT 20.00").catch(() => {});
    await sequelize.query("ALTER TABLE offers ADD COLUMN IF NOT EXISTS partnerPercent DECIMAL(5,2) NOT NULL DEFAULT 80.00").catch(() => {});
    await sequelize.query("ALTER TABLE offers ADD COLUMN IF NOT EXISTS gstPercent DECIMAL(5,2) NOT NULL DEFAULT 5.00").catch(() => {});
    // Backfill: wrap existing cityId values into a JSON array (idempotent — only fills NULL rows)
    await sequelize.query(`
      UPDATE service_categories
      SET cityIds = JSON_ARRAY(cityId)
      WHERE cityId IS NOT NULL AND (cityIds IS NULL OR JSON_LENGTH(cityIds) = 0)
    `).catch(() => {});
    // Partner registration fields — profession/gender/skills/documents/bank details
    // (added to the Partner model but sync() never alters an existing table, so these
    // need explicit ALTER statements like everything else above)
    await sequelize.query("ALTER TABLE partners ADD COLUMN IF NOT EXISTS gender ENUM('female','male') NULL").catch(() => {});
    await sequelize.query("ALTER TABLE partners ADD COLUMN IF NOT EXISTS professions TEXT NULL").catch(() => {});
    await sequelize.query("ALTER TABLE partners ADD COLUMN IF NOT EXISTS homeServicesConsent TINYINT(1) NULL DEFAULT 0").catch(() => {});
    await sequelize.query("ALTER TABLE partners ADD COLUMN IF NOT EXISTS serviceCategoryIds TEXT NULL").catch(() => {});
    await sequelize.query("ALTER TABLE partners ADD COLUMN IF NOT EXISTS profilePicture TEXT NULL").catch(() => {});
    await sequelize.query("ALTER TABLE partners ADD COLUMN IF NOT EXISTS aadharUrl TEXT NULL").catch(() => {});
    await sequelize.query("ALTER TABLE partners ADD COLUMN IF NOT EXISTS agreementUrl TEXT NULL").catch(() => {});
    await sequelize.query("ALTER TABLE partners ADD COLUMN IF NOT EXISTS panUrl TEXT NULL").catch(() => {});
    await sequelize.query("ALTER TABLE partners ADD COLUMN IF NOT EXISTS bankAccountNo VARCHAR(30) NULL").catch(() => {});
    await sequelize.query("ALTER TABLE partners ADD COLUMN IF NOT EXISTS bankIfsc VARCHAR(20) NULL").catch(() => {});
    await sequelize.query("ALTER TABLE partners ADD COLUMN IF NOT EXISTS bankName VARCHAR(100) NULL").catch(() => {});
    await sequelize.query("ALTER TABLE partners ADD COLUMN IF NOT EXISTS bankHolderName VARCHAR(100) NULL").catch(() => {});
    // Admin-selected packages/combos featured on the app's home screen header carousel
    await sequelize.query("ALTER TABLE service_packages ADD COLUMN IF NOT EXISTS showOnHome TINYINT(1) NOT NULL DEFAULT 0").catch(() => {});
    // Admin-selected categories featured on the app header / website home page
    await sequelize.query("ALTER TABLE service_categories ADD COLUMN IF NOT EXISTS showOnHome TINYINT(1) NOT NULL DEFAULT 0").catch(() => {});
    // Support/admin-created bookings (e.g. phone-in one-time service requests)
    await sequelize.query("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS createdByAdminId INT NULL").catch(() => {});
    await sequelize.query("ALTER TABLE bookings MODIFY COLUMN serviceId INT NULL").catch(() => {});
    // Admin-configurable display order for services within a category
    await sequelize.query("ALTER TABLE services ADD COLUMN IF NOT EXISTS sortOrder INT NOT NULL DEFAULT 0").catch(() => {});
    // How many copies of a package/combo were booked (mirrors per-service qty)
    await sequelize.query("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS packageQty INT NOT NULL DEFAULT 1").catch(() => {});
    // Simplify banners: type now directly identifies the site/app slot it fills (one
    // active image per slot) instead of a generic top/promo card nobody ever finished
    // building the title/subtitle/gradient/target-screen machinery for. Widen the enum
    // first so the old values stay valid while remapping, then narrow it — doing this in
    // the other order silently truncates every row to '' (MySQL enum-mismatch behavior).
    await sequelize.query("ALTER TABLE banners MODIFY COLUMN type ENUM('top','promo','hero','custom_package','combo') NOT NULL DEFAULT 'hero'").catch(() => {});
    await sequelize.query("DELETE FROM banners WHERE type = 'promo'").catch(() => {});
    await sequelize.query("UPDATE banners SET type = 'hero' WHERE type = 'top'").catch(() => {});
    await sequelize.query("ALTER TABLE banners MODIFY COLUMN type ENUM('hero','custom_package','combo','why_beyomo','book_steps') NOT NULL DEFAULT 'hero'").catch(() => {});
    await sequelize.query("ALTER TABLE banners MODIFY COLUMN title VARCHAR(120) NULL").catch(() => {});
    // Additional banner image slots (image2, image3) for extra images per banner
    await sequelize.query("ALTER TABLE banners ADD COLUMN IF NOT EXISTS image2 TEXT NULL").catch(() => {});
    await sequelize.query("ALTER TABLE banners ADD COLUMN IF NOT EXISTS image3 TEXT NULL").catch(() => {});
    // Rate-card "Starts From" price indicator — was previously only encoded as free-text
    // inside services.description (e.g. "Starts From", "Women, Starts From") by the
    // 2026-07-17 rate-card import script; promote it to a real flag and strip the marker
    // text back out of the description so it reads like a normal description again.
    await sequelize.query("ALTER TABLE services ADD COLUMN IF NOT EXISTS priceStartsFrom TINYINT(1) NOT NULL DEFAULT 0").catch(() => {});
    await sequelize.query("UPDATE services SET priceStartsFrom = 1 WHERE description LIKE '%Starts From%' AND priceStartsFrom = 0").catch(() => {});
    await sequelize.query("UPDATE services SET description = TRIM(TRAILING ', ' FROM REPLACE(description, 'Starts From', '')) WHERE description LIKE '%Starts From%'").catch(() => {});
    logger.info("Column migrations applied");

    // Seed cities — INSERT IGNORE skips if name already exists (unique constraint)
    await sequelize.query(`
      INSERT IGNORE INTO cities (name, state, lat, lng, radius, isActive, createdAt, updatedAt) VALUES
        ('Hyderabad',  'Telangana',       17.3850,  78.4867,  30, 1, NOW(), NOW()),
        ('Bangalore',  'Karnataka',       12.9716,  77.5946,  30, 1, NOW(), NOW()),
        ('Chennai',    'Tamil Nadu',      13.0827,  80.2707,  30, 1, NOW(), NOW()),
        ('Mumbai',     'Maharashtra',     19.0760,  72.8777,  40, 1, NOW(), NOW()),
        ('Pune',       'Maharashtra',     18.5204,  73.8567,  25, 1, NOW(), NOW()),
        ('Delhi',      'Delhi',           28.6139,  77.2090,  40, 1, NOW(), NOW()),
        ('Kolkata',    'West Bengal',     22.5726,  88.3639,  35, 1, NOW(), NOW()),
        ('Ahmedabad',  'Gujarat',         23.0225,  72.5714,  25, 1, NOW(), NOW()),
        ('Jaipur',     'Rajasthan',       26.9124,  75.7873,  25, 1, NOW(), NOW()),
        ('Visakhapatnam', 'Andhra Pradesh', 17.6868, 83.2185, 25, 1, NOW(), NOW())
    `).catch(() => {});
    logger.info("City seeds applied");
  } catch (error) {
    logger.error(`MySQL connection error: ${error.message}`);
    process.exit(1);
  }
};

const getDBStatus = () => {
  try {
    return sequelize.connectionManager.pool ? "connected" : "disconnected";
  } catch {
    return "unknown";
  }
};

module.exports = { sequelize, connectDB, getDBStatus };
