const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../utils/dbconnect");

const ServiceCityMap = sequelize.define("ServiceCityMap", {
  id:          { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  serviceId:   { type: DataTypes.INTEGER, allowNull: false },
  cityId:      { type: DataTypes.INTEGER, allowNull: false },
  isActive:    { type: DataTypes.BOOLEAN, defaultValue: true },
  // Optional per-city price override; null = use service.basePrice
  customPrice: { type: DataTypes.DECIMAL(10, 2), allowNull: true, defaultValue: null },
}, {
  timestamps: true,
  tableName: "service_city_map",
  indexes: [{ unique: true, fields: ["serviceId", "cityId"] }],
});

module.exports = ServiceCityMap;
