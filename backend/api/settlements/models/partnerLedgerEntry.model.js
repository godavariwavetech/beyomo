const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../utils/dbconnect");

const PartnerLedgerEntry = sequelize.define("PartnerLedgerEntry", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  partnerId: { type: DataTypes.INTEGER, allowNull: false },
  bookingId: { type: DataTypes.INTEGER, allowNull: false },
  bookingCode: { type: DataTypes.STRING(30), allowNull: true },
  paymentMode: { type: DataTypes.ENUM("online", "cod"), allowNull: false },
  grossShare: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  commissionPercent: { type: DataTypes.DECIMAL(5, 2), allowNull: false },
  adminCommissionAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  partnerNetAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  // credit = admin owes partner (online jobs); debit = partner owes admin (cod commission)
  direction: { type: DataTypes.ENUM("credit", "debit"), allowNull: false },
  // amount that actually affects the running wallet balance (always positive)
  amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  status: { type: DataTypes.ENUM("unsettled", "settled", "voided"), defaultValue: "unsettled" },
  settlementId: { type: DataTypes.INTEGER, allowNull: true },
  reversesEntryId: { type: DataTypes.INTEGER, allowNull: true },
  voidReason: { type: DataTypes.TEXT, allowNull: true },
  voidedAt: { type: DataTypes.DATE, allowNull: true },
}, {
  timestamps: true,
  tableName: "partner_ledger_entries",
});

module.exports = PartnerLedgerEntry;
