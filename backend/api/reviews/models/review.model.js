const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../utils/dbconnect");

const Review = sequelize.define("Review", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  bookingId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  partnerId: { type: DataTypes.INTEGER, allowNull: false },
  serviceId: { type: DataTypes.INTEGER, allowNull: false },
  rating: { type: DataTypes.INTEGER, allowNull: false },
  comment: { type: DataTypes.TEXT, allowNull: true },
  images: { type: DataTypes.JSON, defaultValue: [] },
  status: { type: DataTypes.ENUM("visible", "hidden"), defaultValue: "visible" },
  helpfulCount: { type: DataTypes.INTEGER, defaultValue: 0 },
}, {
  timestamps: true,
  tableName: "reviews",
});

module.exports = Review;

