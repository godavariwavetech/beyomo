const express = require("express");
const router = express.Router();
const authenticate = require("../../../../utils/authenticate");
const { listOffers, checkOffers } = require("../../controllers/v1/offers.controller");

router.get("/", authenticate, listOffers);
router.post("/check", authenticate, checkOffers);

module.exports = router;
