const express = require("express");
const router = express.Router();
const usersRoutes = require("./routes/v1/users.routes");

router.use("/v1/users", usersRoutes);

module.exports = router;
