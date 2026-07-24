const express = require("express");
const router = express.Router();
const searchRoutes = require("./routes/v1/search.routes");

router.use("/v1/search", searchRoutes);

module.exports = router;
