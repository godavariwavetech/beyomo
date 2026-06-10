const express = require("express");
const router = express.Router();
const reviewsRoutes = require("./routes/v1/reviews.routes");

router.use("/v1/reviews", reviewsRoutes);

module.exports = router;
