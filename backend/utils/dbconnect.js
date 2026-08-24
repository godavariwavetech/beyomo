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

// ─────────────────────────────────────────────────────────────────────────────
// Additive schema statements — safe to run on every boot.
//
// `ADD COLUMN IF NOT EXISTS` is genuinely idempotent: it touches nothing once the
// column is there, and never rewrites row data. Anything that CHANGES existing rows
// (UPDATE/DELETE, or an ALTER that can coerce values) does NOT belong here — it goes
// in ONE_TIME_MIGRATIONS below, because this list re-runs on every `pm2 restart`.
// ─────────────────────────────────────────────────────────────────────────────
const ADDITIVE_SCHEMA = [
  "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS services JSON NULL",
  "ALTER TABLE cities ADD COLUMN IF NOT EXISTS lat FLOAT NULL",
  "ALTER TABLE cities ADD COLUMN IF NOT EXISTS lng FLOAT NULL",
  "ALTER TABLE cities ADD COLUMN IF NOT EXISTS radius FLOAT NULL DEFAULT 30",
  "ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS fcmToken TEXT NULL",
  "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS offerId INT NULL",
  "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS serviceUpdatePending TINYINT(1) NOT NULL DEFAULT 0",
  "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS pendingServicesUpdate JSON NULL",
  "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS lastServiceUpdateDecision ENUM('approved','rejected') NULL",
  "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS arrivedAt DATETIME NULL",
  // cityIds JSON column on service_categories (replaces single cityId) and on coupons
  // (empty array = all cities)
  "ALTER TABLE service_categories ADD COLUMN IF NOT EXISTS cityIds JSON NULL",
  "ALTER TABLE coupons ADD COLUMN IF NOT EXISTS cityIds JSON NULL",
  // Revenue split on service categories
  "ALTER TABLE service_categories ADD COLUMN IF NOT EXISTS adminPercent DECIMAL(5,2) NOT NULL DEFAULT 20.00",
  "ALTER TABLE service_categories ADD COLUMN IF NOT EXISTS partnerPercent DECIMAL(5,2) NOT NULL DEFAULT 80.00",
  "ALTER TABLE service_categories ADD COLUMN IF NOT EXISTS gstPercent DECIMAL(5,2) NOT NULL DEFAULT 5.00",
  // cityIds on service_packages (city-restricted packages)
  "ALTER TABLE service_packages ADD COLUMN IF NOT EXISTS cityIds JSON NULL",
  "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS packageId INT NULL",
  // Reschedule tracking on bookings
  "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS previousScheduledAt DATETIME NULL",
  "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS rescheduledCount INT NOT NULL DEFAULT 0",
  "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS rescheduledBy ENUM('user','partner','admin') NULL",
  "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS rescheduleReason TEXT NULL",
  // Payment mode (online vs cash-on-delivery) + partner settlement wallet
  "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS paymentMode ENUM('online','cod') NOT NULL DEFAULT 'online'",
  "ALTER TABLE partners ADD COLUMN IF NOT EXISTS walletBalance DECIMAL(12,2) NOT NULL DEFAULT 0",
  "ALTER TABLE offers ADD COLUMN IF NOT EXISTS image TEXT NULL",
  // Revenue split + GST overrides on packages and offers (mirrors service_categories)
  "ALTER TABLE service_packages ADD COLUMN IF NOT EXISTS adminPercent DECIMAL(5,2) NOT NULL DEFAULT 20.00",
  "ALTER TABLE service_packages ADD COLUMN IF NOT EXISTS partnerPercent DECIMAL(5,2) NOT NULL DEFAULT 80.00",
  "ALTER TABLE service_packages ADD COLUMN IF NOT EXISTS gstPercent DECIMAL(5,2) NOT NULL DEFAULT 5.00",
  "ALTER TABLE offers ADD COLUMN IF NOT EXISTS adminPercent DECIMAL(5,2) NOT NULL DEFAULT 20.00",
  "ALTER TABLE offers ADD COLUMN IF NOT EXISTS partnerPercent DECIMAL(5,2) NOT NULL DEFAULT 80.00",
  "ALTER TABLE offers ADD COLUMN IF NOT EXISTS gstPercent DECIMAL(5,2) NOT NULL DEFAULT 5.00",
  // Partner registration fields — profession/gender/skills/documents/bank details
  // (added to the Partner model but sync() never alters an existing table, so these
  // need explicit ALTER statements like everything else here)
  "ALTER TABLE partners ADD COLUMN IF NOT EXISTS gender ENUM('female','male') NULL",
  "ALTER TABLE partners ADD COLUMN IF NOT EXISTS professions TEXT NULL",
  "ALTER TABLE partners ADD COLUMN IF NOT EXISTS homeServicesConsent TINYINT(1) NULL DEFAULT 0",
  "ALTER TABLE partners ADD COLUMN IF NOT EXISTS serviceCategoryIds TEXT NULL",
  "ALTER TABLE partners ADD COLUMN IF NOT EXISTS profilePicture TEXT NULL",
  "ALTER TABLE partners ADD COLUMN IF NOT EXISTS aadharUrl TEXT NULL",
  "ALTER TABLE partners ADD COLUMN IF NOT EXISTS agreementUrl TEXT NULL",
  "ALTER TABLE partners ADD COLUMN IF NOT EXISTS panUrl TEXT NULL",
  "ALTER TABLE partners ADD COLUMN IF NOT EXISTS bankAccountNo VARCHAR(30) NULL",
  "ALTER TABLE partners ADD COLUMN IF NOT EXISTS bankIfsc VARCHAR(20) NULL",
  "ALTER TABLE partners ADD COLUMN IF NOT EXISTS bankName VARCHAR(100) NULL",
  "ALTER TABLE partners ADD COLUMN IF NOT EXISTS bankHolderName VARCHAR(100) NULL",
  // Admin-selected packages/combos + categories featured on the app home screen
  "ALTER TABLE service_packages ADD COLUMN IF NOT EXISTS showOnHome TINYINT(1) NOT NULL DEFAULT 0",
  "ALTER TABLE service_categories ADD COLUMN IF NOT EXISTS showOnHome TINYINT(1) NOT NULL DEFAULT 0",
  // Support/admin-created bookings (e.g. phone-in one-time service requests)
  "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS createdByAdminId INT NULL",
  // Admin-configurable display order for services within a category
  "ALTER TABLE services ADD COLUMN IF NOT EXISTS sortOrder INT NOT NULL DEFAULT 0",
  // How many copies of a package/combo were booked (mirrors per-service qty)
  "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS packageQty INT NOT NULL DEFAULT 1",
  // Additional banner image slots (image2, image3) for extra images per banner
  "ALTER TABLE banners ADD COLUMN IF NOT EXISTS image2 TEXT NULL",
  "ALTER TABLE banners ADD COLUMN IF NOT EXISTS image3 TEXT NULL",
  // Rate-card "Starts From" price indicator
  "ALTER TABLE services ADD COLUMN IF NOT EXISTS priceStartsFrom TINYINT(1) NOT NULL DEFAULT 0",
  // Admin-curated "Most Booked Services" flag for the app home screen
  "ALTER TABLE services ADD COLUMN IF NOT EXISTS isPopular TINYINT(1) NOT NULL DEFAULT 0",
  "ALTER TABLE services ADD COLUMN IF NOT EXISTS showOnHome TINYINT(1) NOT NULL DEFAULT 0",
  // City prefix code for the city+year+series booking ID format (e.g. NLR2600001)
  "ALTER TABLE cities ADD COLUMN IF NOT EXISTS code VARCHAR(5) NULL",
];

