const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../utils/dbconnect");

const UserAddress = sequelize.define("UserAddress", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  label: { type: DataTypes.STRING(50), defaultValue: "Home" },
  line1: { type: DataTypes.STRING(255), allowNull: false },
  line2: { type: DataTypes.STRING(255), allowNull: true },
  city: { type: DataTypes.STRING(100), allowNull: false },
  state: { type: DataTypes.STRING(100), allowNull: false },
  pincode: { type: DataTypes.STRING(10), allowNull: false },
  lat: { type: DataTypes.FLOAT, allowNull: true },
  lng: { type: DataTypes.FLOAT, allowNull: true },
  isDefault: { type: DataTypes.BOOLEAN, defaultValue: false },
}, {
  timestamps: true,
  tableName: "user_addresses",
});

module.exports = UserAddress;

