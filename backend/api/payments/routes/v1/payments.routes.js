const express = require("express");
const router = express.Router();
const authenticate = require("../../../../utils/authenticate");
const { createOrder, verifyPayment, getHistory, webhook } = require("../../controllers/v1/payments.controller");

// Registered before the auth gate below — Razorpay calls this directly with no
// user session, and it authenticates itself via HMAC signature instead (see controller).
router.post("/webhook", webhook);

router.use(authenticate);

router.post("/create-order", createOrder);
router.post("/verify", verifyPayment);
router.get("/history", getHistory);

module.exports = router;
