const express = require("express");
const router = express.Router();
const authenticate = require("../../../../utils/authenticate");
const {
  createBooking,
  getBookingById,
  cancelBooking,
  submitReview,
  respondServiceUpdate,
  addUserServices,
} = require("../../controllers/v1/bookings.controller");

router.use(authenticate);

router.post("/", createBooking);
router.get("/:id", getBookingById);
router.patch("/:id/cancel", cancelBooking);
router.post("/:id/review", submitReview);
router.patch("/:id/respond-service-update", respondServiceUpdate);
router.patch("/:id/add-services", addUserServices);

module.exports = router;
