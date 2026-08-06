/**
 * One-time migration: add bookings.packages (JSON, nullable) so a single booking
 * can bundle multiple packages, each keeping its own price/discount, instead of
 * being limited to the existing single packageId/packageQty pair.
 * Run once: node scripts/add_bookings_packages_column.js
 */
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const { sequelize } = require("../utils/dbconnect");

async function run() {
  await sequelize.query("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS packages JSON NULL");
  console.log("✓ Added bookings.packages");
  await sequelize.close();
  console.log("Done.");
}

run().catch((e) => { console.error(e.message); process.exit(1); });
