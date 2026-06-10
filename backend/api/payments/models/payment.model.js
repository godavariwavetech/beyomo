const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../utils/dbconnect");

const Payment = sequelize.define("Payment", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  bookingId: { type: DataTypes.INTEGER, allowNull: false },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  razorpayOrderId: { type: DataTypes.STRING(100), allowNull: false },
  razorpayPaymentId: { type: DataTypes.STRING(100), allowNull: true, defaultValue: null },
  razorpaySignature: { type: DataTypes.TEXT, allowNull: true, defaultValue: null },
  amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  currency: { type: DataTypes.STRING(5), defaultValue: "INR" },
  status: { type: DataTypes.ENUM("created", "captured", "failed", "refunded"), defaultValue: "created" },
  method: { type: DataTypes.STRING(30), allowNull: true },
  refundId: { type: DataTypes.STRING(100), allowNull: true },
  refundedAt: { type: DataTypes.DATE, allowNull: true },
}, {
  timestamps: true,
  tableName: "payments",
});

module.exports = Payment;

