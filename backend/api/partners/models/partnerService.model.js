const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../utils/dbconnect");

const PartnerService = sequelize.define("PartnerService", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  partnerId: { type: DataTypes.INTEGER, allowNull: false },
  categoryId: { type: DataTypes.INTEGER, allowNull: true },
  serviceId: { type: DataTypes.INTEGER, allowNull: false },
  price: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
}, {
  timestamps: false,
  tableName: "partner_services",
});

module.exports = PartnerService;

