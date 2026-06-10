const express = require("express");
const router = express.Router();
const {
  getCategories,
  getServices,
  getServiceById,
  getNearbyPartners,
} = require("../../controllers/v1/services.controller");

// All routes are public
router.get("/categories", getCategories);
router.get("/nearby", getNearbyPartners);
router.get("/", getServices);
router.get("/:id", getServiceById);

module.exports = router;
