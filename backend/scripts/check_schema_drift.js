/**
 * Compares every registered Sequelize model's attributes against the columns that
 * actually exist, and reports the gaps.
 *
 * sync() only ever CREATES tables, never alters them, so a column added to a model
 * after its table already existed is invisible until some query selects it and the
 * driver throws "Unknown column". Importing an older dump reproduces exactly that
 * state wholesale. Run this after any dump import.
 *
 *   node scripts/check_schema_drift.js
 */
const { sequelize } = require("../utils/dbconnect");
require("../utils/models");

(async () => {
  await sequelize.authenticate();

  const [rows] = await sequelize.query(
    `SELECT table_name AS t, column_name AS c
       FROM information_schema.columns
      WHERE table_schema = DATABASE()`
  );

  const actual = new Map();
  for (const { t, c } of rows) {
    const key = String(t).toLowerCase();
    if (!actual.has(key)) actual.set(key, new Set());
    actual.get(key).add(String(c));
  }

  let gaps = 0;
  for (const model of Object.values(sequelize.models)) {
    const table = model.getTableName();
    const have = actual.get(String(table).toLowerCase());
    if (!have) {
      console.log(`MISSING TABLE  ${table}`);
      gaps += 1;
      continue;
    }
    const missing = Object.values(model.rawAttributes)
      .map(a => a.field || a.fieldName)
      .filter(f => f && !have.has(f));
    if (missing.length) {
      console.log(`${table}: missing ${missing.join(", ")}`);
      gaps += missing.length;
    }
  }

  console.log(gaps === 0 ? "No schema drift." : `${gaps} gap(s).`);
  await sequelize.close();
  process.exit(0);
})().catch(e => {
  console.error(e.message);
  process.exit(1);
});
