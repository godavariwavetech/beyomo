const express = require("express");
const router = express.Router();
const adminAuthenticate = require("../../../../utils/adminAuthenticate");
const {
  listPackages,
  getPackage,
  adminListPackages,
  adminCreatePackage,
  adminUpdatePackage,
  adminDeletePackage,
} = require("../../controllers/v1/packages.controller");

// Admin endpoints — must be registered BEFORE /:id to avoid the wildcard swallowing /admin/*
router.get("/admin/list", adminAuthenticate(), adminListPackages);
router.post("/admin", adminAuthenticate(["super_admin", "admin", "manager"]), adminCreatePackage);
router.put("/admin/:id", adminAuthenticate(["super_admin", "admin", "manager"]), adminUpdatePackage);
router.delete("/admin/:id", adminAuthenticate(["super_admin", "admin"]), adminDeletePackage);

// Public endpoints — no auth, same as services/categories, so the website (and the
// app before login) can browse packages/combos.
router.get("/", listPackages);
router.get("/:id", getPackage);

module.exports = router;
