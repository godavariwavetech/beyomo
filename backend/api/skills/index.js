const express = require("express");
const router = express.Router();
const publicRoutes = require("./routes/v1/public.skills.routes");
const adminRoutes = require("./routes/v1/admin.skills.routes");

router.use("/v1/skills/categories", publicRoutes);
router.use("/v1/admin/skills", adminRoutes);

module.exports = router;