// ─────────────────────────────────────────────────────────────────────────────
// One-time migrations — recorded in `schema_migrations` and never re-run.
//
// These rewrite existing rows, so re-running them on every restart silently reverted
// whatever an admin had changed in the dashboard since the last deploy: a category's
// GST edited back down to 5%, a re-enabled city switched off again, a service
// description stripped, banner rows coerced by an enum narrowing. Each entry now runs
// exactly once per database; the ledger is what makes the difference.
//
// Adding a new one: append it with a fresh, never-reused key. Editing the SQL of a key
// that has already been applied does nothing — give it a new key instead.
// ─────────────────────────────────────────────────────────────────────────────
const ONE_TIME_MIGRATIONS = [
  {
    key: "2026-07-05_service_city_map_backfill",
    description: "Migrate legacy services.cityId into service_city_map",
    statements: [`
      INSERT IGNORE INTO service_city_map (serviceId, cityId, isActive, createdAt, updatedAt)
      SELECT id, cityId, isActive, NOW(), NOW()
      FROM services
      WHERE cityId IS NOT NULL
    `],
  },
  {
    key: "2026-07-06_category_gst_18_to_5",
    description: "GST lowered from 18% to 5% — backfill categories still on the old default",
    statements: ["UPDATE service_categories SET gstPercent = 5.00 WHERE gstPercent = 18.00"],
  },
  {
    key: "2026-07-06_category_cityids_backfill",
    description: "Wrap existing service_categories.cityId values into a JSON array",
    statements: [`
      UPDATE service_categories
      SET cityIds = JSON_ARRAY(cityId)
      WHERE cityId IS NOT NULL AND (cityIds IS NULL OR JSON_LENGTH(cityIds) = 0)
    `],
  },
  {
    key: "2026-07-15_bookings_serviceid_nullable",
    description: "A booking made entirely of custom add-ons has no catalog serviceId",
    statements: ["ALTER TABLE bookings MODIFY COLUMN serviceId INT NULL"],
  },
  {
    key: "2026-07-16_banner_type_slots",
    description: "Banner type now identifies the site/app slot it fills",
    // The widen step drops 'why_beyomo'/'book_steps' from the enum, so re-running this
    // after the final narrow put every banner row on those two slots at risk of being
    // coerced to '' (MySQL enum-mismatch behavior under a non-strict sql_mode).
    statements: [
      "ALTER TABLE banners MODIFY COLUMN type ENUM('top','promo','hero','custom_package','combo') NOT NULL DEFAULT 'hero'",
      "DELETE FROM banners WHERE type = 'promo'",
      "UPDATE banners SET type = 'hero' WHERE type = 'top'",
      "ALTER TABLE banners MODIFY COLUMN type ENUM('hero','custom_package','combo','why_beyomo','book_steps') NOT NULL DEFAULT 'hero'",
      "ALTER TABLE banners MODIFY COLUMN title VARCHAR(120) NULL",
    ],
  },
  {
    key: "2026-07-17_service_price_starts_from",
    description: "Promote the rate-card 'Starts From' marker text to a real flag",
    statements: [
      "UPDATE services SET priceStartsFrom = 1 WHERE description LIKE '%Starts From%' AND priceStartsFrom = 0",
      "UPDATE services SET description = TRIM(TRAILING ', ' FROM REPLACE(description, 'Starts From', '')) WHERE description LIKE '%Starts From%'",
    ],
  },
  {
    key: "2026-07-20_seed_nellore_city",
    description: "Seed the Nellore service city",
    statements: [`
      INSERT IGNORE INTO cities (name, state, lat, lng, radius, isActive, createdAt, updatedAt) VALUES
        ('Nellore', 'Andhra Pradesh', 14.4494, 79.9874, 30, 1, NOW(), NOW())
    `],
  },
  {
    key: "2026-07-20_city_code_nlr",
    description: "City prefix code for the booking ID format",
    statements: ["UPDATE cities SET code = 'NLR' WHERE name = 'Nellore' AND (code IS NULL OR code = '')"],
  },
  {
    key: "2026-07-20_restrict_service_area_to_nellore",
    description: "Initial launch service area — Nellore only",
    // Deliberately one-time: this is a launch-state seed, not a standing invariant.
    // Re-running it every boot meant a city the admin enabled in the dashboard was
    // switched back off by the next deploy. Service area is dashboard-managed now.
    statements: [
      "UPDATE cities SET isActive = 0 WHERE name != 'Nellore'",
      "UPDATE cities SET isActive = 1 WHERE name = 'Nellore'",
    ],
  },
];

