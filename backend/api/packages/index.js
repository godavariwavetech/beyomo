const express = require("express");
const router = express.Router();
const packagesRoutes = require("./routes/v1/packages.routes");

router.use("/v1/packages", packagesRoutes);

module.exports = router;
