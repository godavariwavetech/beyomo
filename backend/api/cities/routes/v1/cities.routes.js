const express = require("express");
const router = express.Router();
const { getActiveCities } = require("../../controllers/v1/cities.controller");

router.get("/active", getActiveCities);

module.exports = router;
