const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../utils/dbconnect");

const ServicePackage = sequelize.define("ServicePackage", {
  id:            { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title:         { type: DataTypes.STRING(200), allowNull: false },
  description:   { type: DataTypes.TEXT, allowNull: true },
  image:         { type: DataTypes.TEXT, allowNull: true },
  // 'fixed' = admin pre-selects services; 'flexible' = user picks N services
  packageType:   {
    type: DataTypes.ENUM("fixed", "flexible"),
    allowNull: false,
    defaultValue: "fixed",
  },
  price:         { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  originalPrice: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
  // flexible: number of services the user must pick
  serviceCount:  { type: DataTypes.INTEGER, allowNull: true },
  // flexible: restrict picks to this category (null = any service)
  categoryId:    { type: DataTypes.INTEGER, allowNull: true },
  // fixed: [{serviceId, name, price, duration, image}]
  services: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    get() {
      const val = this.getDataValue("services");
      if (typeof val === "string") { try { return JSON.parse(val); } catch { return []; } }
      return val ?? [];
    },
  },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  // Display order within its packageType (fixed vs flexible are ordered independently)
  sortOrder: { type: DataTypes.INTEGER, defaultValue: 0 },
  // Admin-selected packages/combos to feature in the app's home screen header carousel
  // (alongside admin banners) — not every package, only ones explicitly flagged here.
  showOnHome: { type: DataTypes.BOOLEAN, defaultValue: false },
  // array of city IDs this package is available in — null/[] means all cities
  cityIds: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    get() {
      const val = this.getDataValue("cityIds");
      if (typeof val === "string") { try { return JSON.parse(val); } catch { return []; } }
      return val ?? [];
    },
  },
  validFrom: { type: DataTypes.DATE, allowNull: true },
  validTill: { type: DataTypes.DATE, allowNull: true },
  // Revenue split — overrides each service's category split for bookings made via this
  // package, since the package's fixed price isn't tied to individual catalog prices.
  adminPercent:   { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 20.00 },
  partnerPercent: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 80.00 },
  gstPercent:     { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 5.00 },
}, {
  timestamps: true,
  tableName: "service_packages",
});

module.exports = ServicePackage;
