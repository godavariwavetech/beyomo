const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../utils/dbconnect");

const ServiceCategory = sequelize.define("ServiceCategory", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  description: { type: DataTypes.TEXT, allowNull: true },
  icon: { type: DataTypes.TEXT, allowNull: true, defaultValue: null },
  image: { type: DataTypes.TEXT, allowNull: true, defaultValue: null },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  sortOrder: { type: DataTypes.INTEGER, defaultValue: 0 },
  // Admin-selected categories to feature on the website home page / app header —
  // not every category, only ones explicitly flagged here (e.g. ones with a
  // consistent, on-brand photo).
  showOnHome: { type: DataTypes.BOOLEAN, defaultValue: false },
  // Revenue split — adminPercent + partnerPercent should equal 100
  adminPercent:   { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 20.00 },
  partnerPercent: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 80.00 },
  gstPercent:     { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 5.00 },
  // Array of city IDs this category is active in; empty/null = global
  cityIds: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    get() {
      const v = this.getDataValue("cityIds");
      if (typeof v === "string") { try { return JSON.parse(v); } catch { return []; } }
      return v ?? [];
    },
  },
}, {
  timestamps: true,
  tableName: "service_categories",
});

module.exports = ServiceCategory;
