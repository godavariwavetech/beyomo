const { Op } = require("sequelize");
const User = require("../../models/user.model");
const UserAddress = require("../../models/userAddress.model");
const Booking = require("../../../bookings/models/booking.model");
const Review = require("../../../reviews/models/review.model");
const Service = require("../../../services/models/service.model");
const Partner = require("../../../partners/models/partner.model");
const AppError = require("../../../../utils/errorHandlers/appError");

const getProfile = async (userId) => {
  const user = await User.findByPk(userId, {
    include: [{ model: UserAddress, as: "addresses" }],
  });
  if (!user || user.status === "deleted") throw new AppError("User not found", 404);
  return user;
};

const updateProfile = async (userId, updateData) => {
  const allowed = ["name", "email", "profilePicture"];
  const filtered = {};
  allowed.forEach((f) => { if (updateData[f] !== undefined) filtered[f] = updateData[f]; });

  await User.update(filtered, { where: { id: userId } });
  const user = await User.findByPk(userId, { include: [{ model: UserAddress, as: "addresses" }] });
  if (!user) throw new AppError("User not found", 404);
  return user;
};

const normalizeAddress = (data) => {
  const d = { ...data };
  if (d.tag && !d.label) d.label = d.tag;
  delete d.tag;
  if (d.city == null) d.city = "";
  if (d.state == null) d.state = "";
  if (d.pincode == null) d.pincode = "";
  return d;
};

const addAddress = async (userId, addressData) => {
  const normalized = normalizeAddress(addressData);
  const addresses = await UserAddress.findAll({ where: { userId } });

  if (normalized.isDefault || addresses.length === 0) {
    await UserAddress.update({ isDefault: false }, { where: { userId } });
    normalized.isDefault = true;
  }

  return UserAddress.create({ ...normalized, userId });
};

const updateAddress = async (userId, addressId, updateData) => {
  const address = await UserAddress.findOne({ where: { id: addressId, userId } });
  if (!address) throw new AppError("Address not found", 404);

  const normalized = normalizeAddress(updateData);
  if (normalized.isDefault === true) {
    await UserAddress.update({ isDefault: false }, { where: { userId } });
  }

  await address.update(normalized);
  return address;
};

const deleteAddress = async (userId, addressId) => {
  const address = await UserAddress.findOne({ where: { id: addressId, userId } });
  if (!address) throw new AppError("Address not found", 404);
  await address.destroy();
  return { message: "Address deleted successfully" };
};

const updateDeviceToken = async (userId, fcmToken) => {
  const user = await User.findByPk(userId);
  if (!user) throw new AppError("User not found", 404);
  const tokens = Array.from(new Set([...(user.deviceTokens || []), fcmToken]));
  await user.update({ fcmToken, deviceTokens: tokens });
  return { message: "Device token updated" };
};

const getBookings = async (userId, page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  const { count: total, rows: bookings } = await Booking.findAndCountAll({
    where: { userId },
    order: [["createdAt", "DESC"]],
    offset,
    limit,
    include: [
      { model: Service, as: "service", attributes: ["name", "image", "basePrice"] },
      { model: Partner, as: "partner", attributes: ["name", "profilePicture", "phone", "ratingsAverage", "ratingsCount"] },
    ],
  });

  return {
    data: bookings,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

const getWallet = async (userId) => {
  const user = await User.findByPk(userId, { attributes: ["walletBalance"] });
  if (!user) throw new AppError("User not found", 404);
  return { walletBalance: user.walletBalance };
};

const getReferral = async (userId) => {
  const user = await User.findByPk(userId, { attributes: ["referralCode", "walletBalance"] });
  if (!user) throw new AppError("User not found", 404);

  const referralCount = await User.count({ where: { referredById: userId } });
  return { referralCode: user.referralCode, walletCredits: user.walletBalance, referralCount };
};

const deleteAccount = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user || user.status === "deleted") throw new AppError("User not found", 404);

  await user.update({
    status: "deleted",
    name: null,
    email: null,
    profilePicture: null,
    phone: `deleted_${userId}_${Date.now()}`,
    deviceTokens: [],
    fcmToken: null,
  });

  return { message: "Account deleted" };
};

const getUserReviews = async (userId, page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  const { count: total, rows: reviews } = await Review.findAndCountAll({
    where: { userId, status: "visible" },
    order: [["createdAt", "DESC"]],
    offset,
    limit,
    include: [
      { model: Service, as: "service", attributes: ["name", "image"] },
      { model: Partner, as: "partner", attributes: ["name", "profilePicture"] },
    ],
  });

  return { reviews, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};

module.exports = {
  getProfile, updateProfile,
  addAddress, updateAddress, deleteAddress,
  updateDeviceToken, getBookings, getWallet,
  getReferral, getUserReviews, deleteAccount,
};
