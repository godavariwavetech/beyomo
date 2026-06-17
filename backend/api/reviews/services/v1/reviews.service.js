const { fn, col, literal } = require("sequelize");
const Review = require("../../models/review.model");
const User = require("../../../users/models/user.model");
const Service = require("../../../services/models/service.model");
const Booking = require("../../../bookings/models/booking.model");
const AppError = require("../../../../utils/errorHandlers/appError");

const getPartnerReviews = async (partnerId, page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  const where = { partnerId, status: "visible" };

  const { count: total, rows: reviews } = await Review.findAndCountAll({
    where,
    order: [["createdAt", "DESC"]],
    offset,
    limit,
    include: [
      { model: User, as: "user", attributes: ["name", "profilePicture"] },
      { model: Service, as: "service", attributes: ["name"] },
      { model: Booking, as: "booking", attributes: ["bookingCode"] },
    ],
  });

  const stats = await Review.findOne({
    where,
    attributes: [
      [fn("AVG", col("rating")), "avgRating"],
      [fn("COUNT", col("id")), "count"],
      [literal("SUM(rating = 5)"), "rating5"],
      [literal("SUM(rating = 4)"), "rating4"],
      [literal("SUM(rating = 3)"), "rating3"],
      [literal("SUM(rating = 2)"), "rating2"],
      [literal("SUM(rating = 1)"), "rating1"],
    ],
    raw: true,
  });

  const ratingStats =
    stats && stats.avgRating
      ? {
          average: parseFloat(parseFloat(stats.avgRating).toFixed(1)),
          total: parseInt(stats.count, 10),
          distribution: {
            5: parseInt(stats.rating5 || 0, 10),
            4: parseInt(stats.rating4 || 0, 10),
            3: parseInt(stats.rating3 || 0, 10),
            2: parseInt(stats.rating2 || 0, 10),
            1: parseInt(stats.rating1 || 0, 10),
          },
        }
      : { average: 0, total: 0, distribution: {} };

  return { data: reviews, stats: ratingStats, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};

module.exports = { getPartnerReviews };
