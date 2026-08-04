/**
 * One-time migration: backfill services.sortOrder so the on-screen order doesn't
 * jump around before an admin explicitly reorders anything. Assigns 0, 1, 2, ...
 * per categoryId following the current name-ASC order (only touches rows still at
 * the column's default of 0, so it's safe to re-run before any admin reorder happens).
 * Run once: node scripts/backfill_service_sort_order.js
 */
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const { sequelize } = require("../utils/dbconnect");

async function run() {
  await sequelize.query("ALTER TABLE services ADD COLUMN IF NOT EXISTS sortOrder INT NOT NULL DEFAULT 0");

  await sequelize.query(`
    UPDATE services s
    JOIN (
      SELECT id, ROW_NUMBER() OVER (PARTITION BY categoryId ORDER BY name ASC) - 1 AS rn
      FROM services
    ) ranked ON s.id = ranked.id
    SET s.sortOrder = ranked.rn
    WHERE s.sortOrder = 0
  `);
  console.log("✓ Backfilled services.sortOrder per category (name-ASC order)");

  await sequelize.close();
  console.log("Done.");
}

run().catch((e) => { console.error(e.message); process.exit(1); });
