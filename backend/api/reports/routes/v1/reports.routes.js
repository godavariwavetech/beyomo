const express = require("express");
const router = express.Router();
const adminAuthenticate = require("../../../../utils/adminAuthenticate");
const { getDashboard, getRevenue, getBookings, getUsers, getCouponUsage, getUserEngagement, getSummary } = require("../../controllers/v1/reports.controller");

router.use(adminAuthenticate());

router.get("/dashboard", getDashboard);
router.get("/summary", getSummary);
router.get("/revenue", getRevenue);
router.get("/bookings", getBookings);
router.get("/users", getUsers);
router.get("/coupon-usage", getCouponUsage);
router.get("/user-engagement", getUserEngagement);

module.exports = router;
