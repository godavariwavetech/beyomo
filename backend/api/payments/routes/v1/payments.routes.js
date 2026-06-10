const express = require("express");
const router = express.Router();
const authenticate = require("../../../../utils/authenticate");
const { createOrder, verifyPayment, getHistory } = require("../../controllers/v1/payments.controller");

router.use(authenticate);

router.post("/create-order", createOrder);
router.post("/verify", verifyPayment);
router.get("/history", getHistory);

module.exports = router;
