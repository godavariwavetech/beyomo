const express = require("express");
const router = express.Router();
const adminRoutes = require("./routes/v1/admin.routes");

router.use("/v1/admin", adminRoutes);

module.exports = router;
