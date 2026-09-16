const express = require("express");
const path = require("path");
const router = express.Router();
const partnerAuthenticate = require("../../../../utils/partnerAuthenticate");
const {
  getProfile,
  updateProfile,
  deleteAccount,
  uploadDocuments,
  getDashboard,
  getBookings,
  getBookingById,
  getAvailableBookings,
  acceptBooking,
  claimServices,
  updateBookingStatus,
  markArrived,
  updateDeviceToken,
  updateOnlineStatus,
  getEarnings,
  addExtraServices,
  addBookingPackage,
  removeBookingPackage,
  sendTestNotification,
  getWallet,
  verifyServiceOtp,
} = require("../../controllers/v1/partners.controller");

// Public: agreement PDF download (no auth required)
router.get("/agreement.pdf", (req, res) => {
  const pdfPath = path.join(__dirname, "../../../../public/agreement.pdf");
  res.download(pdfPath, "Beyomo_Partner_Agreement.pdf", (err) => {
    if (err) res.status(404).json({ status: false, message: "Agreement PDF not found" });
  });
});

router.use(partnerAuthenticate);

// The start-service OTP is the customer's proof that the partner is really there, so
// the partner must never be able to read it back off the API — that would make the
// check meaningless. Booking rows are returned whole by most handlers here (and by
// future ones), so strip the field centrally on the way out rather than relying on
// every endpoint to remember. Everything else is passed through untouched.
const stripServiceOtp = (value) => {
  if (Array.isArray(value)) return value.map(stripServiceOtp);
  if (!value || typeof value !== "object") return value;
  // Dates and Buffers serialise themselves — walking into them would mangle them.
  if (value instanceof Date || Buffer.isBuffer(value)) return value;
  // Sequelize rows keep their fields in dataValues behind prototype getters, so an
  // Object.entries walk over the instance sees bookkeeping props and misses every
  // real column — serviceOtp included. toJSON() flattens it to the plain shape first.
  const plain = typeof value.toJSON === "function" ? value.toJSON() : value;
  const out = {};
  for (const [k, v] of Object.entries(plain)) {
    if (k === "serviceOtp") continue;
    out[k] = stripServiceOtp(v);
  }
  return out;
};

router.use((req, res, next) => {
  const json = res.json.bind(res);
  res.json = (body) => json(stripServiceOtp(body));
  next();
});

router.get("/profile", getProfile);
router.patch("/profile", updateProfile);
router.delete("/profile", deleteAccount);
router.post("/documents", uploadDocuments);
router.get("/dashboard", getDashboard);
router.get("/earnings", getEarnings);
router.get("/wallet", getWallet);
router.get("/bookings/available", getAvailableBookings);
router.get("/bookings", getBookings);
router.get("/bookings/:id", getBookingById);
router.post("/bookings/:id/accept", acceptBooking);
router.post("/bookings/:id/claim-services", claimServices);
router.patch("/bookings/:id/status", updateBookingStatus);
router.post("/bookings/:id/verify-otp", verifyServiceOtp);
router.patch("/bookings/:id/arrived", markArrived);
router.patch("/bookings/:id/extra-services", addExtraServices);
router.patch("/bookings/:id/add-package", addBookingPackage);
router.patch("/bookings/:id/remove-package", removeBookingPackage);
router.patch("/device-token", updateDeviceToken);
router.patch("/online-status", updateOnlineStatus);
router.post("/test-notification", sendTestNotification);

module.exports = router;
