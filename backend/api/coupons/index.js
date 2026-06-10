const express = require("express");
const router = express.Router();
const couponsRoutes = require("./routes/v1/coupons.routes");

router.use("/v1/coupons", couponsRoutes);

module.exports = router;
