const catchAsync = require("../../../../utils/errorHandlers/catchAsync");
const AppError = require("../../../../utils/errorHandlers/appError");
const searchService = require("../../services/v1/search.service");

/**
 * GET /api/v1/search?q=...&cityId=...&limit=...
 */
const search = catchAsync(async (req, res, next) => {
  const q = (req.query.q ?? "").trim();
  if (q.length < 2) return next(new AppError("Search query must be at least 2 characters", 400));

  const cityId = req.query.cityId ? parseInt(req.query.cityId) : null;
  const limit = req.query.limit ? parseInt(req.query.limit) : 10;

  const result = await searchService.globalSearch({ q, cityId, limit });
  res.status(200).json({ status: true, data: result });
});

module.exports = { search };
