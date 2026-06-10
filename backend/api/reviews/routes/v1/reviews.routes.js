const express = require("express");
const router = express.Router();
const { getPartnerReviews } = require("../../controllers/v1/reviews.controller");

// Public route
router.get("/partner/:partnerId", getPartnerReviews);

module.exports = router;
