const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../utils/dbconnect");

// Short-lived record created when the client requests a Razorpay order in the
// pay-first flow. Holds the fully-priced, fully-validated booking payload so that
// when the client comes back with a verified payment we can atomically create the
// booking without re-running validation (or drift risk). Consumed exactly once —
// row is deleted on successful booking creation.
const PaymentQuote = sequelize.define("PaymentQuote", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  razorpayOrderId: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  currency: { type: DataTypes.STRING(5), defaultValue: "INR" },
  // Prepared booking payload (services, address, coupon, offer, computed totals, etc.)
  // — the exact object that persistBooking consumes.
  preparedPayload: { type: DataTypes.JSON, allowNull: false },
  expiresAt: { type: DataTypes.DATE, allowNull: false },
  consumedAt: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
}, {
  timestamps: true,
  tableName: "payment_quotes",
  indexes: [
    { fields: ["userId"] },
    { fields: ["razorpayOrderId"] },
    { fields: ["expiresAt"] },
  ],
});

module.exports = PaymentQuote;
