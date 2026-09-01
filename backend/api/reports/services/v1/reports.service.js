const { Op, fn, col, literal } = require("sequelize");
const { sequelize } = require("../../../../utils/dbconnect");
const User = require("../../../users/models/user.model");
const Partner = require("../../../partners/models/partner.model");
const Booking = require("../../../bookings/models/booking.model");
const Payment = require("../../../payments/models/payment.model");
const Review = require("../../../reviews/models/review.model");
const Coupon = require("../../../coupons/models/coupon.model");
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
    activeCoupons, awaitingReview,
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
    // A coupon counts as live only if it is switched on, inside its validity window,
    // AND has usage left — the dashboard tile previously showed a hardcoded 0.
    Coupon.count({
      where: {
        isActive: true,
        validFrom: { [Op.lte]: new Date() },
        validTill: { [Op.gte]: new Date() },
        [Op.and]: literal("(maxUses IS NULL OR usedCount < maxUses)"),
      },
    }),
    // Reviews carry only visible/hidden — there is no "pending moderation" queue to
    // count. The actionable number for an admin is the opposite side: jobs that are
    // finished but the customer never rated.
    sequelize.query(
      `SELECT COUNT(*) AS n FROM bookings b
       LEFT JOIN reviews r ON r.bookingId = b.id
       WHERE b.status = 'completed' AND r.id IS NULL
       ${cityIds?.length ? `AND b.cityId IN (${cityIds.join(",")})` : ""}`,
      { type: sequelize.QueryTypes.SELECT }
    ),
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
    coupons: { active: activeCoupons },
    reviews: { awaitingReview: parseInt(awaitingReview?.[0]?.n || 0, 10) },
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

