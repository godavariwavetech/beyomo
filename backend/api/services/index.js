const express = require("express");
const router = express.Router();
const servicesRoutes = require("./routes/v1/services.routes");

router.use("/v1/services", servicesRoutes);

module.exports = router;
