const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../utils/dbconnect");

const AppFeedback = sequelize.define("AppFeedback", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: true },
  userName: { type: DataTypes.STRING(100), allowNull: true },
  type: { type: DataTypes.ENUM("service", "app", "suggestion", "bug"), allowNull: false },
  message: { type: DataTypes.TEXT, allowNull: false },
  rating: { type: DataTypes.INTEGER, allowNull: true },
  serviceBooked: { type: DataTypes.STRING(150), allowNull: true },
  category: { type: DataTypes.STRING(100), allowNull: true },
  version: { type: DataTypes.STRING(20), allowNull: true },
  status: { type: DataTypes.ENUM("new", "reviewed", "resolved"), defaultValue: "new" },
  submittedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  adminNotes: { type: DataTypes.TEXT, allowNull: true },
}, {
  timestamps: true,
  tableName: "app_feedback",
});

module.exports = AppFeedback;

