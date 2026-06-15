const express = require("express");
const router = express.Router();
const { getCategories } = require("../../controllers/v1/skills.controller");

router.get("/", getCategories);

module.exports = router;
