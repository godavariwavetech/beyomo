const catchAsync = require("../../../../utils/errorHandlers/catchAsync");
const notificationsService = require("../../services/v1/notifications.service");

/**
 * GET /api/v1/notifications
 */
const getNotifications = catchAsync(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;

  // Works for both user and partner tokens
  const isPartner = !!req.partner;
  const recipientId = isPartner ? req.partner.userId : req.user.userId;
  const recipientType = isPartner ? "partner" : "user";

  const result = await notificationsService.getNotifications(recipientId, recipientType, page, limit);
  res.status(200).json({
    status: true,
    data: result.data,
    unreadCount: result.unreadCount,
    pagination: result.pagination,
  });
});

/**
 * PATCH /api/v1/notifications/:id/read
 */
const markAsRead = catchAsync(async (req, res, next) => {
  const isPartner = !!req.partner;
  const recipientId = isPartner ? req.partner.userId : req.user.userId;
  const recipientType = isPartner ? "partner" : "user";

  const notification = await notificationsService.markAsRead(
    recipientId,
    recipientType,
    req.params.id
  );
  res.status(200).json({ status: true, message: "Notification marked as read", data: notification });
});

/**
 * PATCH /api/v1/notifications/read-all
 */
const markAllAsRead = catchAsync(async (req, res, next) => {
  const isPartner = !!req.partner;
  const recipientId = isPartner ? req.partner.userId : req.user.userId;
  const recipientType = isPartner ? "partner" : "user";

  const result = await notificationsService.markAllAsRead(recipientId, recipientType);
  res.status(200).json({ status: true, message: result.message });
});

module.exports = { getNotifications, markAsRead, markAllAsRead };
