// Run from backend: node scripts/sms-count.cjs
// Submitted counts are HTTP-successful requests, not confirmed delivery or provider credits.
const { getSmsUsage } = require('../utils/smsUsage');
const { sequelize } = require('../utils/dbconnect');

(async () => {
  try {
    console.log(JSON.stringify(await getSmsUsage(), null, 2));
  } catch (error) {
    console.error(`Unable to read SMS usage: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
})();
