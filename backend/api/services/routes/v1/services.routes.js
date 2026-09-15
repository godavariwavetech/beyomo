const express = require("express");
const router = express.Router();
const {
  getCategories,
  getSubcategories,
  getServices,
  getServiceById,
  getNearbyPartners,
} = require("../../controllers/v1/services.controller");

// All routes are public
router.get("/categories", getCategories);
router.get("/subcategories", getSubcategories);
router.get("/nearby", getNearbyPartners);
router.get("/", getServices);
router.get("/:id", getServiceById);

module.exports = router;
