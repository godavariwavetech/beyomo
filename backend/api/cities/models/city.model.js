const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../utils/dbconnect");

const City = sequelize.define("City", {
  id:       { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name:     { type: DataTypes.STRING(100), allowNull: false, unique: true },
  state:    { type: DataTypes.STRING(100), allowNull: true },
  lat:      { type: DataTypes.FLOAT, allowNull: true },
  lng:      { type: DataTypes.FLOAT, allowNull: true },
  radius:   { type: DataTypes.FLOAT, allowNull: true, defaultValue: 30 }, // km
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  timestamps: true,
  tableName: "cities",
});

module.exports = City;
