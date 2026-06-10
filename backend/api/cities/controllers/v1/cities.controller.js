const City = require("../../models/city.model");
const catchAsync = require("../../../../utils/errorHandlers/catchAsync");

// GET /api/v1/cities/active  — public, no auth
const getActiveCities = catchAsync(async (req, res) => {
  const cities = await City.findAll({
    where: { isActive: true },
    attributes: ["id", "name", "state", "lat", "lng", "radius"],
    order: [["name", "ASC"]],
  });
  res.status(200).json({ status: true, data: cities });
});

module.exports = { getActiveCities };
