const catchAsync = require("../../../../utils/errorHandlers/catchAsync");
const AppError = require("../../../../utils/errorHandlers/appError");
const reportsService = require("../../services/v1/reports.service");

const parseCityIds = (q) => {
  if (!q) return null;
  const ids = String(q).split(',').map(Number).filter(n => Number.isInteger(n) && n > 0);
  return ids.length ? ids : null;
};

/**
 * GET /api/v1/admin/reports/dashboard
 */
const getDashboard = catchAsync(async (req, res, next) => {
  const cityIds = parseCityIds(req.query.cityIds) ?? (req.query.cityId ? [parseInt(req.query.cityId)] : null);
  const stats = await reportsService.getDashboardStats(cityIds);
  res.status(200).json({ status: true, data: stats });
});

/**
 * GET /api/v1/admin/reports/revenue?period=daily|weekly|monthly&cityIds=
 */
const getRevenue = catchAsync(async (req, res, next) => {
  const { period } = req.query;
  const cityIds = parseCityIds(req.query.cityIds) ?? (req.query.cityId ? [parseInt(req.query.cityId)] : null);
  const data = await reportsService.getRevenueData(period || "daily", cityIds);
  res.status(200).json({ status: true, data });
});

/**
 * GET /api/v1/admin/reports/bookings?period=daily|weekly|monthly
 */
const getBookings = catchAsync(async (req, res, next) => {
  const { period } = req.query;
  const data = await reportsService.getBookingAnalytics(period || "daily");
  res.status(200).json({ status: true, data });
});

/**
 * GET /api/v1/admin/reports/users?period=daily|weekly|monthly
 */
const getUsers = catchAsync(async (req, res, next) => {
  const { period } = req.query;
  const data = await reportsService.getUserGrowth(period || "monthly");
  res.status(200).json({ status: true, data });
});

/**
 * GET /api/v1/admin/reports/coupon-usage?page=&limit=&search=
 */
const getCouponUsage = catchAsync(async (req, res) => {
  const page   = parseInt(req.query.page)  || 1;
  const limit  = parseInt(req.query.limit) || 20;
  const search = req.query.search?.trim()  || null;
  const result = await reportsService.getCouponUsage({ page, limit, search });
  res.status(200).json({ status: true, ...result });
});

/**
 * GET /api/v1/admin/reports/user-engagement?page=&limit=
 */
const getUserEngagement = catchAsync(async (req, res) => {
  const page  = parseInt(req.query.page)  || 1;
  const limit = parseInt(req.query.limit) || 20;
  const result = await reportsService.getUserEngagement({ page, limit });
  res.status(200).json({ status: true, ...result });
});

module.exports = { getDashboard, getRevenue, getBookings, getUsers, getCouponUsage, getUserEngagement };
