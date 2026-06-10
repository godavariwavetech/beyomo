const { Op, fn, col, literal } = require("sequelize");
const { sequelize } = require("../../../../utils/dbconnect");
const fs = require("fs");
const path = require("path");
const Partner = require("../../models/partner.model");
const PartnerService = require("../../models/partnerService.model");
const Booking = require("../../../bookings/models/booking.model");
const Service = require("../../../services/models/service.model");
const User = require("../../../users/models/user.model");
const AppError = require("../../../../utils/errorHandlers/appError");
const logger = require("../../../../utils/logger");

const getProfile = async (partnerId) => {
  const partner = await Partner.findByPk(partnerId);
  if (!partner) throw new AppError("Partner not found", 404);
  return partner;
};

const saveBase64Image = (base64DataUri, partnerId) => {
  const matches = base64DataUri.match(/^data:image\/(jpeg|jpg|png|webp);base64,(.+)$/);
  if (!matches) return null;
  const ext = matches[1] === "jpeg" ? "jpg" : matches[1];
  const buffer = Buffer.from(matches[2], "base64");
  const filename = `partner-${partnerId}-${Date.now()}.${ext}`;
  const uploadsDir = path.join(__dirname, "../../../../uploads");
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  fs.writeFileSync(path.join(uploadsDir, filename), buffer);
  return `/uploads/${filename}`;
};

const updateProfile = async (partnerId, updateData) => {
  const allowed = ["name", "email", "profilePicture", "bio", "experience", "cityId",
    "locationLat", "locationLng", "locationAddress", "locationCity", "locationState", "locationPincode"];
  const filtered = {};
  allowed.forEach((f) => { if (updateData[f] !== undefined) filtered[f] = updateData[f]; });

  // Convert base64 image to a file; store the relative URL path instead of raw base64
  if (filtered.profilePicture && filtered.profilePicture.startsWith("data:")) {
    const savedPath = saveBase64Image(filtered.profilePicture, partnerId);
    filtered.profilePicture = savedPath ?? null;
  }

  // Handle nested location object from app
  if (updateData.location) {
    const l = updateData.location;
    if (l.lat !== undefined) filtered.locationLat = l.lat;
    if (l.lng !== undefined) filtered.locationLng = l.lng;
    if (l.address !== undefined) filtered.locationAddress = l.address;
    if (l.city !== undefined) filtered.locationCity = l.city;
    if (l.state !== undefined) filtered.locationState = l.state;
    if (l.pincode !== undefined) filtered.locationPincode = l.pincode;
  }

  await Partner.update(filtered, { where: { id: partnerId } });

  // Handle services array
  if (Array.isArray(updateData.services) && updateData.services.length > 0) {
    await PartnerService.destroy({ where: { partnerId } });

    const partnerServices = updateData.services.map((serviceId) => {
      if (typeof serviceId === 'number') {
        return { partnerId, serviceId };
      }
      return { partnerId, serviceId: serviceId.serviceId, categoryId: serviceId.categoryId, price: serviceId.price };
    });

    await PartnerService.bulkCreate(partnerServices);
  }

  const partner = await Partner.findByPk(partnerId);
  if (!partner) throw new AppError("Partner not found", 404);
  return partner;
};

const updateDocuments = async (partnerId, documentData) => {
  const fields = {};
  if (documentData.aadhar !== undefined) fields.aadharUrl = documentData.aadhar;
  if (documentData.pan !== undefined) fields.panUrl = documentData.pan;
  if (documentData.bankDetails) {
    const bd = documentData.bankDetails;
    if (bd.accountNo !== undefined) fields.bankAccountNo = bd.accountNo;
    if (bd.ifsc !== undefined) fields.bankIfsc = bd.ifsc;
    if (bd.bankName !== undefined) fields.bankName = bd.bankName;
    if (bd.holderName !== undefined) fields.bankHolderName = bd.holderName;
  }
  await Partner.update(fields, { where: { id: partnerId } });
  const partner = await Partner.findByPk(partnerId);
  if (!partner) throw new AppError("Partner not found", 404);
  return {
    aadhar: partner.aadharUrl,
    pan: partner.panUrl,
    bankDetails: {
      accountNo: partner.bankAccountNo,
      ifsc: partner.bankIfsc,
      bankName: partner.bankName,
      holderName: partner.bankHolderName,
    },
  };
};

