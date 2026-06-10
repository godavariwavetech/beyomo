const express = require("express");
const router = express.Router();
const Banner = require("./models/banner.model");
const ServiceZone = require("../zones/models/zone.model");

// Public: active banners for the app
router.get("/v1/banners", async (req, res) => {
  try {
    const banners = await Banner.findAll({
      where: { isActive: true },
      order: [["sortOrder", "ASC"], ["createdAt", "DESC"]],
    });
    res.json({ status: true, data: banners });
  } catch (e) {
    res.status(500).json({ status: false, message: e.message });
  }
});

// Public: check if a pincode/city is within a service zone
router.get("/v1/zones/check", async (req, res) => {
  try {
    const { pincode, city } = req.query;
    if (!pincode && !city) return res.status(400).json({ status: false, message: "pincode or city required" });

    const zones = await ServiceZone.findAll({ where: { isActive: true } });
    let matched = null;
    for (const z of zones) {
      const pins = z.pincodes || [];
      const cities = (z.cities || []).map(c => c.toLowerCase());
      if (pincode && pins.includes(String(pincode))) { matched = z; break; }
      if (city && cities.includes(city.toLowerCase())) { matched = z; break; }
    }
    res.json({ status: true, serviceable: !!matched, zone: matched });
  } catch (e) {
    res.status(500).json({ status: false, message: e.message });
  }
});

module.exports = router;
