const express = require("express");
const router = express.Router();
const appVersionRoutes = require("./routes/v1/appVersion.routes");

router.use("/v1/app-version", appVersionRoutes);

module.exports = router;
