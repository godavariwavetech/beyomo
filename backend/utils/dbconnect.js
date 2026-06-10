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
    // Backfill: wrap existing cityId values into a JSON array (idempotent — only fills NULL rows)
    await sequelize.query(`
      UPDATE service_categories
      SET cityIds = JSON_ARRAY(cityId)
      WHERE cityId IS NOT NULL AND (cityIds IS NULL OR JSON_LENGTH(cityIds) = 0)
    `).catch(() => {});
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
