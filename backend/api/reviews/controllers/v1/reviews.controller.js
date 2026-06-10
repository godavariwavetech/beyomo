const catchAsync = require("../../../../utils/errorHandlers/catchAsync");
const reviewsService = require("../../services/v1/reviews.service");

/**
 * GET /api/v1/reviews/partner/:partnerId
 */
const getPartnerReviews = catchAsync(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const result = await reviewsService.getPartnerReviews(req.params.partnerId, page, limit);
  res.status(200).json({
    status: true,
    data: result.data,
    stats: result.stats,
    pagination: result.pagination,
  });
});

module.exports = { getPartnerReviews };
