const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../utils/dbconnect");

const Notification = sequelize.define("Notification", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: true },
  partnerId: { type: DataTypes.INTEGER, allowNull: true },
  title: { type: DataTypes.STRING(200), allowNull: false },
  body: { type: DataTypes.TEXT, allowNull: false },
  data: { type: DataTypes.JSON, defaultValue: {} },
  type: { type: DataTypes.ENUM("booking", "payment", "promo", "system"), defaultValue: "system" },
  isRead: { type: DataTypes.BOOLEAN, defaultValue: false },
  sentAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  timestamps: true,
  tableName: "notifications",
});

module.exports = Notification;

