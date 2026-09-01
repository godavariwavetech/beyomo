const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../utils/dbconnect");

// Simple key/value store for admin-editable settings (settings sections).
// Each row holds one section (e.g. "commission", "general", "notifications")
// and its persisted JSON payload.
const AdminSetting = sequelize.define("AdminSetting", {
  section: { type: DataTypes.STRING(100), primaryKey: true, allowNull: false },
  value: { type: DataTypes.JSON, allowNull: false, defaultValue: {} },
}, {
  timestamps: true,
  tableName: "admin_settings",
});

module.exports = AdminSetting;
