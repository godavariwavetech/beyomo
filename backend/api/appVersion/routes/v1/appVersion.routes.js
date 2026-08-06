const express = require("express");
const router = express.Router();
const adminAuthenticate = require("../../../../utils/adminAuthenticate");
const {
  getVersionConfig,
  adminListVersions,
  adminUpsertVersion,
} = require("../../controllers/v1/appVersion.controller");

// Public — no auth, checked at splash before login
router.get("/", getVersionConfig);

// Admin
router.get("/admin/list", adminAuthenticate(), adminListVersions);
router.put("/admin", adminAuthenticate(["super_admin", "admin"]), adminUpsertVersion);

module.exports = router;
