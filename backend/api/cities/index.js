const express = require("express");
const router = express.Router();
const citiesRoutes = require("./routes/v1/cities.routes");

router.use("/v1/cities", citiesRoutes);

module.exports = router;
