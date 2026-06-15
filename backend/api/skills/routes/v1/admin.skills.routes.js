const express = require("express");
const router = express.Router();
const adminAuthenticate = require("../../../../utils/adminAuthenticate");
const {
  adminGetCategories, adminCreateCategory, adminUpdateCategory, adminDeleteCategory,
  adminCreateSkill, adminUpdateSkill, adminDeleteSkill,
} = require("../../controllers/v1/skills.controller");

router.use(adminAuthenticate());

// Skill categories
router.get("/categories", adminGetCategories);
router.post("/categories", adminCreateCategory);
router.put("/categories/:id", adminUpdateCategory);
router.delete("/categories/:id", adminDeleteCategory);

// Skills within a category
router.post("/categories/:catId/skills", adminCreateSkill);
router.put("/skills/:id", adminUpdateSkill);
router.delete("/skills/:id", adminDeleteSkill);

module.exports = router;
