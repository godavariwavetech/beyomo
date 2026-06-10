const express = require("express");
const router = express.Router();
const partnersRoutes = require("./routes/v1/partners.routes");

router.use("/v1/partners", partnersRoutes);

module.exports = router;
