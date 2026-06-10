const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../utils/dbconnect");

const Otp = sequelize.define("Otp", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  phone: { type: DataTypes.STRING(20), allowNull: false },
  otp: { type: DataTypes.STRING(6), allowNull: false },
  userType: { type: DataTypes.ENUM("user", "partner"), defaultValue: "user" },
  expiresAt: { type: DataTypes.DATE, allowNull: false },
  attempts: { type: DataTypes.INTEGER, defaultValue: 0 },
  isUsed: { type: DataTypes.BOOLEAN, defaultValue: false },
}, {
  timestamps: true,
  tableName: "otps",
});

module.exports = Otp;
