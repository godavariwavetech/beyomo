const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../utils/dbconnect");

const Coupon = sequelize.define("Coupon", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  code: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  type: { type: DataTypes.ENUM("flat", "percent"), allowNull: false },
  discount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  maxDiscount: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
  minOrderAmount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  maxUses: { type: DataTypes.INTEGER, allowNull: true },
  usedCount: { type: DataTypes.INTEGER, defaultValue: 0 },
  validFrom: { type: DataTypes.DATE, allowNull: false },
  validTill: { type: DataTypes.DATE, allowNull: false },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  description: { type: DataTypes.TEXT, allowNull: true },
  createdBy: { type: DataTypes.INTEGER, allowNull: true },
  // empty array / null = available in all cities
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
}, {
  timestamps: true,
  tableName: "coupons",
  hooks: {
    beforeCreate(coupon) {
      coupon.code = coupon.code.toUpperCase().trim();
    },
    beforeUpdate(coupon) {
      if (coupon.changed("code")) {
        coupon.code = coupon.code.toUpperCase().trim();
      }
    },
  },
});

module.exports = Coupon;