const getDashboard = async (partnerId) => {
  const partner = await Partner.findByPk(partnerId, {
    attributes: ["totalEarnings", "pendingEarnings", "ratingsAverage", "ratingsCount", "status"],
  });
  if (!partner) throw new AppError("Partner not found", 404);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [totalBookings, pendingBookings, completedToday, totalCompleted] = await Promise.all([
    Booking.count({ where: { partnerId } }),
    Booking.count({ where: { partnerId, status: "pending" } }),
    Booking.count({ where: { partnerId, status: "completed", completedAt: { [Op.gte]: today } } }),
    Booking.count({ where: { partnerId, status: "completed" } }),
  ]);

  return {
    totalEarnings: partner.totalEarnings,
    pendingEarnings: partner.pendingEarnings,
    ratings: { average: partner.ratingsAverage, count: partner.ratingsCount },
    status: partner.status,
    bookingStats: { total: totalBookings, pending: pendingBookings, completedToday, totalCompleted },
  };
};

const getBookings = async (partnerId, page = 1, limit = 10, status) => {
  const offset = (page - 1) * limit;
  const pidInt = parseInt(partnerId);

  // Include bookings where this partner is primary OR has claimed services (multi-partner)
  const partnerCondition = {
    [Op.or]: [
      { partnerId: pidInt },
      // JSON_CONTAINS with string literal — works on both MySQL and MariaDB
      literal(
        `JSON_CONTAINS(JSON_EXTRACT(COALESCE(\`Booking\`.\`services\`, '[]'), '$[*].assignedPartnerId'), '${pidInt}')`
      ),
    ],
  };
  const where = status ? { ...partnerCondition, status } : partnerCondition;

  const { count: total, rows: bookings } = await Booking.findAndCountAll({
    where,
    order: [["scheduledAt", "DESC"]],
    offset,
    limit,
    include: [
      { model: User, as: "user", attributes: ["name", "phone", "profilePicture"] },
      { model: Service, as: "service", attributes: ["name", "image", "basePrice", "duration"] },
    ],
  });

  return { data: bookings, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};

const updateBookingStatus = async (partnerId, bookingId, status) => {
  const booking = await Booking.findByPk(bookingId);
  if (!booking) throw new AppError("Booking not found", 404);

  const svcs = (() => { const s = booking.services; if (Array.isArray(s)) return s; if (typeof s === 'string') { try { return JSON.parse(s); } catch { return []; } } return []; })();
  const hasTracking = svcs.length > 0 && svcs[0].serviceStatus !== undefined;
  const isPrimaryPartner = String(booking.partnerId) === String(partnerId);
  const hasClaimedServices = svcs.some(s => String(s.assignedPartnerId) === String(partnerId));

  if (!isPrimaryPartner && !hasClaimedServices) {
    throw new AppError("Booking not found", 404);
  }

  if (status === "in_progress") {
    if (!["confirmed", "in_progress"].includes(booking.status)) {
      throw new AppError(`Cannot start a booking with status "${booking.status}"`, 400);
    }
    await booking.update({ status: "in_progress" });
    return booking.reload();
  }

  if (status === "completed") {
    // Edge case 9: must be in_progress before completing (both old and new flow)
    if (!["in_progress", "confirmed"].includes(booking.status)) {
      throw new AppError(`Cannot complete a booking with status "${booking.status}"`, 400);
    }

    if (!hasTracking) {
      // Old single-partner flow: booking must be in_progress
      if (booking.status !== "in_progress") {
        throw new AppError(`Cannot complete a booking with status "${booking.status}"`, 400);
      }
      await booking.update({ status: "completed", completedAt: new Date() });
      return booking.reload();
    }

    // Multi-partner: mark only this partner's services as completed
    // Accept both 'claimed' and 'in_progress' service statuses (partner may have skipped explicit start)
    const updatedSvcs = svcs.map(s => {
      if (
        String(s.assignedPartnerId) === String(partnerId) &&
        (s.serviceStatus === "claimed" || s.serviceStatus === "in_progress")
      ) {
        return { ...s, serviceStatus: "completed" };
      }
      return s;
    });

    // Booking completes only when every tracked service is done
    const allDone = updatedSvcs.every(s => !s.serviceStatus || s.serviceStatus === "completed");
    const updates = { services: updatedSvcs };
    if (allDone) {
      updates.status = "completed";
      updates.completedAt = new Date();
    }

    await booking.update(updates);
    return booking.reload();
  }

  throw new AppError(`Invalid status: ${status}`, 400);
};

const updateDeviceToken = async (partnerId, fcmToken) => {
  const partner = await Partner.findByPk(partnerId);
  if (!partner) throw new AppError("Partner not found", 404);

  const tokens = Array.from(new Set([...(partner.deviceTokens || []), fcmToken]));
  await partner.update({ fcmToken, deviceTokens: tokens });

  logger.info(`Device token updated for partner ${partnerId}. Token: ${fcmToken.substring(0, 20)}..., Total tokens: ${tokens.length}`);

  return { message: "Device token updated" };
};

const getEarnings = async (partnerId, period = "month") => {
  const now = new Date();
  let startDate = null;

  if (period === "week") {
    startDate = new Date(now);
    startDate.setDate(now.getDate() - 7);
    startDate.setHours(0, 0, 0, 0);
  } else if (period === "month") {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const pidInt = parseInt(partnerId);

  // Edge case 5: include bookings where this partner is primary OR secondary (claimed services)
  const partnerCondition = {
    [Op.or]: [
      { partnerId: pidInt },
      literal(
        `JSON_CONTAINS(JSON_EXTRACT(COALESCE(\`Booking\`.\`services\`, '[]'), '$[*].assignedPartnerId'), CAST(${pidInt} AS JSON))`
      ),
    ],
  };
  const where = { ...partnerCondition, status: "completed" };
  if (startDate) where.completedAt = { [Op.gte]: startDate };

  const [completedBookings, partner] = await Promise.all([
    Booking.findAll({
      where,
      order: [["completedAt", "DESC"]],
      include: [{ model: Service, as: "service", attributes: ["name", "image", "duration"] }],
    }),
    Partner.findByPk(partnerId, { attributes: ["totalEarnings", "ratingsAverage", "ratingsCount"] }),
  ]);

  // Edge case 5: compute this partner's actual earning from their slice of services
  const partnerEarningForBooking = (b) => {
    const svcs = Array.isArray(b.services) ? b.services : [];
    const hasTracking = svcs.length > 0 && svcs[0].serviceStatus !== undefined;
    if (!hasTracking) return parseFloat(b.partnerEarning || b.totalAmount || 0);
    return svcs
      .filter(s => String(s.assignedPartnerId) === String(partnerId))
      .reduce((sum, s) => sum + s.price * (s.qty || 1), 0);
  };

  const totalEarned = completedBookings.reduce((sum, b) => sum + partnerEarningForBooking(b), 0);
  const totalJobs = completedBookings.length;

  const recentEarnings = completedBookings.slice(0, 10).map((b) => {
    const myEarning = partnerEarningForBooking(b);
    const svcs = Array.isArray(b.services) ? b.services : [];
    const myServiceNames = svcs
      .filter(s => String(s.assignedPartnerId) === String(partnerId))
      .map(s => s.name)
      .filter(Boolean);
    return {
      id: b.id,
      orderId: b.bookingCode || String(b.id),
      service: myServiceNames.join(', ') || b.service?.name || "Service",
      date: b.completedAt
        ? new Date(b.completedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
        : "",
      net: myEarning,
    };
  });

  return {
    period,
    stats: { jobs: totalJobs, earned: totalEarned },
    averageRating: partner?.ratingsAverage ?? null,
    totalReviews: partner?.ratingsCount ?? 0,
    totalEarnings: partner?.totalEarnings ?? 0,
    recentEarnings,
  };
};

const getAvailableBookings = async (partnerId) => {
  const partner = await Partner.findByPk(partnerId, { attributes: ['locationCity'] });
  const where = { status: { [Op.in]: ['pending', 'confirmed'] } };
  if (partner?.locationCity) where.addressCity = partner.locationCity;

  const bookings = await Booking.findAll({
    where,
    order: [['createdAt', 'DESC']],
    limit: 60,
    include: [
      { model: Service, as: 'service', attributes: ['name', 'image', 'duration', 'basePrice'] },
      { model: User, as: 'user', attributes: ['name', 'phone'] },
    ],
  });

  const parseSvcs = (s) => {
    if (Array.isArray(s)) return s;
    if (typeof s === 'string') { try { return JSON.parse(s); } catch { return []; } }
    return [];
  };

  // Keep only bookings that have at least one service not yet claimed by someone else
  return bookings.filter(b => {
    const svcs = parseSvcs(b.services);
    if (svcs.length === 0 || !svcs[0].serviceStatus) {
      // Old format (no per-service tracking) — available only if no primary partner
      return !b.partnerId;
    }
    // Already claimed everything myself — don't show again
    const myClaimedAll = svcs.every(s => String(s.assignedPartnerId) === String(partnerId));
    if (myClaimedAll) return false;
    // Has at least one unassigned service
    return svcs.some(s => s.serviceStatus === 'unassigned');
  });
};

const proposeServiceChanges = async (partnerId, bookingId, proposedServices) => {
  const { sendPushNotification } = require('../../../../utils/firebaseUtils');
  const Notification = require('../../../notifications/models/notification.model');

  const booking = await Booking.findOne({ where: { id: bookingId, status: ['confirmed', 'in_progress'] } });
  if (!booking) throw new AppError('Booking not found or not in an active state', 404);

  const parseSvc = (s) => { if (Array.isArray(s)) return s; if (typeof s === 'string') { try { return JSON.parse(s); } catch { return []; } } return []; };
  const isAuthorised = String(booking.partnerId) === String(partnerId)
    || parseSvc(booking.services).some(s => String(s.assignedPartnerId) === String(partnerId));
  if (!isAuthorised) throw new AppError('Not authorised for this booking', 403);

  const newBaseAmount = proposedServices.reduce((sum, s) => sum + (parseFloat(s.price) || 0) * (s.qty || 1), 0);
  const couponDiscount = parseFloat(booking.couponDiscountAmount || 0);
  const taxableAmount = newBaseAmount - couponDiscount;
  const tax = parseFloat((taxableAmount * 0.18).toFixed(2));
  const newTotal = parseFloat((taxableAmount + tax).toFixed(2));

  await booking.update({
    serviceUpdatePending: true,
    pendingServicesUpdate: { services: proposedServices, totalAmount: newTotal, requestedAt: new Date() },
  });

  const user = await User.findByPk(booking.userId);
  const oldTotal = parseFloat(booking.totalAmount || 0);
  const msg = `Your partner has updated services for booking ${booking.bookingCode}. New total: ₹${newTotal.toLocaleString('en-IN')}. Please approve or reject the changes.`;

  if (user?.fcmToken) {
    await sendPushNotification([user.fcmToken], 'Service Update Request', msg,
      { bookingId: String(booking.id), type: 'service_update' }).catch(() => {});
  }
  await Notification.create({ userId: booking.userId, title: 'Service Update Request', body: msg,
    data: { bookingId: String(booking.id), type: 'service_update' }, type: 'booking' });

  return booking;
};

const claimServices = async (partnerId, bookingId, serviceIndices) => {
  const Notification = require('../../../notifications/models/notification.model');
  const { sendPushNotification } = require('../../../../utils/firebaseUtils');

  const partner = await Partner.findByPk(partnerId, { attributes: ['name'] });
  if (!partner) throw new AppError('Partner not found', 404);

  // Edge case 2: deduplicate indices so the same service can't be claimed twice in one call
  const uniqueIndices = [...new Set(serviceIndices.map(Number))];

  // Edge cases 1 & 3: wrap in a transaction with row-level lock to prevent race conditions.
  // The lock prevents two concurrent partners from both reading the same service as 'unassigned'.
  // Edge case 3: also allow in_progress bookings so partner B can claim when A already started.
  return sequelize.transaction(async (t) => {
    const booking = await Booking.findOne({
      where: { id: bookingId, status: { [Op.in]: ['pending', 'confirmed', 'in_progress'] } },
      lock: t.LOCK.UPDATE,
      transaction: t,
    });
    if (!booking) throw new AppError('Booking not found or not available', 404);

    const parseSvcs = (s) => {
      if (Array.isArray(s)) return [...s];
      if (typeof s === 'string') { try { return JSON.parse(s); } catch { return []; } }
      return [];
    };
    const svcs = parseSvcs(booking.services);

    // Validate each index inside the transaction (after the lock is held)
    for (const idx of uniqueIndices) {
      if (idx < 0 || idx >= svcs.length) throw new AppError(`Invalid service index: ${idx}`, 400);
      const svc = svcs[idx];
      if (svc.serviceStatus && svc.serviceStatus !== 'unassigned') {
        throw new AppError(`"${svc.name}" is already claimed by another partner`, 409);
      }
    }

    uniqueIndices.forEach(idx => {
      svcs[idx] = {
        ...svcs[idx],
        serviceStatus: 'claimed',
        assignedPartnerId: parseInt(partnerId),
        assignedPartnerName: partner.name,
      };
    });

    const allClaimed = svcs.every(s => s.serviceStatus && s.serviceStatus !== 'unassigned');
    const updates = { services: svcs };
    if (!booking.partnerId) updates.partnerId = parseInt(partnerId);
    // Keep in_progress if already running; otherwise confirm
    if (booking.status === 'pending' || (booking.status === 'confirmed' && allClaimed)) {
      updates.status = 'confirmed';
    }

    await booking.update(updates, { transaction: t });

    const user = await User.findByPk(booking.userId, { transaction: t });
    const names = uniqueIndices.map(i => svcs[i]?.name || 'Service').join(', ');
    if (user?.fcmToken) {
      await sendPushNotification(
        [user.fcmToken], 'Partner Assigned',
        `${partner.name} accepted: ${names} for booking ${booking.bookingCode}.`,
        { bookingId: String(booking.id), type: 'booking' }
      );
    }
    await Notification.create({
      userId: booking.userId, title: 'Partner Assigned',
      body: `${partner.name} has accepted services from your booking ${booking.bookingCode}.`,
      data: { bookingId: String(booking.id) }, type: 'booking',
    }, { transaction: t });

    return booking.reload({
      include: [
        { model: Service, as: 'service', attributes: ['name', 'image', 'duration', 'basePrice'] },
        { model: User, as: 'user', attributes: ['name', 'phone'] },
      ],
      transaction: t,
    });
  });
};

const acceptBooking = async (partnerId, bookingId) => {
  const svcsResult = await Booking.findByPk(bookingId);
  if (!svcsResult) throw new AppError('Booking not found', 404);

  const svcs = Array.isArray(svcsResult.services) ? svcsResult.services : [];
  const hasTracking = svcs.length > 0 && svcs[0].serviceStatus !== undefined;

  if (!hasTracking) {
    // Old format: simple full accept
    const Notification = require('../../../notifications/models/notification.model');
    const { sendPushNotification } = require('../../../../utils/firebaseUtils');
    const [updated] = await Booking.update(
      { partnerId, status: 'confirmed' },
      { where: { id: bookingId, partnerId: null, status: 'pending' } }
    );
    if (updated === 0) throw new AppError('Booking is no longer available', 409);
    const booking = await Booking.findByPk(bookingId, {
      include: [
        { model: Service, as: 'service', attributes: ['name', 'image', 'duration', 'basePrice'] },
        { model: User, as: 'user', attributes: ['name', 'phone', 'fcmToken'] },
      ],
    });
    const user = await User.findByPk(booking.userId);
    if (user?.fcmToken) {
      await sendPushNotification([user.fcmToken], 'Partner Assigned',
        `A partner has accepted your booking ${booking.bookingCode}.`,
        { bookingId: String(booking.id), type: 'booking' });
    }
    await Notification.create({
      userId: booking.userId, title: 'Partner Assigned',
      body: `Your booking ${booking.bookingCode} has been accepted by a partner.`,
      data: { bookingId: String(booking.id) }, type: 'booking',
    });
    return booking;
  }

  // New format: claim all unassigned services
  const unassignedIndices = svcs.reduce((acc, s, i) => {
    if (s.serviceStatus === 'unassigned') acc.push(i);
    return acc;
  }, []);
  if (unassignedIndices.length === 0) throw new AppError('Booking is no longer available', 409);
  return claimServices(partnerId, bookingId, unassignedIndices);
};

const addExtraServices = async (partnerId, bookingId, serviceItems) => {
  const Notification = require('../../../notifications/models/notification.model');
  const { sendPushNotification } = require('../../../../utils/firebaseUtils');

  const booking = await Booking.findOne({ where: { id: bookingId, status: ['confirmed', 'in_progress'] } });
  if (!booking) throw new AppError('Booking not found or not in an active state', 404);

  // Verify this partner has a stake in the booking
  const svcs = (() => { const s = booking.services; if (Array.isArray(s)) return s; if (typeof s === 'string') { try { return JSON.parse(s); } catch { return []; } } return []; })();
  const isAuthorised = String(booking.partnerId) === String(partnerId)
    || svcs.some(s => String(s.assignedPartnerId) === String(partnerId));
  if (!isAuthorised) throw new AppError('Booking not found or not currently in progress', 404);

  const serviceIds = serviceItems.map(s => parseInt(s.id));
  const foundServices = await Service.findAll({ where: { id: serviceIds, isActive: true } });
  if (foundServices.length !== serviceIds.length) {
    throw new AppError('One or more services not found or unavailable', 404);
  }

  // Fetch partner name to stamp on each extra service (needed for earnings tracking)
  const partnerRecord = await Partner.findByPk(partnerId, { attributes: ['name'] });
  const partnerName = partnerRecord?.name ?? null;

  const serviceMap = Object.fromEntries(foundServices.map(s => [s.id, s]));
  const newServices = serviceItems.map(item => {
    const svc = serviceMap[parseInt(item.id)];
    return {
      serviceId: svc.id,
      name: svc.name,
      price: parseFloat(svc.basePrice),
      qty: item.qty || 1,
      duration: svc.duration || null,
      image: svc.image || null,
      addedByPartner: true,
      // Edge case 6: stamp ownership so earnings and UI filter work correctly per partner
      serviceStatus: 'claimed',
      assignedPartnerId: parseInt(partnerId),
      assignedPartnerName: partnerName,
    };
  });

  const existingServices = (() => { const s = booking.services; if (Array.isArray(s)) return s; if (typeof s === 'string') { try { return JSON.parse(s); } catch { return []; } } return []; })();
  const updatedServices = [...existingServices, ...newServices];

  const newBaseAmount = updatedServices.reduce((sum, s) => sum + s.price * (s.qty || 1), 0);
  const couponDiscount = parseFloat(booking.couponDiscountAmount || 0);
  const taxableAmount = newBaseAmount - couponDiscount;
  const tax = parseFloat((taxableAmount * 0.18).toFixed(2));
  const total = parseFloat((taxableAmount + tax).toFixed(2));

  await booking.update({
    services: updatedServices,
    baseAmount: newBaseAmount,
    taxAmount: tax,
    totalAmount: total,
    partnerEarning: total,
  });

  const user = await User.findByPk(booking.userId);
  const addedNames = newServices.map(s => s.name).join(', ');
  if (user?.fcmToken) {
    await sendPushNotification(
      [user.fcmToken],
      'Services Added to Your Booking',
      `Your partner added: ${addedNames}. New total: ₹${total}`,
      { bookingId: String(booking.id), type: 'booking' }
    );
  }
  await Notification.create({
    userId: booking.userId,
    title: 'Services Added',
    body: `Your partner added extra services to booking ${booking.bookingCode}. New total: ₹${total}`,
    data: { bookingId: String(booking.id) },
    type: 'booking',
  });

  return booking.reload();
};

module.exports = {
  getProfile, updateProfile, updateDocuments,
  getDashboard, getBookings, getAvailableBookings, acceptBooking, claimServices, updateBookingStatus,
  updateDeviceToken, getEarnings, addExtraServices, proposeServiceChanges,
};
