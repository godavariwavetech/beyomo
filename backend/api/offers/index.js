const express = require("express");
const router = express.Router();
const offersRoutes = require("./routes/v1/offers.routes");

router.use("/v1/offers", offersRoutes);

module.exports = router;
