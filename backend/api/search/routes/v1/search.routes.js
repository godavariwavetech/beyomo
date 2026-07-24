const express = require("express");
const router = express.Router();
const { search } = require("../../controllers/v1/search.controller");

// Public — no auth required, same as services/categories/banners
router.get("/", search);

module.exports = router;
