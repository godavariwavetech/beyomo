/**
 * One-time migration: add `source` and `professions` to partners
 * (source distinguishes app sign-ups from website leads; professions stores the
 * free-text profession labels picked on the website "Join Now" form)
 * Run once: node scripts/addPartnerSourceColumn.js
 */
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const { sequelize } = require("../utils/dbconnect");

async function run() {
  const checks = await sequelize.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'partners'
       AND COLUMN_NAME IN ('source','professions')`,
    { type: sequelize.QueryTypes.SELECT }
  );
  const existing = new Set(checks.map((r) => r.COLUMN_NAME));

  if (!existing.has("source")) {
    await sequelize.query("ALTER TABLE `partners` ADD COLUMN `source` ENUM('app','website') NOT NULL DEFAULT 'app'");
    console.log("✓ Added source to partners");
  } else {
    console.log("– source already exists in partners");
  }

  if (!existing.has("professions")) {
    await sequelize.query("ALTER TABLE `partners` ADD COLUMN `professions` TEXT NULL DEFAULT NULL");
    console.log("✓ Added professions to partners");
  } else {
    console.log("– professions already exists in partners");
  }

  await sequelize.close();
  console.log("Done.");
}

run().catch((e) => { console.error(e.message); process.exit(1); });
