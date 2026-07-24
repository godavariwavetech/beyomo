const express = require("express");
const path = require("path");
const router = express.Router();
const partnerAuthenticate = require("../../../../utils/partnerAuthenticate");
const {
  getProfile,
  updateProfile,
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
  getEarnings,
  addExtraServices,
  sendTestNotification,
  getWallet,
} = require("../../controllers/v1/partners.controller");

// Public: agreement PDF download (no auth required)
router.get("/agreement.pdf", (req, res) => {
  const pdfPath = path.join(__dirname, "../../../../public/agreement.pdf");
  res.download(pdfPath, "Beyomo_Partner_Agreement.pdf", (err) => {
    if (err) res.status(404).json({ status: false, message: "Agreement PDF not found" });
  });
});

router.use(partnerAuthenticate);

router.get("/profile", getProfile);
router.patch("/profile", updateProfile);
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
router.patch("/bookings/:id/arrived", markArrived);
router.patch("/bookings/:id/extra-services", addExtraServices);
router.patch("/device-token", updateDeviceToken);
router.post("/test-notification", sendTestNotification);

module.exports = router;
