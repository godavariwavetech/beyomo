const express = require("express");
const router = express.Router();
const adminAuthenticate = require("../../../../utils/adminAuthenticate");
const {
  adminListBanners,
  adminCreateBanner,
  adminUpdateBanner,
  adminDeleteBanner,
} = require("../../controllers/v1/banners.controller");

// Mounted at /api/v1/admin/banners
router.get("/", adminAuthenticate(), adminListBanners);
router.post("/", adminAuthenticate(["super_admin", "admin", "manager"]), adminCreateBanner);
router.put("/:id", adminAuthenticate(["super_admin", "admin", "manager"]), adminUpdateBanner);
router.delete("/:id", adminAuthenticate(["super_admin", "admin"]), adminDeleteBanner);

module.exports = router;
