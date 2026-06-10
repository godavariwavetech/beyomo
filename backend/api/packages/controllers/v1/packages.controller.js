const catchAsync = require("../../../../utils/errorHandlers/catchAsync");
const packagesService = require("../../services/v1/packages.service");

// GET /api/v1/packages  — list active packages for the user app
const listPackages = catchAsync(async (req, res) => {
  const cityId = req.query.cityId ? Number(req.query.cityId) : null;
  const data = await packagesService.listActive(cityId);
  res.json({ status: true, data });
});

// GET /api/v1/packages/:id
const getPackage = catchAsync(async (req, res) => {
  const data = await packagesService.getById(req.params.id);
  res.json({ status: true, data });
});

// Admin handlers
const adminListPackages = catchAsync(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const result = await packagesService.listAll({ page, limit });
  res.json({
    status: true,
    data: result.data,
    pagination: { total: result.total, page, limit, totalPages: Math.ceil(result.total / limit) },
  });
});

const adminCreatePackage = catchAsync(async (req, res) => {
  const pkg = await packagesService.createPackage(req.body);
  res.status(201).json({ status: true, data: pkg });
});

const adminUpdatePackage = catchAsync(async (req, res) => {
  const pkg = await packagesService.updatePackage(req.params.id, req.body);
  res.json({ status: true, data: pkg });
});

const adminDeletePackage = catchAsync(async (req, res) => {
  await packagesService.deletePackage(req.params.id);
  res.json({ status: true, message: "Package deleted" });
});

module.exports = {
  listPackages,
  getPackage,
  adminListPackages,
  adminCreatePackage,
  adminUpdatePackage,
  adminDeletePackage,
};
