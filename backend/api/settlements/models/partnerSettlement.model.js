const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../utils/dbconnect");

const PartnerSettlement = sequelize.define("PartnerSettlement", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  partnerId: { type: DataTypes.INTEGER, allowNull: false },
  // payout = admin pays the partner; collection = admin collects cash/dues from the partner
  type: { type: DataTypes.ENUM("payout", "collection"), allowNull: false },
  amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  method: { type: DataTypes.STRING(30), allowNull: true },
  note: { type: DataTypes.TEXT, allowNull: true },
  balanceBefore: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  balanceAfter: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  settledByAdminId: { type: DataTypes.INTEGER, allowNull: true },
}, {
  timestamps: true,
  tableName: "partner_settlements",
});

module.exports = PartnerSettlement;
