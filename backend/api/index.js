const express = require("express");
const router = express.Router();

// Domain route modules
const authRoutes = require("./auth");
const usersRoutes = require("./users");
const partnersRoutes = require("./partners");
const servicesRoutes = require("./services");
const bookingsRoutes = require("./bookings");
const paymentsRoutes = require("./payments");
const couponsRoutes = require("./coupons");
const reviewsRoutes = require("./reviews");
const notificationsRoutes = require("./notifications");
const adminRoutes = require("./adminUsers");
const feedbackRoutes = require("./feedback");
const bannersRoutes = require("./banners");
const citiesRoutes = require("./cities");
const offersRoutes = require("./offers");
const packagesRoutes = require("./packages");

// Reports routes (mounted under /api/v1/admin/reports via admin module)
const reportsRoutes = require("./reports/routes/v1/reports.routes");

// Mount all routes under /api
router.use("/api", authRoutes);
router.use("/api", usersRoutes);
router.use("/api", partnersRoutes);
router.use("/api", servicesRoutes);
router.use("/api", bookingsRoutes);
router.use("/api", paymentsRoutes);
router.use("/api", couponsRoutes);
router.use("/api", reviewsRoutes);
router.use("/api", notificationsRoutes);
router.use("/api", adminRoutes);
router.use("/api", feedbackRoutes);
router.use("/api", bannersRoutes);
router.use("/api", citiesRoutes);
router.use("/api", offersRoutes);
router.use("/api", packagesRoutes);

// Reports under admin namespace
router.use("/api/v1/admin/reports", reportsRoutes);

module.exports = router;
