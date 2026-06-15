/**
 * One-time migration: add cityIds to service_zones, allowedZones to admin_users
 * Run once: node scripts/addZoneColumns.js
 */
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const { sequelize } = require("../utils/dbconnect");

async function run() {
  const q = (sql) => sequelize.query(sql);

  const checks = await sequelize.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME IN ('service_zones','admin_users')
       AND COLUMN_NAME IN ('cityIds','allowedZones')`,
    { type: sequelize.QueryTypes.SELECT }
  );
  const existing = new Set(checks.map((r) => r.COLUMN_NAME));

  if (!existing.has("cityIds")) {
    await q("ALTER TABLE `service_zones` ADD COLUMN `cityIds` JSON NULL DEFAULT (JSON_ARRAY())");
    console.log("✓ Added cityIds to service_zones");
  } else {
    console.log("– cityIds already exists in service_zones");
  }

  if (!existing.has("allowedZones")) {
    await q("ALTER TABLE `admin_users` ADD COLUMN `allowedZones` JSON NULL DEFAULT NULL");
    console.log("✓ Added allowedZones to admin_users");
  } else {
    console.log("– allowedZones already exists in admin_users");
  }

  await sequelize.close();
  console.log("Done.");
}

run().catch((e) => { console.error(e.message); process.exit(1); });
