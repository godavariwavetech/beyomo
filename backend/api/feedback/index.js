const express = require("express");
const router = express.Router();
const feedbackRoutes = require("./routes/v1/feedback.routes");

router.use("/v1/feedback", feedbackRoutes);

module.exports = router;
