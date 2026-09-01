const catchAsync = require("../../../../utils/errorHandlers/catchAsync");
const AppError = require("../../../../utils/errorHandlers/appError");
const reportsService = require("../../services/v1/reports.service");
const adminService = require("../../../adminUsers/services/v1/admin.service");

const parseCityIds = (q) => {
  if (!q) return null;
  const ids = String(q).split(',').map(Number).filter(n => Number.isInteger(n) && n > 0);
  return ids.length ? ids : null;
};

// Resolves the cityIds a request is actually allowed to see: the requested filter
// intersected with the admin's allowedZones (super_admin / unrestricted admins see everything requested).
const resolveCityIds = async (req) => {
  let cityIds = parseCityIds(req.query.cityIds) ?? (req.query.cityId ? [parseInt(req.query.cityId)] : null);
  if (req.admin.allowedZones?.length && req.admin.role !== "super_admin") {
    const zoneCityIds = await adminService.resolveZoneCityIds(req.admin.allowedZones);
    if (zoneCityIds) cityIds = cityIds ? cityIds.filter(id => zoneCityIds.includes(id)) : zoneCityIds;
  }
  return cityIds;
};

/**
 * GET /api/v1/admin/reports/dashboard
 */
const getDashboard = catchAsync(async (req, res, next) => {
  const cityIds = await resolveCityIds(req);
  const stats = await reportsService.getDashboardStats(cityIds);
  res.status(200).json({ status: true, data: stats });
});

/**
 * GET /api/v1/admin/reports/revenue?period=daily|weekly|monthly&cityIds=
 */
const getRevenue = catchAsync(async (req, res, next) => {
  const { period } = req.query;
  const cityIds = await resolveCityIds(req);
  const data = await reportsService.getRevenueData(period || "daily", cityIds);
  res.status(200).json({ status: true, data });
});

/**
 * GET /api/v1/admin/reports/bookings?period=daily|weekly|monthly&cityIds=
 */
const getBookings = catchAsync(async (req, res, next) => {
  const { period } = req.query;
  const cityIds = await resolveCityIds(req);
  const data = await reportsService.getBookingAnalytics(period || "daily", cityIds);
  res.status(200).json({ status: true, data });
});

/**
 * GET /api/v1/admin/reports/users?period=daily|weekly|monthly&cityIds=
 */
const getUsers = catchAsync(async (req, res, next) => {
  const { period } = req.query;
  const cityIds = await resolveCityIds(req);
  const data = await reportsService.getUserGrowth(period || "monthly", cityIds);
  res.status(200).json({ status: true, data });
});

/**
 * GET /api/v1/admin/reports/coupon-usage?page=&limit=&search=&cityIds=
 */
const getCouponUsage = catchAsync(async (req, res) => {
  const page   = parseInt(req.query.page)  || 1;
  const limit  = parseInt(req.query.limit) || 20;
  const search = req.query.search?.trim()  || null;
  const cityIds = await resolveCityIds(req);
  const result = await reportsService.getCouponUsage({ page, limit, search, cityIds });
  res.status(200).json({ status: true, ...result });
});

/**
 * GET /api/v1/admin/reports/user-engagement?page=&limit=&cityIds=
 */
const getUserEngagement = catchAsync(async (req, res) => {
  const page  = parseInt(req.query.page)  || 1;
  const limit = parseInt(req.query.limit) || 20;
  const cityIds = await resolveCityIds(req);
  const result = await reportsService.getUserEngagement({ page, limit, cityIds });
  res.status(200).json({ status: true, ...result });
});

/**
 * GET /api/v1/admin/reports/summary?months=3|6|12&cityIds=
 * Every stat card and chart series the admin Reports page renders, in one round trip.
 */
const getSummary = catchAsync(async (req, res) => {
  const cityIds = await resolveCityIds(req);
  const data = await reportsService.getReportsSummary({ months: req.query.months, cityIds });
  res.status(200).json({ status: true, data });
});

module.exports = { getDashboard, getRevenue, getBookings, getUsers, getCouponUsage, getUserEngagement, getSummary };
