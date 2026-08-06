const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../utils/dbconnect");

const Booking = sequelize.define("Booking", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  bookingCode: { type: DataTypes.STRING(30), allowNull: true, unique: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  partnerId: { type: DataTypes.INTEGER, allowNull: true },
  // Nullable because admin-created bookings can consist entirely of custom add-on
  // line items with no real catalog service (see createdByAdminId below).
  serviceId: { type: DataTypes.INTEGER, allowNull: true },
  services: { type: DataTypes.JSON, allowNull: true },
  addressLabel: { type: DataTypes.STRING(50), allowNull: true },
  addressLine1: { type: DataTypes.STRING(255), allowNull: false },
  addressLine2: { type: DataTypes.STRING(255), allowNull: true },
  addressCity: { type: DataTypes.STRING(100), allowNull: false },
  addressState: { type: DataTypes.STRING(100), allowNull: false },
  addressPincode: { type: DataTypes.STRING(10), allowNull: false },
  addressLat: { type: DataTypes.FLOAT, allowNull: true },
  addressLng: { type: DataTypes.FLOAT, allowNull: true },
  scheduledAt: { type: DataTypes.DATE, allowNull: false },
  status: {
    type: DataTypes.ENUM("pending", "confirmed", "in_progress", "completed", "cancelled"),
    defaultValue: "pending",
  },
  baseAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  discountAmount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  couponDiscountAmount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  taxAmount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  totalAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  partnerEarning: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
  couponCode: { type: DataTypes.STRING(50), allowNull: true },
  couponId:   { type: DataTypes.INTEGER, allowNull: true },
  offerId:    { type: DataTypes.INTEGER, allowNull: true },
  // Single-package bookings (the common case): packageId/packageQty as before.
  packageId:  { type: DataTypes.INTEGER, allowNull: true },
  // How many copies of the package/combo were booked — mirrors per-service qty
  packageQty: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  // Multi-package bookings: [{packageId, title, qty, price, originalPrice}], one entry
  // per distinct package in the cart, each keeping its own price/discount intact.
  // Null/empty for ordinary single-package (or no-package) bookings — packageId/packageQty
  // above remain the source of truth for those. When populated, this is authoritative
  // and packageId is left null (there's no single package to point it at).
  packages: { type: DataTypes.JSON, allowNull: true },
  paymentStatus: { type: DataTypes.ENUM("pending", "paid", "refunded"), defaultValue: "pending" },
  paymentMode: { type: DataTypes.ENUM("online", "cod"), allowNull: false, defaultValue: "online" },
  paymentId: { type: DataTypes.INTEGER, allowNull: true }, // no FK â€” circular dep with payments
  notes: { type: DataTypes.TEXT, allowNull: true },
  cancelledBy: { type: DataTypes.ENUM("user", "partner", "admin"), allowNull: true },
  cancellationReason: { type: DataTypes.TEXT, allowNull: true },
  previousScheduledAt: { type: DataTypes.DATE, allowNull: true },
  rescheduledCount: { type: DataTypes.INTEGER, defaultValue: 0 },
  rescheduledBy: { type: DataTypes.ENUM("user", "partner", "admin"), allowNull: true },
  rescheduleReason: { type: DataTypes.TEXT, allowNull: true },
  completedAt: { type: DataTypes.DATE, allowNull: true },
  // When the partner confirmed arrival at the customer's location — separate from
  // `status` moving to "in_progress", which now only happens once the partner actually
  // taps "Start Service" after reviewing/confirming the checklist.
  arrivedAt: { type: DataTypes.DATE, allowNull: true },
  cityId: { type: DataTypes.INTEGER, allowNull: true },
  ratingUser: { type: DataTypes.INTEGER, allowNull: true },
  ratingPartner: { type: DataTypes.INTEGER, allowNull: true },
  serviceUpdatePending: { type: DataTypes.BOOLEAN, defaultValue: false },
  pendingServicesUpdate: { type: DataTypes.JSON, allowNull: true },
  // Outcome of the most recent service-update request — lets the partner app tell
  // approved apart from rejected without guessing from totals. Reset to null whenever
  // a new proposal is sent.
  lastServiceUpdateDecision: { type: DataTypes.ENUM("approved", "rejected"), allowNull: true },
  // Set when a support/admin agent creates the booking on the customer's behalf
  // (e.g. a phone call requesting a one-time service) rather than the user app.
  createdByAdminId: { type: DataTypes.INTEGER, allowNull: true },
}, {
  timestamps: true,
  tableName: "bookings",
  hooks: {
    beforeCreate(booking) {
      if (!booking.bookingCode) {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const random = Math.floor(100000 + Math.random() * 900000);
        booking.bookingCode = `BYM-${year}${month}-${random}`;
      }
      if (booking.partnerEarning == null) {
        booking.partnerEarning = booking.totalAmount;
      }
    },
  },
});

module.exports = Booking;

