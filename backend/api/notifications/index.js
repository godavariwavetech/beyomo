const express = require("express");
const router = express.Router();
const notificationsRoutes = require("./routes/v1/notifications.routes");

router.use("/v1/notifications", notificationsRoutes);

module.exports = router;
