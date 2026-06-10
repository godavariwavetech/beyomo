const { Op, fn, col, literal } = require("sequelize");
const { sequelize } = require("../../../../utils/dbconnect");
const User = require("../../../users/models/user.model");
const Partner = require("../../../partners/models/partner.model");
const Booking = require("../../../bookings/models/booking.model");
const Payment = require("../../../payments/models/payment.model");
const Review = require("../../../reviews/models/review.model");
const AppError = require("../../../../utils/errorHandlers/appError");
const moment = require("moment");

const cityIdsFilter = (cityIds) => {
  if (!cityIds?.length) return {};
  return { cityId: cityIds.length === 1 ? cityIds[0] : { [Op.in]: cityIds } };
};

const getDashboardStats = async (cityIds = null) => {
  const today = moment().startOf("day").toDate();
  const thisMonth = moment().startOf("month").toDate();
  const lastMonth = moment().subtract(1, "month").startOf("month").toDate();
  const lastMonthEnd = moment().subtract(1, "month").endOf("month").toDate();

  const cityFilter = cityIdsFilter(cityIds);

  const [
    totalUsers, newUsersToday, newUsersThisMonth,
    totalPartners, activePartners, pendingPartners,
    totalBookings, bookingsToday, bookingsThisMonth,
    completedBookings, cancelledBookings, pendingBookings,
    revenueThisMonth, revenueLastMonth, totalRevenue, avgRating,
  ] = await Promise.all([
    User.count({ where: { status: { [Op.ne]: "deleted" }, ...cityFilter } }),
    User.count({ where: { createdAt: { [Op.gte]: today }, ...cityFilter } }),
    User.count({ where: { createdAt: { [Op.gte]: thisMonth }, ...cityFilter } }),
    Partner.count({ where: { ...cityFilter } }),
    Partner.count({ where: { status: "approved", ...cityFilter } }),
    Partner.count({ where: { status: "pending", ...cityFilter } }),
    Booking.count({ where: { ...cityFilter } }),
    Booking.count({ where: { createdAt: { [Op.gte]: today }, ...cityFilter } }),
    Booking.count({ where: { createdAt: { [Op.gte]: thisMonth }, ...cityFilter } }),
    Booking.count({ where: { status: "completed", ...cityFilter } }),
    Booking.count({ where: { status: "cancelled", ...cityFilter } }),
    Booking.count({ where: { status: "pending", ...cityFilter } }),
    Payment.findOne({
      where: { status: "captured", createdAt: { [Op.gte]: thisMonth } },
      attributes: [[fn("SUM", col("amount")), "total"]], raw: true,
    }),
    Payment.findOne({
      where: { status: "captured", createdAt: { [Op.between]: [lastMonth, lastMonthEnd] } },
      attributes: [[fn("SUM", col("amount")), "total"]], raw: true,
    }),
    Payment.findOne({
      where: { status: "captured" },
      attributes: [[fn("SUM", col("amount")), "total"]], raw: true,
    }),
    Review.findOne({
      where: { status: "visible" },
      attributes: [[fn("AVG", col("rating")), "avg"]], raw: true,
    }),
  ]);

  const currentMonthRevenue = parseFloat(revenueThisMonth?.total || 0);
  const previousMonthRevenue = parseFloat(revenueLastMonth?.total || 0);
  const revenueGrowth = previousMonthRevenue > 0
    ? parseFloat((((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100).toFixed(1))
    : 0;

  return {
    users: { total: totalUsers, newToday: newUsersToday, newThisMonth: newUsersThisMonth },
    partners: { total: totalPartners, active: activePartners, pending: pendingPartners },
    bookings: { total: totalBookings, today: bookingsToday, thisMonth: bookingsThisMonth, completed: completedBookings, cancelled: cancelledBookings, pending: pendingBookings },
    revenue: { total: parseFloat(totalRevenue?.total || 0), thisMonth: currentMonthRevenue, lastMonth: previousMonthRevenue, growth: revenueGrowth },
    avgRating: avgRating?.avg ? parseFloat(parseFloat(avgRating.avg).toFixed(1)) : 0,
  };
};

const getRevenueData = async (period = "daily", cityIds = null) => {
  let startDate, groupExpr, dateFormat;

  switch (period) {
    case "daily":
      startDate = moment().subtract(30, "days").toDate();
      groupExpr = "DATE(p.createdAt)";
      dateFormat = "%Y-%m-%d";
      break;
    case "weekly":
      startDate = moment().subtract(12, "weeks").toDate();
      groupExpr = "YEARWEEK(p.createdAt, 1)";
      dateFormat = null;
      break;
    case "monthly":
      startDate = moment().subtract(12, "months").toDate();
      groupExpr = "DATE_FORMAT(p.createdAt, '%Y-%m')";
      dateFormat = "%Y-%m";
      break;
    default:
      throw new AppError("Invalid period. Use daily, weekly, or monthly", 400);
  }

  const cityJoin = cityIds?.length ? "INNER JOIN bookings b ON p.bookingId = b.id" : "";
  const cityWhere = cityIds?.length ? `AND b.cityId IN (${cityIds.join(',')})` : "";

  const rows = await sequelize.query(
    `SELECT ${groupExpr} as date_group,
            DATE_FORMAT(MIN(p.createdAt), '${dateFormat || "%Y-%m-%d"}') as date,
            SUM(p.amount) as revenue,
            COUNT(*) as transactions
     FROM payments p
     ${cityJoin}
     WHERE p.status = 'captured' AND p.createdAt >= :startDate ${cityWhere}
     GROUP BY date_group
     ORDER BY date_group ASC`,
    { replacements: { startDate }, type: sequelize.QueryTypes.SELECT }
  );

  return { period, data: rows.map((r) => ({ date: r.date, revenue: parseFloat(r.revenue || 0), transactions: parseInt(r.transactions, 10) })) };
};

const getBookingAnalytics = async (period = "daily") => {
  let startDate, groupExpr;
  switch (period) {
    case "daily": startDate = moment().subtract(30, "days").toDate(); groupExpr = "DATE(createdAt)"; break;
    case "weekly": startDate = moment().subtract(12, "weeks").toDate(); groupExpr = "YEARWEEK(createdAt, 1)"; break;
    case "monthly": startDate = moment().subtract(12, "months").toDate(); groupExpr = "DATE_FORMAT(createdAt, '%Y-%m')"; break;
    default: throw new AppError("Invalid period", 400);
  }

  const [trend, statusDist, topServices] = await Promise.all([
    sequelize.query(
      `SELECT ${groupExpr} as period, status, COUNT(*) as count FROM bookings WHERE createdAt >= :startDate GROUP BY ${groupExpr}, status ORDER BY ${groupExpr} ASC`,
      { replacements: { startDate }, type: sequelize.QueryTypes.SELECT }
    ),
    sequelize.query(
      `SELECT status, COUNT(*) as count FROM bookings GROUP BY status`,
      { type: sequelize.QueryTypes.SELECT }
    ),
    sequelize.query(
      `SELECT b.serviceId, s.name as serviceName, COUNT(*) as count, SUM(b.totalAmount) as revenue
       FROM bookings b LEFT JOIN services s ON b.serviceId = s.id
       WHERE b.status = 'completed'
       GROUP BY b.serviceId, s.name ORDER BY count DESC LIMIT 10`,
      { type: sequelize.QueryTypes.SELECT }
    ),
  ]);

  return {
    trend,
    statusDistribution: statusDist.reduce((acc, r) => { acc[r.status] = parseInt(r.count, 10); return acc; }, {}),
    topServices,
  };
};

const getUserGrowth = async (period = "monthly") => {
  let startDate, groupExpr, dateFormat;
  switch (period) {
    case "daily": startDate = moment().subtract(30, "days").toDate(); groupExpr = "DATE(createdAt)"; dateFormat = "%Y-%m-%d"; break;
    case "weekly": startDate = moment().subtract(12, "weeks").toDate(); groupExpr = "YEARWEEK(createdAt, 1)"; dateFormat = "%Y-%m-%d"; break;
    case "monthly":
    default: startDate = moment().subtract(12, "months").toDate(); groupExpr = "DATE_FORMAT(createdAt, '%Y-%m')"; dateFormat = "%Y-%m"; break;
  }

  const sql = `SELECT ${groupExpr} as period, DATE_FORMAT(MIN(createdAt), '${dateFormat}') as date, COUNT(*) as count FROM {TABLE} WHERE createdAt >= :startDate GROUP BY ${groupExpr} ORDER BY ${groupExpr} ASC`;

  const [userGrowth, partnerGrowth] = await Promise.all([
    sequelize.query(sql.replace("{TABLE}", "users"), { replacements: { startDate }, type: sequelize.QueryTypes.SELECT }),
    sequelize.query(sql.replace("{TABLE}", "partners"), { replacements: { startDate }, type: sequelize.QueryTypes.SELECT }),
  ]);

  return {
    period,
    users: userGrowth.map((r) => ({ date: r.date, count: parseInt(r.count, 10) })),
    partners: partnerGrowth.map((r) => ({ date: r.date, count: parseInt(r.count, 10) })),
  };
};

// ── Coupon usage list ─────────────────────────────────────────────────────────
const getCouponUsage = async ({ page = 1, limit = 20, search = null }) => {
  const offset = (page - 1) * limit;

  const where = {
    [Op.and]: [
      { couponCode: { [Op.not]: null } },
      { couponCode: { [Op.ne]: "" } },
    ],
  };
  if (search) where.couponCode = { [Op.like]: `%${search.toUpperCase()}%` };

  const { count: total, rows } = await Booking.findAndCountAll({
    where,
    order: [["createdAt", "DESC"]],
    offset,
    limit,
    include: [{ model: User, as: "user", attributes: ["id", "name", "phone", "email"] }],
    attributes: ["id", "bookingCode", "couponCode", "couponDiscountAmount", "baseAmount", "totalAmount", "createdAt", "userId", "status"],
  });

  const [stats] = await sequelize.query(
    `SELECT COUNT(*) as totalOrders,
            COALESCE(SUM(couponDiscountAmount), 0) as totalDiscount,
            COUNT(DISTINCT userId) as uniqueUsers
     FROM bookings WHERE couponCode IS NOT NULL AND couponCode != ''`,
    { type: sequelize.QueryTypes.SELECT }
  );

  const [mostUsed] = await sequelize.query(
    `SELECT couponCode, COUNT(*) as useCount
     FROM bookings WHERE couponCode IS NOT NULL AND couponCode != ''
     GROUP BY couponCode ORDER BY useCount DESC LIMIT 1`,
    { type: sequelize.QueryTypes.SELECT }
  );

  return {
    summary: {
      totalOrders: parseInt(stats?.totalOrders || 0),
      totalDiscount: parseFloat(stats?.totalDiscount || 0),
      uniqueUsers: parseInt(stats?.uniqueUsers || 0),
      mostUsedCoupon: mostUsed
        ? { code: mostUsed.couponCode, count: parseInt(mostUsed.useCount) }
        : null,
    },
    data: rows.map(b => ({
      bookingId: b.id,
      bookingCode: b.bookingCode,
      couponCode: b.couponCode,
      discountAmount: parseFloat(b.couponDiscountAmount || 0),
      orderAmount: parseFloat(b.baseAmount || 0),
      totalAmount: parseFloat(b.totalAmount || 0),
      status: b.status,
      usedAt: b.createdAt,
      user: b.user
        ? { id: b.user.id, name: b.user.name || "N/A", phone: b.user.phone, email: b.user.email }
        : null,
    })),
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

// ── User engagement ───────────────────────────────────────────────────────────
const getUserEngagement = async ({ page = 1, limit = 20 }) => {
  const offset = (page - 1) * limit;

  const rows = await sequelize.query(
    `SELECT
       u.id, u.name, u.phone, u.email, u.status, u.createdAt AS joinedAt,
       COUNT(b.id)                                                                          AS totalBookings,
       SUM(CASE WHEN b.status = 'completed'                               THEN 1 ELSE 0 END) AS completedBookings,
       SUM(CASE WHEN b.status = 'cancelled'                               THEN 1 ELSE 0 END) AS cancelledBookings,
       SUM(CASE WHEN b.couponCode IS NOT NULL AND b.couponCode != ''      THEN 1 ELSE 0 END) AS couponUsageCount,
       COALESCE(SUM(CASE WHEN b.status = 'completed' THEN b.totalAmount ELSE 0 END), 0)     AS totalSpent,
       MAX(b.createdAt)  AS lastBookingAt,
       MIN(b.createdAt)  AS firstBookingAt
     FROM users u
     LEFT JOIN bookings b ON u.id = b.userId
     WHERE u.status != 'deleted'
     GROUP BY u.id, u.name, u.phone, u.email, u.status, u.createdAt
     ORDER BY totalBookings DESC, totalSpent DESC
     LIMIT :limit OFFSET :offset`,
    { replacements: { limit, offset }, type: sequelize.QueryTypes.SELECT }
  );

  const [countRow] = await sequelize.query(
    `SELECT COUNT(*) AS total FROM users WHERE status != 'deleted'`,
    { type: sequelize.QueryTypes.SELECT }
  );

  const [summary] = await sequelize.query(
    `SELECT
       COUNT(DISTINCT u.id)                                                              AS totalUsers,
       COUNT(DISTINCT CASE WHEN bc.cnt > 0  THEN u.id END)                              AS activeUsers,
       COUNT(DISTINCT CASE WHEN bc.cnt >= 5 THEN u.id END)                              AS powerUsers,
       ROUND(COALESCE(AVG(bc.cnt), 0), 1)                                               AS avgBookings
     FROM users u
     LEFT JOIN (SELECT userId, COUNT(*) AS cnt FROM bookings GROUP BY userId) bc ON u.id = bc.userId
     WHERE u.status != 'deleted'`,
    { type: sequelize.QueryTypes.SELECT }
  );

  const total = parseInt(countRow?.total || 0);
  return {
    summary: {
      totalUsers:  parseInt(summary?.totalUsers  || 0),
      activeUsers: parseInt(summary?.activeUsers || 0),
      powerUsers:  parseInt(summary?.powerUsers  || 0),
      avgBookings: parseFloat(summary?.avgBookings || 0),
    },
    data: rows.map(r => ({
      userId:            r.id,
      name:              r.name || "N/A",
      phone:             r.phone,
      email:             r.email,
      status:            r.status,
      joinedAt:          r.joinedAt,
      totalBookings:     parseInt(r.totalBookings     || 0),
      completedBookings: parseInt(r.completedBookings || 0),
      cancelledBookings: parseInt(r.cancelledBookings || 0),
      couponUsageCount:  parseInt(r.couponUsageCount  || 0),
      totalSpent:        parseFloat(r.totalSpent      || 0),
      lastBookingAt:     r.lastBookingAt,
      firstBookingAt:    r.firstBookingAt,
    })),
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

module.exports = { getDashboardStats, getRevenueData, getBookingAnalytics, getUserGrowth, getCouponUsage, getUserEngagement };
