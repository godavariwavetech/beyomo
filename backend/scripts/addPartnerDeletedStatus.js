/**
 * One-time migration: add 'deleted' to the partners.status enum.
 *
 * Self-service account deletion (Apple App Store Guideline 5.1.1(v)) soft-deletes a
 * partner by setting status='deleted'. Without this the UPDATE fails with
 * "Data truncated for column 'status' at row 1". users.status already has 'deleted'.
 *
 * Run once: node scripts/addPartnerDeletedStatus.js
 */
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const { sequelize } = require("../utils/dbconnect");

const WANTED = ["pending", "approved", "suspended", "rejected", "deleted"];

async function run() {
  const [col] = await sequelize.query(
    `SELECT COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
       FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'partners'
        AND COLUMN_NAME = 'status'`,
    { type: sequelize.QueryTypes.SELECT }
  );

  if (!col) throw new Error("partners.status not found — wrong database?");
  console.log("current:", col.COLUMN_TYPE);

  if (col.COLUMN_TYPE.includes("'deleted'")) {
    console.log("– partners.status already allows 'deleted', nothing to do");
  } else {
    // Preserve the existing members and append 'deleted'; keep nullability/default as-is.
    const values = WANTED.map((v) => `'${v}'`).join(",");
    const nullable = col.IS_NULLABLE === "YES" ? "NULL" : "NOT NULL";
    await sequelize.query(
      `ALTER TABLE \`partners\` MODIFY \`status\` ENUM(${values}) ${nullable} DEFAULT 'pending'`
    );
    console.log("✓ partners.status now allows 'deleted'");
  }

  const [after] = await sequelize.query(
    `SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'partners' AND COLUMN_NAME = 'status'`,
    { type: sequelize.QueryTypes.SELECT }
  );
  console.log("now:    ", after.COLUMN_TYPE);

  await sequelize.close();
  console.log("Done.");
}

run().catch((e) => { console.error(e.message); process.exit(1); });
