const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../utils/dbconnect");

const Offer = sequelize.define("Offer", {
  id:          { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title:       { type: DataTypes.STRING(200), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  image:       { type: DataTypes.TEXT, allowNull: true },
  triggerType: {
    type: DataTypes.ENUM("min_spend", "specific_services", "min_count", "category"),
    allowNull: false,
  },
  // min_spend: {amount}  specific_services: {serviceIds:[]}  min_count: {count}  category: {categoryId, count}
  triggerValue: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {},
    get() {
      const val = this.getDataValue('triggerValue');
      if (typeof val === 'string') { try { return JSON.parse(val); } catch { return {}; } }
      return val ?? {};
    },
  },
  freeServiceId:  { type: DataTypes.INTEGER, allowNull: false },
  validFrom:      { type: DataTypes.DATE, allowNull: false },
  validTill:      { type: DataTypes.DATE, allowNull: false },
  isActive:       { type: DataTypes.BOOLEAN, defaultValue: true },
  cityId:         { type: DataTypes.INTEGER, allowNull: true },
  maxUses:        { type: DataTypes.INTEGER, allowNull: true },
  usedCount:      { type: DataTypes.INTEGER, defaultValue: 0 },
  createdBy:      { type: DataTypes.INTEGER, allowNull: true },
  // Revenue split for the free service this offer grants — the free item itself has no
  // revenue to split (price 0), but these are kept consistent with categories/packages
  // for admin reporting and in case a future offer type carries its own paid line.
  adminPercent:   { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 20.00 },
  partnerPercent: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 80.00 },
  gstPercent:     { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 5.00 },
}, {
  timestamps: true,
  tableName: "offers",
});

module.exports = Offer;
