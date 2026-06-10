const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../utils/dbconnect");

const ServiceZone = sequelize.define("ServiceZone", {
  id:          { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name:        { type: DataTypes.STRING(100), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  cities:      { type: DataTypes.JSON, defaultValue: [] },
  pincodes:    { type: DataTypes.JSON, defaultValue: [] },
  isActive:    { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  timestamps: true,
  tableName: "service_zones",
});

module.exports = ServiceZone;
