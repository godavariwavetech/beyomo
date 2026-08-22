const express = require("express");
const router = express.Router();
const authenticate = require("../../../../utils/authenticate");
const {
  getProfile,
  updateProfile,
  addAddress,
  updateAddress,
  deleteAddress,
  updateDeviceToken,
  getBookings,
  getWallet,
  getReferral,
  getUserReviews,
  deleteAccount,
} = require("../../controllers/v1/users.controller");

router.use(authenticate);

router.get("/profile", getProfile);
router.patch("/profile", updateProfile);
router.delete("/profile", deleteAccount);
router.post("/address", addAddress);
router.put("/address/:addressId", updateAddress);
router.delete("/address/:addressId", deleteAddress);
router.patch("/device-token", updateDeviceToken);
router.get("/bookings", getBookings);
router.get("/wallet", getWallet);
router.get("/referral", getReferral);
router.get("/reviews", getUserReviews);

module.exports = router;
