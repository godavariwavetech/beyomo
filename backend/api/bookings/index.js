const express = require("express");
const router = express.Router();
const bookingsRoutes = require("./routes/v1/bookings.routes");

router.use("/v1/bookings", bookingsRoutes);

module.exports = router;
