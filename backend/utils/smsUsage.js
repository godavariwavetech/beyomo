const { sequelize } = require('./dbconnect');

let ready;
function ensureTable() {
  if (!ready) {
    ready = sequelize.query(`CREATE TABLE IF NOT EXISTS sms_usage (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      status VARCHAR(24) NOT NULL,
      sms_count INT UNSIGNED NOT NULL DEFAULT 1,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`).catch(error => { ready = null; throw error; });
  }
  return ready;
}

async function recordSmsUsage(status, count = 1) {
  if (!['submitted', 'failed', 'mock', 'opening_balance'].includes(status)) throw new Error('Invalid SMS usage status');
  if (!Number.isSafeInteger(count) || count < 1) throw new Error('SMS count must be a positive integer');
  await ensureTable();
  await sequelize.query('INSERT INTO sms_usage (status, sms_count) VALUES (:status, :count)', {
    replacements: { status, count },
  });
}

async function getSmsUsage() {
  await ensureTable();
  const [rows] = await sequelize.query(`SELECT
    COALESCE(SUM(CASE WHEN status IN ('submitted', 'opening_balance') THEN sms_count ELSE 0 END), 0) AS used,
    COALESCE(SUM(CASE WHEN status = 'submitted' THEN sms_count ELSE 0 END), 0) AS submitted,
    COALESCE(SUM(CASE WHEN status = 'opening_balance' THEN sms_count ELSE 0 END), 0) AS historical,
    COALESCE(SUM(CASE WHEN status = 'failed' THEN sms_count ELSE 0 END), 0) AS failed,
    COALESCE(SUM(CASE WHEN status = 'mock' THEN sms_count ELSE 0 END), 0) AS mock
    FROM sms_usage`);
  return rows[0];
}

module.exports = { recordSmsUsage, getSmsUsage };
