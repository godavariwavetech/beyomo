const express = require("express");
const router = express.Router();
const authenticate = require("../../../../utils/authenticate");
const partnerAuthenticate = require("../../../../utils/partnerAuthenticate");
const { getNotifications, markAsRead, markAllAsRead } = require("../../controllers/v1/notifications.controller");

// Middleware that accepts both user and partner tokens
const flexAuth = (req, res, next) => {
  const authHeader = req.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ status: false, message: "Authentication token is required" });
  }

  const { decodeToken } = require("../../../../utils/jwtUtils");
  try {
    const token = authHeader.split(" ")[1];
    const decoded = decodeToken(token);

    if (decoded.userType === "user") {
      req.user = decoded;
    } else if (decoded.userType === "partner") {
      req.partner = decoded;
    } else {
      return res.status(403).json({ status: false, message: "Access denied" });
    }
    next();
  } catch (err) {
    return res.status(401).json({ status: false, message: "Invalid or expired token" });
  }
};

router.use(flexAuth);

router.get("/", getNotifications);
router.patch("/read-all", markAllAsRead);
router.patch("/:id/read", markAsRead);

module.exports = router;
