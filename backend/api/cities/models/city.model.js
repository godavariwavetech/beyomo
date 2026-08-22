const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../utils/dbconnect");

const City = sequelize.define("City", {
  id:       { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name:     { type: DataTypes.STRING(100), allowNull: false, unique: true },
  // Short prefix used to build human-readable booking codes for this city, e.g.
  // "NLR" for Nellore → booking code "NLR2600001" (code + 2-digit year + 5-digit series).
  code:     { type: DataTypes.STRING(5), allowNull: true },
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
