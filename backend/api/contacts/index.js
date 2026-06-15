const express = require("express");
const router = express.Router();
const contactRoutes = require("./routes/v1/contact.routes");

router.use("/v1/contacts", contactRoutes);

module.exports = router;
