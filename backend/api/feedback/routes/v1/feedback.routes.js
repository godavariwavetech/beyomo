const express = require("express");
const router = express.Router();
const { submitFeedback } = require("../../controllers/v1/feedback.controller");

// Optional auth — feedback can be anonymous too
const optionalAuth = (req, res, next) => {
  const authHeader = req.get("Authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      const { decodeToken } = require("../../../../utils/jwtUtils");
      const token = authHeader.split(" ")[1];
      const decoded = decodeToken(token);
      if (decoded.userType === "user") req.user = decoded;
    } catch (e) {
      // Ignore auth errors for optional auth
    }
  }
  next();
};

router.post("/", optionalAuth, submitFeedback);

module.exports = router;
