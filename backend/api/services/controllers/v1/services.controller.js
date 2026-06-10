const catchAsync = require("../../../../utils/errorHandlers/catchAsync");
const AppError = require("../../../../utils/errorHandlers/appError");
const servicesService = require("../../services/v1/services.service");

/**
 * GET /api/v1/services/categories
 */
const getCategories = catchAsync(async (req, res, next) => {
  const cityId = req.query.cityId ? parseInt(req.query.cityId) : null;
  const categories = await servicesService.getCategories({ cityId });
  res.status(200).json({ status: true, data: categories });
});

/**
 * GET /api/v1/services/nearby
 */
const getNearbyPartners = catchAsync(async (req, res, next) => {
  const { lat, lng, serviceId, radius, page, limit } = req.query;

  if (!lat || !lng) {
    return next(new AppError("lat and lng query parameters are required", 400));
  }

  const result = await servicesService.getNearbyPartners(
    parseFloat(lat),
    parseFloat(lng),
    serviceId,
    parseFloat(radius) || 10,
    parseInt(page) || 1,
    parseInt(limit) || 20
  );

  res.status(200).json({ status: true, data: result.data, pagination: result.pagination });
});

/**
 * GET /api/v1/services
 */
const getServices = catchAsync(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const query = {
    categoryId: req.query.categoryId,
    search: req.query.search,
    cityId: req.query.cityId ? parseInt(req.query.cityId) : null,
  };

  const result = await servicesService.getServices(query, page, limit);
  res.status(200).json({ status: true, data: result.data, pagination: result.pagination });
});

/**
 * GET /api/v1/services/:id
 */
const getServiceById = catchAsync(async (req, res, next) => {
  const service = await servicesService.getServiceById(req.params.id);
  res.status(200).json({ status: true, data: service });
});

module.exports = { getCategories, getServices, getServiceById, getNearbyPartners };
