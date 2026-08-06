const express = require("express");
const router = express.Router();
const ServiceZone = require("../zones/models/zone.model");
const { listBanners } = require("./controllers/v1/banners.controller");

// Public: active banners for the app/website
router.get("/v1/banners", listBanners);

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
