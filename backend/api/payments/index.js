const express = require("express");
const router = express.Router();
const paymentsRoutes = require("./routes/v1/payments.routes");

router.use("/v1/payments", paymentsRoutes);

module.exports = router;