const getBookingAnalytics = async (period = "daily", cityIds = null) => {
  let startDate, groupExpr;
  switch (period) {
    case "daily": startDate = moment().subtract(30, "days").toDate(); groupExpr = "DATE(createdAt)"; break;
    case "weekly": startDate = moment().subtract(12, "weeks").toDate(); groupExpr = "YEARWEEK(createdAt, 1)"; break;
    case "monthly": startDate = moment().subtract(12, "months").toDate(); groupExpr = "DATE_FORMAT(createdAt, '%Y-%m')"; break;
    default: throw new AppError("Invalid period", 400);
  }

  const cityWhere = cityIds?.length ? `AND cityId IN (${cityIds.join(',')})` : "";
  const cityWhereB = cityIds?.length ? `AND b.cityId IN (${cityIds.join(',')})` : "";

  const [trend, statusDist, topServices] = await Promise.all([
    sequelize.query(
      `SELECT ${groupExpr} as period, status, COUNT(*) as count FROM bookings WHERE createdAt >= :startDate ${cityWhere} GROUP BY ${groupExpr}, status ORDER BY ${groupExpr} ASC`,
      { replacements: { startDate }, type: sequelize.QueryTypes.SELECT }
    ),
    sequelize.query(
      `SELECT status, COUNT(*) as count FROM bookings WHERE 1=1 ${cityWhere} GROUP BY status`,
      { type: sequelize.QueryTypes.SELECT }
    ),
    sequelize.query(
      `SELECT b.serviceId, s.name as serviceName, COUNT(*) as count, SUM(b.totalAmount) as revenue
       FROM bookings b LEFT JOIN services s ON b.serviceId = s.id
       WHERE b.status = 'completed' ${cityWhereB}
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

const getUserGrowth = async (period = "monthly", cityIds = null) => {
  let startDate, groupExpr, dateFormat;
  switch (period) {
    case "daily": startDate = moment().subtract(30, "days").toDate(); groupExpr = "DATE(createdAt)"; dateFormat = "%Y-%m-%d"; break;
    case "weekly": startDate = moment().subtract(12, "weeks").toDate(); groupExpr = "YEARWEEK(createdAt, 1)"; dateFormat = "%Y-%m-%d"; break;
    case "monthly":
    default: startDate = moment().subtract(12, "months").toDate(); groupExpr = "DATE_FORMAT(createdAt, '%Y-%m')"; dateFormat = "%Y-%m"; break;
  }

  const cityWhere = cityIds?.length ? `AND cityId IN (${cityIds.join(',')})` : "";
  const sql = `SELECT ${groupExpr} as period, DATE_FORMAT(MIN(createdAt), '${dateFormat}') as date, COUNT(*) as count FROM {TABLE} WHERE createdAt >= :startDate ${cityWhere} GROUP BY ${groupExpr} ORDER BY ${groupExpr} ASC`;

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
const getCouponUsage = async ({ page = 1, limit = 20, search = null, cityIds = null }) => {
  const offset = (page - 1) * limit;

  const where = {
    [Op.and]: [
      { couponCode: { [Op.not]: null } },
      { couponCode: { [Op.ne]: "" } },
    ],
    ...cityIdsFilter(cityIds),
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

  const cityWhere = cityIds?.length ? `AND cityId IN (${cityIds.join(',')})` : "";

  const [stats] = await sequelize.query(
    `SELECT COUNT(*) as totalOrders,
            COALESCE(SUM(couponDiscountAmount), 0) as totalDiscount,
            COUNT(DISTINCT userId) as uniqueUsers
     FROM bookings WHERE couponCode IS NOT NULL AND couponCode != '' ${cityWhere}`,
    { type: sequelize.QueryTypes.SELECT }
  );

  const [mostUsed] = await sequelize.query(
    `SELECT couponCode, COUNT(*) as useCount
     FROM bookings WHERE couponCode IS NOT NULL AND couponCode != '' ${cityWhere}
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
const getUserEngagement = async ({ page = 1, limit = 20, cityIds = null }) => {
  const offset = (page - 1) * limit;
  const cityWhere = cityIds?.length ? `AND u.cityId IN (${cityIds.join(',')})` : "";

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
     WHERE u.status != 'deleted' ${cityWhere}
     GROUP BY u.id, u.name, u.phone, u.email, u.status, u.createdAt
     ORDER BY totalBookings DESC, totalSpent DESC
     LIMIT :limit OFFSET :offset`,
    { replacements: { limit, offset }, type: sequelize.QueryTypes.SELECT }
  );

  const [countRow] = await sequelize.query(
    `SELECT COUNT(*) AS total FROM users u WHERE u.status != 'deleted' ${cityWhere}`,
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
     WHERE u.status != 'deleted' ${cityWhere}`,
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


// ── Reports page summary ──────────────────────────────────────────────────────
// One aggregate powering every tab of the admin Reports page. It exists because that
// page previously rendered hardcoded stat cards (a literal "₹43.24L" and friends)
// alongside chart series derived from revenue with invented ratios — bookings guessed
// as revenue/1200, then split 85% completed / 10% cancelled. Every number here is
// measured from the tables.
//
// `months` bounds the window (the page's 12m/6m/3m selector). Monetary figures come
// from completed bookings, since partnerEarning — the basis of the commission split —
// is only meaningful once a booking is actually done.
const getReportsSummary = async ({ months = 12, cityIds = null } = {}) => {
  const span = [3, 6, 12].includes(Number(months)) ? Number(months) : 12;
  const startDate = moment().subtract(span, "months").startOf("month").toDate();
  const daysInSpan = Math.max(1, moment().diff(moment(startDate), "days"));

  const cityWhere = cityIds?.length ? `AND cityId IN (${cityIds.join(",")})` : "";
  const cityWhereB = cityIds?.length ? `AND b.cityId IN (${cityIds.join(",")})` : "";
  const q = (sql, replacements = { startDate }) =>
    sequelize.query(sql, { replacements, type: sequelize.QueryTypes.SELECT });

  // Admin's cut is what remains of the discounted, pre-tax amount after the partner's
  // share. GST is a pass-through to the government and never part of either side's
  // earnings — the same basis createBooking uses to derive partnerEarning.
  const COMMISSION_EXPR =
    "GREATEST(COALESCE(baseAmount,0) - COALESCE(couponDiscountAmount,0) - COALESCE(partnerEarning,0), 0)";

  const [
    revenueSeries, bookingSeries, userSeries, partnerSeries,
    revenueTotals, bookingTotals, statusDist, userTotals, retention, partnerPerf, topServices,
  ] = await Promise.all([
    q(`SELECT DATE_FORMAT(createdAt, '%Y-%m') AS month,
              COALESCE(SUM(totalAmount), 0)        AS revenue,
              COALESCE(SUM(${COMMISSION_EXPR}), 0) AS commission,
              COALESCE(SUM(partnerEarning), 0)     AS payout
       FROM bookings
       WHERE status = 'completed' AND createdAt >= :startDate ${cityWhere}
       GROUP BY month ORDER BY month ASC`),

    q(`SELECT DATE_FORMAT(createdAt, '%Y-%m') AS month,
              COUNT(*) AS bookings,
              SUM(status = 'completed') AS completed,
              SUM(status = 'cancelled') AS cancelled
       FROM bookings
       WHERE createdAt >= :startDate ${cityWhere}
       GROUP BY month ORDER BY month ASC`),

    q(`SELECT DATE_FORMAT(createdAt, '%Y-%m') AS month, COUNT(*) AS count
       FROM users WHERE createdAt >= :startDate ${cityWhere}
       GROUP BY month ORDER BY month ASC`),

    // partners has no cityId column, so the city filter cannot narrow this series
    q(`SELECT DATE_FORMAT(createdAt, '%Y-%m') AS month, COUNT(*) AS count
       FROM partners WHERE createdAt >= :startDate
       GROUP BY month ORDER BY month ASC`),

    q(`SELECT COALESCE(SUM(totalAmount), 0)        AS revenue,
              COALESCE(SUM(${COMMISSION_EXPR}), 0) AS commission,
              COALESCE(SUM(partnerEarning), 0)     AS payout
       FROM bookings
       WHERE status = 'completed' AND createdAt >= :startDate ${cityWhere}`),

    q(`SELECT COUNT(*) AS total,
              SUM(status = 'completed') AS completed,
              SUM(status = 'cancelled') AS cancelled,
              COUNT(DISTINCT userId)    AS bookingUsers
       FROM bookings WHERE createdAt >= :startDate ${cityWhere}`),

    q(`SELECT status, COUNT(*) AS count FROM bookings
       WHERE 1=1 ${cityWhere} GROUP BY status ORDER BY count DESC`),

    q(`SELECT COUNT(*) AS total,
              SUM(createdAt >= :monthStart) AS newThisMonth
       FROM users WHERE 1=1 ${cityWhere}`,
      { monthStart: moment().startOf("month").toDate() }),

    // Retention = share of booking customers who came back for a second booking.
    q(`SELECT COUNT(*) AS bookedUsers, SUM(c >= 2) AS repeatUsers FROM (
         SELECT userId, COUNT(*) AS c FROM bookings
         WHERE createdAt >= :startDate ${cityWhere} GROUP BY userId
       ) t`),

    q(`SELECT p.name,
              COUNT(b.id)                        AS jobs,
              COALESCE(p.ratingsAverage, 0)      AS rating,
              COALESCE(SUM(b.partnerEarning), 0) AS earnings
       FROM partners p
       JOIN bookings b ON b.partnerId = p.id AND b.status = 'completed'
       WHERE b.createdAt >= :startDate ${cityWhereB}
       GROUP BY p.id, p.name, p.ratingsAverage
       ORDER BY earnings DESC LIMIT 10`),

    q(`SELECT COALESCE(s.name, 'Unknown') AS name,
              COUNT(*) AS count,
              COALESCE(SUM(b.totalAmount), 0) AS revenue
       FROM bookings b LEFT JOIN services s ON b.serviceId = s.id
       WHERE b.status = 'completed' AND b.createdAt >= :startDate ${cityWhereB}
       GROUP BY b.serviceId, s.name ORDER BY revenue DESC LIMIT 10`),
  ]);

  const num = (v) => parseFloat(v || 0);
  const int = (v) => parseInt(v || 0, 10);
  const pct = (part, whole) => (whole > 0 ? parseFloat(((part / whole) * 100).toFixed(1)) : 0);

  const rev = revenueTotals[0] ?? {};
  const bk = bookingTotals[0] ?? {};
  const us = userTotals[0] ?? {};
  const ret = retention[0] ?? {};

  // Users and partners are counted in separate tables; align them on one month axis so
  // the growth chart can plot both series against a single set of labels.
  const byMonth = new Map();
  for (const r of userSeries) byMonth.set(r.month, { month: r.month, users: int(r.count), partners: 0 });
  for (const r of partnerSeries) {
    const e = byMonth.get(r.month) ?? { month: r.month, users: 0, partners: 0 };
    e.partners = int(r.count);
    byMonth.set(r.month, e);
  }

  const totalBookings = int(bk.total);
  const monthsWithRevenue = revenueSeries.length || 1;

  return {
    period: { months: span, from: moment(startDate).format("YYYY-MM-DD"), days: daysInSpan },
    revenue: {
      total: num(rev.revenue),
      platformEarnings: num(rev.commission),
      partnerPayouts: num(rev.payout),
      avgMonthly: parseFloat((num(rev.revenue) / monthsWithRevenue).toFixed(2)),
      series: revenueSeries.map((r) => ({
        month: r.month,
        revenue: num(r.revenue),
        commission: num(r.commission),
        payout: num(r.payout),
      })),
    },
    bookings: {
      total: totalBookings,
      completed: int(bk.completed),
      cancelled: int(bk.cancelled),
      completionRate: pct(int(bk.completed), totalBookings),
      cancellationRate: pct(int(bk.cancelled), totalBookings),
      avgPerDay: parseFloat((totalBookings / daysInSpan).toFixed(1)),
      // All-time split across every status, for the dashboard's donut.
      statusDistribution: statusDist.map((r) => ({ status: r.status, count: int(r.count) })),
      series: bookingSeries.map((r) => ({
        month: r.month,
        bookings: int(r.bookings),
        completed: int(r.completed),
        cancelled: int(r.cancelled),
      })),
    },
    users: {
      total: int(us.total),
      newThisMonth: int(us.newThisMonth),
      retentionRate: pct(int(ret.repeatUsers), int(ret.bookedUsers)),
      avgBookingsPerUser: int(bk.bookingUsers) > 0
        ? parseFloat((totalBookings / int(bk.bookingUsers)).toFixed(1))
        : 0,
      series: [...byMonth.values()].sort((a, b) => a.month.localeCompare(b.month)),
    },
    partnerPerformance: partnerPerf.map((p) => ({
      name: p.name,
      jobs: int(p.jobs),
      rating: num(p.rating),
      earnings: num(p.earnings),
    })),
    topServices: topServices.map((s) => ({
      name: s.name,
      count: int(s.count),
      revenue: num(s.revenue),
    })),
  };
};

module.exports = { getDashboardStats, getRevenueData, getBookingAnalytics, getUserGrowth, getCouponUsage, getUserEngagement, getReportsSummary };

