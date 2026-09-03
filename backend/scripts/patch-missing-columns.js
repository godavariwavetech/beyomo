// One-shot patch: adds the columns the ADDITIVE_SCHEMA migrations couldn't add
// (typically because the MySQL version rejects "ADD COLUMN IF NOT EXISTS" syntax).
// Safe to run multiple times — checks if the column exists first, then ALTERs.

require("dotenv").config();
const mysql = require("mysql2/promise");

const COLUMNS = [
  { table: "services", column: "sortOrder", ddl: "INT NOT NULL DEFAULT 0" },
  { table: "services", column: "isPopular", ddl: "TINYINT(1) NOT NULL DEFAULT 0" },
  { table: "services", column: "showOnHome", ddl: "TINYINT(1) NOT NULL DEFAULT 0" },
  { table: "services", column: "priceStartsFrom", ddl: "TINYINT(1) NOT NULL DEFAULT 0" },
  { table: "bookings", column: "packages", ddl: "JSON NULL" },
  { table: "bookings", column: "packageQty", ddl: "INT NOT NULL DEFAULT 1" },
  { table: "service_packages", column: "showOnHome", ddl: "TINYINT(1) NOT NULL DEFAULT 0" },
  { table: "service_packages", column: "sortOrder", ddl: "INT NOT NULL DEFAULT 0" },
  { table: "service_categories", column: "showOnHome", ddl: "TINYINT(1) NOT NULL DEFAULT 0" },
  { table: "service_categories", column: "sortOrder", ddl: "INT NOT NULL DEFAULT 0" },
  { table: "banners", column: "sortOrder", ddl: "INT NOT NULL DEFAULT 0" },
  { table: "skill_categories", column: "sortOrder", ddl: "INT NOT NULL DEFAULT 0" },
  { table: "partners", column: "source", ddl: "ENUM('app','website') NOT NULL DEFAULT 'app'" },
];

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });

  for (const { table, column, ddl } of COLUMNS) {
    // information_schema check — works on every MySQL version, no IF NOT EXISTS needed
    const [rows] = await conn.query(
      "SELECT COUNT(*) AS n FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?",
      [table, column],
    );
    if (rows[0].n > 0) {
      console.log(`✓ ${table}.${column} already exists`);
      continue;
    }
    try {
      await conn.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${ddl}`);
      console.log(`+ Added ${table}.${column} (${ddl})`);
    } catch (err) {
      console.error(`✗ Failed to add ${table}.${column}: ${err.message}`);
    }
  }

  await conn.end();
})();
