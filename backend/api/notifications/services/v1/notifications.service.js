const Notification = require("../../models/notification.model");
const AppError = require("../../../../utils/errorHandlers/appError");

const getNotifications = async (recipientId, recipientType, page = 1, limit = 20) => {
  const offset = (page - 1) * limit;
  const where = recipientType === "user" ? { userId: recipientId } : { partnerId: recipientId };

  const total = await Notification.count({ where });
  const unreadCount = await Notification.count({ where: { ...where, isRead: false } });
  const notifications = await Notification.findAll({
    where,
    order: [["createdAt", "DESC"]],
    offset,
    limit,
  });

  return { data: notifications, unreadCount, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};

const markAsRead = async (recipientId, recipientType, notificationId) => {
  const where = { id: notificationId };
  if (recipientType === "user") where.userId = recipientId;
  else where.partnerId = recipientId;

  const [updated] = await Notification.update({ isRead: true }, { where });
  if (!updated) throw new AppError("Notification not found", 404);
  return Notification.findByPk(notificationId);
};

const markAllAsRead = async (recipientId, recipientType) => {
  const where = recipientType === "user" ? { userId: recipientId } : { partnerId: recipientId };
  await Notification.update({ isRead: true }, { where: { ...where, isRead: false } });
  return { message: "All notifications marked as read" };
};

module.exports = { getNotifications, markAsRead, markAllAsRead };
