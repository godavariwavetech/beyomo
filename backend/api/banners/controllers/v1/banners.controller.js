const catchAsync = require("../../../../utils/errorHandlers/catchAsync");
const bannersService = require("../../services/v1/banners.service");

// GET /api/v1/banners — public, active banners for the app/website
const listBanners = catchAsync(async (req, res) => {
  const data = await bannersService.listActive();
  res.json({ status: true, data });
});

// Admin handlers
const adminListBanners = catchAsync(async (req, res) => {
  const data = await bannersService.listAll();
  res.json({ status: true, data });
});

const adminCreateBanner = catchAsync(async (req, res) => {
  const banner = await bannersService.createBanner(req.body);
  res.status(201).json({ status: true, data: banner });
});

const adminUpdateBanner = catchAsync(async (req, res) => {
  const banner = await bannersService.updateBanner(req.params.id, req.body);
  res.json({ status: true, data: banner });
});

const adminDeleteBanner = catchAsync(async (req, res) => {
  await bannersService.deleteBanner(req.params.id);
  res.json({ status: true, message: "Banner deleted" });
});

module.exports = {
  listBanners,
  adminListBanners,
  adminCreateBanner,
  adminUpdateBanner,
  adminDeleteBanner,
};
