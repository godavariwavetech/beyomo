const express = require("express");
const router = express.Router();
const authenticate = require("../../../../utils/authenticate");
const { listCoupons, validateCoupon, applyCoupon } = require("../../controllers/v1/coupons.controller");

router.use(authenticate);

router.get("/", listCoupons);
router.post("/validate", validateCoupon);
router.post("/apply", applyCoupon);

module.exports = router;
