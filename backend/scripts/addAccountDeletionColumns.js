/**
 * One-time migration for reversible account deletion.
 *
 *  1. partners.status gains a 'deleted' member (users.status already has one). Without it
 *     the soft-delete UPDATE fails with "Data truncated for column 'status' at row 1".
 *  2. users and partners gain `deletedAt` and `deletedSnapshot`, which store when the
 *     account was deleted and the identifying fields the delete wipes — that snapshot is
 *     what lets an admin toggle the account back and recover the data.
 *
 * Idempotent: safe to run more than once.
 * Run: node scripts/addAccountDeletionColumns.js
 */
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const { sequelize } = require("../utils/dbconnect");

const columnType = async (table, column) => {
  const [row] = await sequelize.query(
    `SELECT COLUMN_TYPE, IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table AND COLUMN_NAME = :column`,
    { type: sequelize.QueryTypes.SELECT, replacements: { table, column } }
  );
  return row || null;
};

async function run() {
  // 1. partners.status enum
  const status = await columnType("partners", "status");
  if (!status) throw new Error("partners.status not found — wrong database?");
  if (status.COLUMN_TYPE.includes("'deleted'")) {
    console.log("– partners.status already allows 'deleted'");
  } else {
    const nullable = status.IS_NULLABLE === "YES" ? "NULL" : "NOT NULL";
    await sequelize.query(
      `ALTER TABLE \`partners\` MODIFY \`status\`
         ENUM('pending','approved','suspended','rejected','deleted') ${nullable} DEFAULT 'pending'`
    );
    console.log("✓ partners.status now allows 'deleted'");
  }

  // 2. deletedAt / deletedSnapshot on both tables
  for (const table of ["users", "partners"]) {
    if (await columnType(table, "deletedAt")) {
      console.log(`– ${table}.deletedAt already exists`);
    } else {
      await sequelize.query(`ALTER TABLE \`${table}\` ADD COLUMN \`deletedAt\` DATETIME NULL DEFAULT NULL`);
      console.log(`✓ Added ${table}.deletedAt`);
    }

    if (await columnType(table, "deletedSnapshot")) {
      console.log(`– ${table}.deletedSnapshot already exists`);
    } else {
      await sequelize.query(`ALTER TABLE \`${table}\` ADD COLUMN \`deletedSnapshot\` JSON NULL DEFAULT NULL`);
      console.log(`✓ Added ${table}.deletedSnapshot`);
    }
  }

  await sequelize.close();
  console.log("Done.");
}

run().catch((e) => { console.error(e.message); process.exit(1); });
