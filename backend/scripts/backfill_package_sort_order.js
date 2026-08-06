/**
 * One-time migration: add service_packages.sortOrder and backfill it so the
 * on-screen order doesn't jump around before an admin explicitly reorders
 * anything. Assigns 0, 1, 2, ... per packageType (fixed/flexible ordered
 * independently) following the current createdAt-DESC order (only touches
 * rows still at the column's default of 0, so it's safe to re-run before any
 * admin reorder happens).
 * Run once: node scripts/backfill_package_sort_order.js
 */
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const { sequelize } = require("../utils/dbconnect");

async function run() {
  await sequelize.query("ALTER TABLE service_packages ADD COLUMN IF NOT EXISTS sortOrder INT NOT NULL DEFAULT 0");

  await sequelize.query(`
    UPDATE service_packages sp
    JOIN (
      SELECT id, ROW_NUMBER() OVER (PARTITION BY packageType ORDER BY createdAt DESC) - 1 AS rn
      FROM service_packages
    ) ranked ON sp.id = ranked.id
    SET sp.sortOrder = ranked.rn
    WHERE sp.sortOrder = 0
  `);
  console.log("✓ Backfilled service_packages.sortOrder per packageType (createdAt-DESC order)");

  await sequelize.close();
  console.log("Done.");
}

run().catch((e) => { console.error(e.message); process.exit(1); });
