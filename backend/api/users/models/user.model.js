const { DataTypes } = require("sequelize");
const { v4: uuidv4 } = require("uuid");
const { sequelize } = require("../../../utils/dbconnect");

const User = sequelize.define("User", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(100), allowNull: true },
  phone: { type: DataTypes.STRING(20), allowNull: false, unique: true },
  email: { type: DataTypes.STRING(150), allowNull: true, unique: true },
  profilePicture: { type: DataTypes.TEXT, allowNull: true, defaultValue: null },
  deviceTokens: { type: DataTypes.JSON, defaultValue: [] },
  fcmToken: { type: DataTypes.TEXT, allowNull: true, defaultValue: null },
  referralCode: { type: DataTypes.STRING(20), allowNull: true, unique: true },
  referredById: { type: DataTypes.INTEGER, allowNull: true },
  walletBalance: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0, allowNull: false },
  cityId: { type: DataTypes.INTEGER, allowNull: true },
  status: { type: DataTypes.ENUM("active", "blocked", "deleted"), defaultValue: "active", allowNull: false },
}, {
  timestamps: true,
  tableName: "users",
  hooks: {
    beforeCreate(user) {
      if (!user.referralCode) {
        user.referralCode = `BYM${uuidv4().replace(/-/g, "").toUpperCase().slice(0, 8)}`;
      }
    },
  },
});

module.exports = User;