const ensureMigrationsTable = async () => {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      \`key\` VARCHAR(191) NOT NULL,
      appliedAt DATETIME NOT NULL,
      baselined TINYINT(1) NOT NULL DEFAULT 0,
      PRIMARY KEY (\`key\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
};

const getAppliedKeys = async () => {
  const [rows] = await sequelize.query("SELECT `key` FROM schema_migrations");
  return new Set(rows.map(r => r.key));
};

const recordMigration = async (key, baselined = false) => {
  await sequelize.query(
    "INSERT IGNORE INTO schema_migrations (`key`, appliedAt, baselined) VALUES (?, NOW(), ?)",
    { replacements: [key, baselined ? 1 : 0] }
  );
};

/**
 * An existing production database has already had every migration below applied — they
 * ran on each boot back when there was no ledger. Running them one final time would undo
 * live admin edits, which is the exact bug the ledger exists to stop, so the first boot
 * against a populated database records them all as applied WITHOUT executing them.
 *
 * A genuinely fresh database (no cities yet, sync() having just created the tables) gets
 * the real thing.
 */
const baselineExistingDatabase = async (applied) => {
  if (applied.size > 0) return false;

  let isExisting = false;
  try {
    const [rows] = await sequelize.query("SELECT COUNT(*) AS n FROM cities");
    isExisting = Number(rows[0]?.n ?? 0) > 0;
  } catch {
    // cities table missing entirely — treat as a fresh database
  }
  if (!isExisting) return false;

  for (const m of ONE_TIME_MIGRATIONS) await recordMigration(m.key, true);
  logger.info(`Baselined ${ONE_TIME_MIGRATIONS.length} existing migrations (no data touched)`);
  return true;
};

const runOneTimeMigrations = async () => {
  await ensureMigrationsTable();
  const applied = await getAppliedKeys();
  if (await baselineExistingDatabase(applied)) return;

  let ran = 0;
  for (const migration of ONE_TIME_MIGRATIONS) {
    if (applied.has(migration.key)) continue;
    try {
      for (const sql of migration.statements) await sequelize.query(sql);
      await recordMigration(migration.key);
      ran += 1;
      logger.info(`Migration applied: ${migration.key} — ${migration.description}`);
    } catch (e) {
      // Left unrecorded so it retries on the next boot rather than being skipped forever.
      logger.error(`Migration failed: ${migration.key} — ${e.message}`);
    }
  }
  if (ran === 0) logger.info("No pending migrations");
};

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    logger.info("MySQL connected successfully");

    // Load all models (registers them with sequelize)
    require("./models");

    // Sync tables — create if not exists, never alter (alter:true duplicates indexes on every restart)
    await sequelize.sync();
    logger.info("Database tables synced");

    for (const sql of ADDITIVE_SCHEMA) {
      await sequelize.query(sql).catch(() => {});
    }
    logger.info("Column migrations applied");

    await runOneTimeMigrations();
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
