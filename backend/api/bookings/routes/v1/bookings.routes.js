const express = require("express");
const router = express.Router();
const authenticate = require("../../../../utils/authenticate");
const {
  createBooking,
  getBookingById,
  cancelBooking,
  rescheduleBooking,
  submitReview,
  addUserServices,
  updateServiceQty,
  removeService,
  removePackage,
  addPackage,
} = require("../../controllers/v1/bookings.controller");

router.use(authenticate);

router.post("/", createBooking);
router.get("/:id", getBookingById);
router.patch("/:id/cancel", cancelBooking);
router.patch("/:id/reschedule", rescheduleBooking);
router.post("/:id/review", submitReview);
router.patch("/:id/add-services", addUserServices);
router.patch("/:id/update-service", updateServiceQty);
router.patch("/:id/remove-service", removeService);
router.patch("/:id/remove-package", removePackage);
router.patch("/:id/add-package", addPackage);

module.exports = router;
