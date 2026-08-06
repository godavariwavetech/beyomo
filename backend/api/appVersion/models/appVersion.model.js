const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../utils/dbconnect");

// One row per (app, platform) — 4 total (user/android, user/ios, partner/android,
// partner/ios). Each app's Splash screen compares its own build's version against
// minVersion for its platform; below that, the app is force-blocked until updated.
const AppVersion = sequelize.define("AppVersion", {
  id:             { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  app:            { type: DataTypes.ENUM("user", "partner"), allowNull: false },
  platform:       { type: DataTypes.ENUM("android", "ios"), allowNull: false },
  minVersion:     { type: DataTypes.STRING(20), allowNull: false, defaultValue: "0.0.0" },
  latestVersion:  { type: DataTypes.STRING(20), allowNull: true },
  updateUrl:      { type: DataTypes.STRING(500), allowNull: true },
  message:        { type: DataTypes.TEXT, allowNull: true },
}, {
  timestamps: true,
  tableName: "app_versions",
  indexes: [{ unique: true, fields: ["app", "platform"] }],
});

module.exports = AppVersion;
