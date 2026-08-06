/**
 * One-time seed: create the 4 app_versions rows (user/android, user/ios,
 * partner/android, partner/ios) if they don't exist yet, defaulted to the
 * currently-shipped native versionName so no install gets force-blocked the
 * moment this feature goes live. Safe to re-run — only fills in missing rows.
 * Run once: node scripts/seed_app_versions.js
 */
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const AppVersion = require("../api/appVersion/models/appVersion.model");
const { sequelize } = require("../utils/dbconnect");

// Matches android/app/build.gradle versionName at the time this was written —
// update here (and in each app's config.ts CURRENT_APP_VERSION) at every release.
const DEFAULTS = [
  { app: "user", platform: "android", minVersion: "1.0.2" },
  { app: "user", platform: "ios", minVersion: "1.0.2" },
  { app: "partner", platform: "android", minVersion: "1.0" },
  { app: "partner", platform: "ios", minVersion: "1.0" },
];

async function run() {
  await sequelize.sync(); // creates app_versions table if it doesn't exist yet
  for (const row of DEFAULTS) {
    const [record, created] = await AppVersion.findOrCreate({
      where: { app: row.app, platform: row.platform },
      defaults: row,
    });
    console.log(`${created ? "✓ created" : "· exists"}: ${row.app}/${row.platform} -> minVersion ${record.minVersion}`);
  }
  await sequelize.close();
  console.log("Done.");
}

run().catch((e) => { console.error(e.message); process.exit(1); });
