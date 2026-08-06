const AppVersion = require("../../models/appVersion.model");

// Public — GET /api/v1/app-version?app=user&platform=android
const getVersionConfig = async (app, platform) => {
  const row = await AppVersion.findOne({ where: { app, platform } });
  if (!row) {
    // No row configured yet for this app/platform — default to "no update required"
    // rather than blocking every install just because the admin hasn't set it up.
    return { app, platform, minVersion: "0.0.0", latestVersion: null, updateUrl: null, message: null };
  }
  return row;
};

// Admin
const listAll = async () => AppVersion.findAll({ order: [["app", "ASC"], ["platform", "ASC"]] });

const upsert = async ({ app, platform, minVersion, latestVersion, updateUrl, message }) => {
  const [row] = await AppVersion.findOrCreate({
    where: { app, platform },
    defaults: { app, platform, minVersion: minVersion ?? "0.0.0" },
  });
  await row.update({
    ...(minVersion !== undefined ? { minVersion } : {}),
    ...(latestVersion !== undefined ? { latestVersion } : {}),
    ...(updateUrl !== undefined ? { updateUrl } : {}),
    ...(message !== undefined ? { message } : {}),
  });
  return row;
};

module.exports = { getVersionConfig, listAll, upsert };
