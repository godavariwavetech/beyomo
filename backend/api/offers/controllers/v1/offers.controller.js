const catchAsync = require("../../../../utils/errorHandlers/catchAsync");
const offersService = require("../../services/v1/offers.service");

// GET /api/v1/offers  — list active offers for the app
const listOffers = catchAsync(async (req, res) => {
  const cityId = req.query.cityId ? Number(req.query.cityId) : null;
  const offers = await offersService.listActive(cityId);
  res.json({ status: true, data: offers });
});

// POST /api/v1/offers/check  — check which offers the current cart qualifies for
const checkOffers = catchAsync(async (req, res) => {
  const { serviceIds, totalAmount, cityId } = req.body;
  const eligible = await offersService.checkEligibility({ serviceIds, totalAmount, cityId });
  res.json({ status: true, data: eligible });
});

module.exports = { listOffers, checkOffers };
