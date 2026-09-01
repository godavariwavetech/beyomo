const { Op, fn, col, literal } = require("sequelize");
const { sequelize } = require("../../../../utils/dbconnect");
const fs = require("fs");
const path = require("path");
const Partner = require("../../models/partner.model");
const PartnerService = require("../../models/partnerService.model");
const PartnerSkillCategory = require("../../../skills/models/PartnerSkillCategory");
const Booking = require("../../../bookings/models/booking.model");
const Service = require("../../../services/models/service.model");
const ServiceCategory = require("../../../services/models/serviceCategory.model");
const User = require("../../../users/models/user.model");
const ServicePackage = require("../../../packages/models/package.model");
const settlementsService = require("../../../settlements/services/v1/settlements.service");
const { cityPriceResolver } = require("../../../services/services/v1/cityPricing");
const {
  resolveRatesForBooking,
  DEFAULT_ADMIN_PERCENT,
  DEFAULT_PARTNER_PERCENT,
  DEFAULT_GST_PERCENT,
} = require("../../../../utils/revenueSplit");
const AppError = require("../../../../utils/errorHandlers/appError");
const logger = require("../../../../utils/logger");

const getProfile = async (partnerId) => {
  const partner = await Partner.findByPk(partnerId);
  if (!partner) throw new AppError("Partner not found", 404);
  return partner;
};

const deleteAccount = async (partnerId) => {
  const partner = await Partner.findByPk(partnerId);
  if (!partner || partner.status === "deleted") throw new AppError("Partner not found", 404);

  await partner.update({
    status: "deleted",
    name: null,
    email: null,
    profilePicture: null,
    // `phone` is UNIQUE varchar(20); `deleted_<id>_<13-digit timestamp>` overflowed it
    // and MySQL rejected the update. The row id is already unique and never reused,
    // so it alone is enough to free the real number for re-registration.
    phone: `deleted_${partnerId}`,
    deviceTokens: [],
    fcmToken: null,
  });

  return { message: "Account deleted" };
};

const saveBase64Image = (base64DataUri, partnerId) => {
  const matches = base64DataUri.match(/^data:image\/(jpeg|jpg|png|webp);base64,(.+)$/);
  if (!matches) return null;
  const ext = matches[1] === "jpeg" ? "jpg" : matches[1];
  const buffer = Buffer.from(matches[2], "base64");
  const filename = `partner-${partnerId}-${Date.now()}.${ext}`;
  const uploadsDir = path.join(__dirname, "../../../../upload_files");
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  fs.writeFileSync(path.join(uploadsDir, filename), buffer);
  return `/upload_files/${filename}`;
};

const updateProfile = async (partnerId, updateData) => {
  const allowed = ["name", "email", "profilePicture", "bio", "experience", "cityId",
    "locationLat", "locationLng", "locationAddress", "locationCity", "locationState", "locationPincode",
    "serviceCategoryIds", "professions", "gender", "homeServicesConsent"];
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

  // Handle services array (legacy)
  if (Array.isArray(updateData.services) && updateData.services.length > 0) {
    await PartnerService.destroy({ where: { partnerId } });
    const partnerServices = updateData.services.map((serviceId) => {
      if (typeof serviceId === 'number') return { partnerId, serviceId };
      return { partnerId, serviceId: serviceId.serviceId, categoryId: serviceId.categoryId, price: serviceId.price };
    });
    await PartnerService.bulkCreate(partnerServices);
  }

  // Handle skill category selection
  if (Array.isArray(updateData.skillCategoryIds)) {
    await PartnerSkillCategory.destroy({ where: { partnerId } });
    if (updateData.skillCategoryIds.length > 0) {
      await PartnerSkillCategory.bulkCreate(
        updateData.skillCategoryIds.map((skillCategoryId) => ({ partnerId, skillCategoryId })),
        { ignoreDuplicates: true }
      );
    }
  }

  const partner = await Partner.findByPk(partnerId);
  if (!partner) throw new AppError("Partner not found", 404);
  return partner;
};

const saveBase64Doc = (base64DataUri, partnerId, prefix, allowPdf = false) => {
  const imgMatch = base64DataUri.match(/^data:image\/(jpeg|jpg|png|webp);base64,(.+)$/);
  const pdfMatch = allowPdf && base64DataUri.match(/^data:application\/pdf;base64,(.+)$/);
  const matches = imgMatch || pdfMatch;
  if (!matches) return null;
  const ext = imgMatch ? (imgMatch[1] === "jpeg" ? "jpg" : imgMatch[1]) : "pdf";
  const buffer = Buffer.from(matches[matches.length - 1], "base64");
  const filename = `${prefix}-${partnerId}-${Date.now()}.${ext}`;
  const uploadsDir = path.join(__dirname, "../../../../upload_files");
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  fs.writeFileSync(path.join(uploadsDir, filename), buffer);
  return `/upload_files/${filename}`;
};

const updateDocuments = async (partnerId, documentData) => {
  const fields = {};

  if (documentData.aadhar !== undefined) {
    if (documentData.aadhar && documentData.aadhar.startsWith("data:")) {
      fields.aadharUrl = saveBase64Doc(documentData.aadhar, partnerId, "aadhar") ?? null;
    } else {
      fields.aadharUrl = documentData.aadhar;
    }
  }

  if (documentData.agreement !== undefined) {
    if (documentData.agreement && documentData.agreement.startsWith("data:")) {
      fields.agreementUrl = saveBase64Doc(documentData.agreement, partnerId, "agreement", true) ?? null;
    } else {
      fields.agreementUrl = documentData.agreement;
    }
  }

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
    agreement: partner.agreementUrl,
    pan: partner.panUrl,
    bankDetails: {
      accountNo: partner.bankAccountNo,
      ifsc: partner.bankIfsc,
      bankName: partner.bankName,
      holderName: partner.bankHolderName,
    },
  };
};

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

const parseServiceItems = (s) => {
  if (Array.isArray(s)) return s;
  if (typeof s === "string") { try { return JSON.parse(s); } catch { return []; } }
  return [];
};

// Edge case 5: compute this partner's actual earning from their slice of services.
// Services' listed `price` is the raw undiscounted per-item price — bookings with
// packages/combos earn less than the sum of those prices, so scale the booking's real
// (already-discounted) partnerEarning by this partner's share of the raw total instead
// of summing raw prices directly (that overstated earnings for combo bookings).
const partnerEarningForBooking = (b, partnerId) => {
  const svcs = parseServiceItems(b.services);
  const hasTracking = svcs.length > 0 && svcs[0].serviceStatus !== undefined;
  const bookingEarning = parseFloat(b.partnerEarning || b.totalAmount || 0);
  if (!hasTracking) return bookingEarning;
  // Soft-removed services are not part of the booking's charged amount, so they must not
  // sit in the denominator either — leaving them in shrank every partner's share.
  // `price` is parseFloat-guarded: a single malformed item used to poison the whole sum
  // with NaN, which serialised to null and rendered as ₹0 on the dashboard.
  const itemRaw = (s) => (parseFloat(s.price) || 0) * (s.qty || 1);
  const active = svcs.filter(s => !s.removed);
  const rawTotal = active.reduce((sum, s) => sum + itemRaw(s), 0);
  const myRaw = active
    .filter(s => String(s.assignedPartnerId) === String(partnerId))
    .reduce((sum, s) => sum + itemRaw(s), 0);
  // A partner who is the booking's primary owner but holds no individually-stamped
  // service (legacy rows written before per-service claiming) still earned the booking.
  if (myRaw === 0 && String(b.partnerId) === String(partnerId)) {
    return active.some(s => s.assignedPartnerId != null) ? 0 : round2(bookingEarning);
  }
  // Scaling by a service share yields long floats (794.0553816...), which the apps rendered
  // verbatim — round to paise here so every consumer gets a presentable amount.
  return round2(rawTotal > 0 ? bookingEarning * (myRaw / rawTotal) : bookingEarning);
};

// The dashboard's Total Earning is computed live from completed bookings — the same
// per-booking formula the Earnings screen uses for its "All Time" total — instead of
// reading partner.totalEarnings (a counter incremented by the async settlement ledger
// job). That counter can lag or undercount if a ledger write ever fails silently, which
// made the dashboard total disagree with the Earnings screen's live-computed figure.
const computeTotalEarned = async (partnerId) => {
  const pidInt = parseInt(partnerId);
  const completed = await Booking.findAll({
    where: {
      [Op.or]: [
        { partnerId: pidInt },
        literal(
          `JSON_CONTAINS(JSON_EXTRACT(COALESCE(\`Booking\`.\`services\`, '[]'), '$[*].assignedPartnerId'), '${pidInt}')`
        ),
      ],
      status: "completed",
    },
    attributes: ["id", "partnerId", "services", "partnerEarning", "totalAmount"],
  });
  return round2(completed.reduce((sum, b) => sum + partnerEarningForBooking(b, partnerId), 0));
};

const getDashboard = async (partnerId) => {
  const partner = await Partner.findByPk(partnerId, {
    attributes: ["pendingEarnings", "ratingsAverage", "ratingsCount", "status"],
  });
  if (!partner) throw new AppError("Partner not found", 404);

  const pidInt = parseInt(partnerId);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Include bookings where this partner is primary OR has claimed services (multi-partner) —
  // matches the same condition used by getBookings, so the counts here are consistent with
  // what actually shows up in the partner's Jobs list.
  const partnerCondition = {
    [Op.or]: [
      { partnerId: pidInt },
      literal(
        `JSON_CONTAINS(JSON_EXTRACT(COALESCE(\`Booking\`.\`services\`, '[]'), '$[*].assignedPartnerId'), '${pidInt}')`
      ),
    ],
  };

  const [totalBookings, todayJobs, completedToday, totalCompleted, totalEarnings] = await Promise.all([
    Booking.count({ where: partnerCondition }),
    // "Today Jobs" = this partner's active (not cancelled) jobs scheduled for today —
    // NOT status: "pending", since an assigned booking is never "pending" (that status
    // means unassigned), so that query always returned 0 regardless of actual workload.
    Booking.count({
      where: { ...partnerCondition, scheduledAt: { [Op.gte]: today, [Op.lt]: tomorrow }, status: { [Op.ne]: "cancelled" } },
    }),
    Booking.count({ where: { ...partnerCondition, status: "completed", completedAt: { [Op.gte]: today } } }),
    Booking.count({ where: { ...partnerCondition, status: "completed" } }),
    computeTotalEarned(partnerId),
  ]);

  return {
    totalEarnings,
    pendingEarnings: partner.pendingEarnings,
    ratings: { average: partner.ratingsAverage, count: partner.ratingsCount },
    status: partner.status,
    bookingStats: { total: totalBookings, todayJobs, completedToday, totalCompleted },
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

const getBookingById = async (partnerId, bookingId) => {
  const booking = await Booking.findByPk(bookingId, {
    include: [
      { model: User, as: "user", attributes: ["name", "phone", "profilePicture"] },
      { model: Service, as: "service", attributes: ["name", "image", "basePrice", "duration"] },
      { model: ServicePackage, as: "package", attributes: ["id", "title", "price", "image"] },
    ],
  });
  if (!booking) throw new AppError("Booking not found", 404);

  const svcs = (() => { const s = booking.services; if (Array.isArray(s)) return s; if (typeof s === 'string') { try { return JSON.parse(s); } catch { return []; } } return []; })();
  const isAuthorised = String(booking.partnerId) === String(partnerId)
    || svcs.some(s => String(s.assignedPartnerId) === String(partnerId));
  if (!isAuthorised) throw new AppError("Booking not found", 404);

  return booking;
};

const updateBookingStatus = async (partnerId, bookingId, status, cashCollected = false) => {
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

    // Whether the customer already paid (captured via the online gateway before now).
    // If not — regardless of whether the booking was originally booked online or COD —
    // the partner may simply collect cash on the spot instead, so we ask them to confirm
    // rather than blocking completion outright.
    const wasAlreadyPaid = booking.paymentStatus === "paid";

    // A genuine multi-partner split is when this partner only owns specific claimed
    // services and is NOT the booking's primary partner. Otherwise — legacy bookings
    // with no per-service tracking, OR a primary partner whose assignment never got
    // stamped onto the services array (e.g. via the admin "Assign Partner" dropdown,
    // for bookings assigned before that was fixed) — they're responsible for the whole
    // booking and must not get stuck waiting on a per-service claim that never happened.
    const isSplitPartner = hasTracking && !isPrimaryPartner && hasClaimedServices;

    if (!isSplitPartner) {
      if (booking.status !== "in_progress") {
        throw new AppError(`Cannot complete a booking with status "${booking.status}"`, 400);
      }
      const updates = { status: "completed", completedAt: new Date() };
      if (!wasAlreadyPaid) {
        if (!cashCollected) throw new AppError("Please confirm whether you collected the payment before completing this job", 400);
        updates.paymentStatus = "paid";
      }
      if (hasTracking) {
        updates.services = svcs.map(s => s.removed ? s : {
          ...s,
          serviceStatus: "completed",
          assignedPartnerId: s.assignedPartnerId ?? partnerId,
        });
      }
      await booking.update(updates);
      const reloaded = await booking.reload();

      const activeServices = (updates.services ?? svcs).filter(s => !s.removed);
      await settlementsService.createLedgerEntryForCompletion(reloaded, partnerId, activeServices, { collectedAsCash: !wasAlreadyPaid })
        .catch(err => logger.error(`[settlements] ledger entry failed for booking ${booking.id} partner ${partnerId}: ${err.message}`));

      return reloaded;
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
      if (!wasAlreadyPaid) {
        if (!cashCollected) throw new AppError("Please confirm whether you collected the payment before completing this job", 400);
        updates.paymentStatus = "paid";
      }
      updates.status = "completed";
      updates.completedAt = new Date();
    }

    await booking.update(updates);
    const reloaded = await booking.reload();

    if (wasAlreadyPaid) {
      // Money already sits with admin — settle this partner's slice as soon as it's done,
      // without waiting for every other partner on the booking to finish.
      const myServices = updatedSvcs.filter(s => String(s.assignedPartnerId) === String(partnerId) && !s.removed);
      const myDone = myServices.length > 0 && myServices.every(s => s.serviceStatus === "completed");
      if (myDone) {
        await settlementsService.createLedgerEntryForCompletion(reloaded, partnerId, myServices, { collectedAsCash: false })
          .catch(err => logger.error(`[settlements] ledger entry failed for booking ${booking.id} partner ${partnerId}: ${err.message}`));
      }
    } else if (allDone) {
      // Cash — whether COD from the start, or collected on the spot as a fallback — is only
      // confirmed once, at the booking-closing completion: settle every contributing partner
      // together at that point.
      const partnerIds = [...new Set(updatedSvcs.filter(s => s.assignedPartnerId && !s.removed).map(s => String(s.assignedPartnerId)))];
      for (const pid of partnerIds) {
        const theirServices = updatedSvcs.filter(s => String(s.assignedPartnerId) === pid && !s.removed);
        await settlementsService.createLedgerEntryForCompletion(reloaded, pid, theirServices, { collectedAsCash: true })
          .catch(err => logger.error(`[settlements] ledger entry failed for booking ${booking.id} partner ${pid}: ${err.message}`));
      }
    }

    return reloaded;
  }

  throw new AppError(`Invalid status: ${status}`, 400);
};

/**
 * Records that the partner has arrived at the customer's location. This does NOT
 * move the booking to "in_progress" — that only happens once the partner taps
 * "Start Service" after reviewing the checklist. Purely informational + notifies
 * the customer; safe to call more than once (idempotent on arrivedAt).
 */
const markArrived = async (partnerId, bookingId) => {
  const Notification = require("../../../notifications/models/notification.model");
  const { sendPushNotification } = require("../../../../utils/firebaseUtils");

  const booking = await Booking.findByPk(bookingId);
  if (!booking) throw new AppError("Booking not found", 404);

  const svcs = (() => { const s = booking.services; if (Array.isArray(s)) return s; if (typeof s === 'string') { try { return JSON.parse(s); } catch { return []; } } return []; })();
  const isPrimaryPartner = String(booking.partnerId) === String(partnerId);
  const hasClaimedServices = svcs.some(s => String(s.assignedPartnerId) === String(partnerId));
  if (!isPrimaryPartner && !hasClaimedServices) throw new AppError("Booking not found", 404);

  if (!["confirmed", "in_progress"].includes(booking.status)) {
    throw new AppError(`Cannot mark arrival on a booking with status "${booking.status}"`, 400);
  }

  if (!booking.arrivedAt) {
    await booking.update({ arrivedAt: new Date() });
  }
  const reloaded = await booking.reload();

  const user = await User.findByPk(booking.userId, { attributes: ["fcmToken"] });
  const msg = `Your service partner has arrived at your location for booking ${booking.bookingCode}.`;
  if (user?.fcmToken) {
    await sendPushNotification([user.fcmToken], "Partner Arrived", msg,
      { bookingId: String(booking.id), type: "booking" }, "beyomo_booking").catch(() => {});
  }
  await Notification.create({
    userId: booking.userId,
    title: "Partner Arrived",
    body: msg,
    data: { bookingId: String(booking.id) },
    type: "booking",
  });

  return reloaded;
};

const updateDeviceToken = async (partnerId, fcmToken) => {
  const partner = await Partner.findByPk(partnerId);
  if (!partner) throw new AppError("Partner not found", 404);

  const tokens = Array.from(new Set([...(partner.deviceTokens || []), fcmToken]));
  await partner.update({ fcmToken, deviceTokens: tokens });

  // token update logged implicitly

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
        `JSON_CONTAINS(JSON_EXTRACT(COALESCE(\`Booking\`.\`services\`, '[]'), '$[*].assignedPartnerId'), '${pidInt}')`
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

  // Live sum for every period (including "all") using the same per-booking formula as
  // the dashboard's computeTotalEarned, so the two screens can never disagree.
  const totalEarnedForPeriod = round2(
    completedBookings.reduce((sum, b) => sum + partnerEarningForBooking(b, partnerId), 0),
  );
  const totalJobs = completedBookings.length;

  // All-time total computed live, exactly like the dashboard's computeTotalEarned.
  // `partner.totalEarnings` is only ever incremented by the settlement ledger job, so it
  // reads 0 for any partner whose completed jobs were never settled — which is what made
  // the Earnings header fall back to ₹0 while a period tab was still loading.
  const allTimeEarned = period === "all"
    ? totalEarnedForPeriod
    : await computeTotalEarned(partnerId);

  const recentEarnings = completedBookings.slice(0, 10).map((b) => {
    const myEarning = partnerEarningForBooking(b, partnerId);
    const svcs = parseServiceItems(b.services);
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
    stats: { jobs: totalJobs, earned: totalEarnedForPeriod },
    averageRating: partner?.ratingsAverage ?? null,
    totalReviews: partner?.ratingsCount ?? 0,
    totalEarnings: allTimeEarned,
    settledEarnings: parseFloat(partner?.totalEarnings ?? 0),
    recentEarnings,
  };
};

const getAvailableBookings = async (partnerId) => {
  const partner = await Partner.findByPk(partnerId, { attributes: ['locationCity'] });
  // Exclude online-payment bookings whose payment hasn't actually gone through yet
  // (e.g. the customer cancelled Razorpay checkout) — those stay "pending" too, but
  // a partner must never be offered a job that hasn't been paid for.
  const where = {
    status: { [Op.in]: ['pending', 'confirmed'] },
    [Op.or]: [{ paymentMode: 'cod' }, { paymentStatus: 'paid' }],
  };
  if (partner?.locationCity) where.addressCity = partner.locationCity;

  const bookings = await Booking.findAll({
    where,
    order: [['createdAt', 'DESC']],
    limit: 60,
    include: [
      { model: Service, as: 'service', attributes: ['name', 'image', 'duration', 'basePrice'] },
      { model: User, as: 'user', attributes: ['name', 'phone'] },
      { model: ServicePackage, as: 'package', attributes: ['id', 'title', 'price', 'image'] },
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
      where: {
        id: bookingId,
        status: { [Op.in]: ['pending', 'confirmed', 'in_progress'] },
        [Op.or]: [{ paymentMode: 'cod' }, { paymentStatus: 'paid' }],
      },
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

  const svcs = (() => { const s = svcsResult.services; if (Array.isArray(s)) return s; if (typeof s === 'string') { try { return JSON.parse(s); } catch { return []; } } return []; })();
  const hasTracking = svcs.length > 0 && svcs[0].serviceStatus !== undefined;

  if (!hasTracking) {
    // Old format: simple full accept
    const Notification = require('../../../notifications/models/notification.model');
    const { sendPushNotification } = require('../../../../utils/firebaseUtils');
    const [updated] = await Booking.update(
      { partnerId, status: 'confirmed' },
      {
        where: {
          id: bookingId,
          partnerId: null,
          status: 'pending',
          [Op.or]: [{ paymentMode: 'cod' }, { paymentStatus: 'paid' }],
        },
      }
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
        { bookingId: String(booking.id), type: 'booking' }, 'beyomo_booking');
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

/**
 * Applies a partner's service edits to a booking immediately — no customer approval.
 * `serviceItems` (to add) can each be either a catalog reference `{id, qty}` or a
 * free-form add-on `{isAddOn: true, name, price, qty}`. `removeIndices` soft-removes
 * existing entries; `updateQty` changes quantities on existing (non-removed) entries.
 */
const addExtraServices = async (partnerId, bookingId, { services: serviceItems = [], removeIndices = [], updateQty = [] } = {}) => {
  const Notification = require('../../../notifications/models/notification.model');
  const { sendPushNotification } = require('../../../../utils/firebaseUtils');

  const booking = await Booking.findOne({ where: { id: bookingId, status: ['confirmed', 'in_progress'] } });
  if (!booking) throw new AppError('Booking not found or not in an active state', 404);

  // Verify this partner has a stake in the booking
  const svcs = (() => { const s = booking.services; if (Array.isArray(s)) return s; if (typeof s === 'string') { try { return JSON.parse(s); } catch { return []; } } return []; })();
  const isAuthorised = String(booking.partnerId) === String(partnerId)
    || svcs.some(s => String(s.assignedPartnerId) === String(partnerId));
  if (!isAuthorised) throw new AppError('Booking not found or not currently in progress', 404);

  let updatedServices = [...svcs];

  // Qty changes on existing (non-removed) entries
  updateQty.forEach(({ index, qty }) => {
    if (index >= 0 && index < updatedServices.length && !updatedServices[index].removed) {
      updatedServices[index] = { ...updatedServices[index], qty };
    }
  });

  // Soft-remove by index
  removeIndices.forEach(idx => {
    if (idx >= 0 && idx < updatedServices.length && !updatedServices[idx].removed) {
      updatedServices[idx] = { ...updatedServices[idx], removed: true };
    }
  });

  // Fetch partner name to stamp on each new entry (needed for earnings tracking)
  const partnerRecord = await Partner.findByPk(partnerId, { attributes: ['name'] });
  const partnerName = partnerRecord?.name ?? null;

  const catalogItems = serviceItems.filter(s => !s.isAddOn);
  const addOnItems = serviceItems.filter(s => s.isAddOn);

  let newCatalogEntries = [];
  if (catalogItems.length > 0) {
    const serviceIds = catalogItems.map(s => parseInt(s.id));
    const foundServices = await Service.findAll({
      where: { id: serviceIds, isActive: true },
      include: [{ model: ServiceCategory, as: 'category', attributes: ['adminPercent', 'partnerPercent', 'gstPercent'] }],
    });
    if (foundServices.length !== serviceIds.length) {
      throw new AppError('One or more services not found or unavailable', 404);
    }
    const serviceMap = Object.fromEntries(foundServices.map(s => [s.id, s]));
    const priceOf = await cityPriceResolver(serviceIds, booking.cityId);
    newCatalogEntries = catalogItems.map(item => {
      const svc = serviceMap[parseInt(item.id)];
      return {
        serviceId: svc.id,
        name: svc.name,
        price: priceOf(svc),
        qty: item.qty || 1,
        duration: svc.duration || null,
        image: svc.image || null,
        addedByPartner: true,
        // Edge case 6: stamp ownership so earnings and UI filter work correctly per partner
        serviceStatus: 'claimed',
        assignedPartnerId: parseInt(partnerId),
        assignedPartnerName: partnerName,
        adminPercent: svc.category ? parseFloat(svc.category.adminPercent) : DEFAULT_ADMIN_PERCENT,
        partnerPercent: svc.category ? parseFloat(svc.category.partnerPercent) : DEFAULT_PARTNER_PERCENT,
        gstPercent: svc.category ? parseFloat(svc.category.gstPercent) : DEFAULT_GST_PERCENT,
      };
    });
  }

  const newAddOnEntries = addOnItems.map(item => ({
    name: item.name,
    price: parseFloat(item.price) || 0,
    qty: item.qty || 1,
    isAddOn: true,
    addedByPartner: true,
    serviceStatus: 'claimed',
    assignedPartnerId: parseInt(partnerId),
    assignedPartnerName: partnerName,
    adminPercent: DEFAULT_ADMIN_PERCENT,
    partnerPercent: DEFAULT_PARTNER_PERCENT,
    gstPercent: DEFAULT_GST_PERCENT,
  }));

  updatedServices = [...updatedServices, ...newCatalogEntries, ...newAddOnEntries];

  const activeServices = updatedServices.filter(s => !s.removed);
  const newBaseAmount = activeServices.reduce((sum, s) => sum + (parseFloat(s.price) || 0) * (s.qty || 1), 0);
  const couponDiscount = parseFloat(booking.couponDiscountAmount || 0);
  const taxableAmount = newBaseAmount - couponDiscount;
  const pkg = booking.packageId ? await ServicePackage.findByPk(booking.packageId) : null;
  const { partnerPercent, gstPercent } = await resolveRatesForBooking({ serviceItems: activeServices, package: pkg });
  const tax = parseFloat((taxableAmount * gstPercent / 100).toFixed(2));
  const total = parseFloat((taxableAmount + tax).toFixed(2));
  const partnerEarning = parseFloat((taxableAmount * partnerPercent / 100).toFixed(2));

  await booking.update({
    services: updatedServices,
    baseAmount: newBaseAmount,
    taxAmount: tax,
    totalAmount: total,
    partnerEarning,
  });

  const user = await User.findByPk(booking.userId);
  const addedNames = [...newCatalogEntries, ...newAddOnEntries].map(s => s.name).join(', ');
  const changeMsg = addedNames
    ? `Your partner updated booking ${booking.bookingCode}. Added: ${addedNames}. New total: ₹${total}`
    : `Your partner updated services on booking ${booking.bookingCode}. New total: ₹${total}`;
  if (user?.fcmToken) {
    await sendPushNotification([user.fcmToken], 'Booking Updated', changeMsg,
      { bookingId: String(booking.id), type: 'booking' }).catch(() => {});
  }
  await Notification.create({
    userId: booking.userId,
    title: 'Booking Updated',
    body: changeMsg,
    data: { bookingId: String(booking.id) },
    type: 'booking',
  });

  return booking.reload();
};

// Checks the partner either owns the booking outright or has a claimed service on it —
// same authorisation rule addExtraServices uses.
const assertPartnerAuthorised = (booking, partnerId) => {
  const svcs = (() => { const s = booking.services; if (Array.isArray(s)) return s; if (typeof s === 'string') { try { return JSON.parse(s); } catch { return []; } } return []; })();
  const isAuthorised = String(booking.partnerId) === String(partnerId)
    || svcs.some(s => String(s.assignedPartnerId) === String(partnerId));
  if (!isAuthorised) throw new AppError('Booking not found or not currently in progress', 404);
};

/**
 * Lets a partner add a package/combo to a booking mid-job — same array-surgery +
 * repricing logic the customer/admin add-package actions use (buildPackageAddition),
 * so multi-package pricing stays consistent across every surface. The package's own
 * services are stamped as already claimed by this partner (they're the one adding and
 * executing it), unlike the customer/admin flow which leaves them unassigned for a
 * partner to pick up later.
 */
const addBookingPackage = async (partnerId, bookingId, packageId, qty, serviceItems) => {
  const Notification = require('../../../notifications/models/notification.model');
  const { sendPushNotification } = require('../../../../utils/firebaseUtils');
  const { buildPackageAddition } = require('../../../bookings/services/v1/bookings.service');

  const booking = await Booking.findOne({ where: { id: bookingId, status: ['confirmed', 'in_progress'] } });
  if (!booking) throw new AppError('Booking not found or not in an active state', 404);
  assertPartnerAuthorised(booking, partnerId);

  const partnerRecord = await Partner.findByPk(partnerId, { attributes: ['name'] });
  const partnerName = partnerRecord?.name ?? null;

  const updates = await buildPackageAddition(booking, packageId, qty, serviceItems);
  const targetPackageId = parseInt(packageId);
  updates.services = updates.services.map(s =>
    s.addedByPackage && s.packageId === targetPackageId && s.serviceStatus === 'unassigned'
      ? { ...s, serviceStatus: 'claimed', assignedPartnerId: parseInt(partnerId), assignedPartnerName: partnerName }
      : s
  );

  await booking.update(updates);

  const user = await User.findByPk(booking.userId);
  const msg = `Your partner added a package to booking ${booking.bookingCode}. New total: ₹${updates.totalAmount}.`;
  if (user?.fcmToken) {
    await sendPushNotification([user.fcmToken], 'Booking Updated', msg,
      { bookingId: String(booking.id), type: 'booking' }).catch(() => {});
  }
  await Notification.create({
    userId: booking.userId, title: 'Booking Updated', body: msg,
    data: { bookingId: String(booking.id) }, type: 'booking',
  });

  return booking.reload();
};

/**
 * Lets a partner remove a package/combo from a booking mid-job — reuses the same
 * buildPackageRemoval logic the customer/admin remove-package actions use.
 */
const removeBookingPackage = async (partnerId, bookingId, packageId) => {
  const Notification = require('../../../notifications/models/notification.model');
  const { sendPushNotification } = require('../../../../utils/firebaseUtils');
  const { buildPackageRemoval } = require('../../../bookings/services/v1/bookings.service');

  const booking = await Booking.findOne({ where: { id: bookingId, status: ['confirmed', 'in_progress'] } });
  if (!booking) throw new AppError('Booking not found or not in an active state', 404);
  assertPartnerAuthorised(booking, partnerId);

  const updates = await buildPackageRemoval(booking, packageId);
  await booking.update(updates);

  const user = await User.findByPk(booking.userId);
  const msg = `Your partner removed a package from booking ${booking.bookingCode}. New total: ₹${updates.totalAmount}.`;
  if (user?.fcmToken) {
    await sendPushNotification([user.fcmToken], 'Booking Updated', msg,
      { bookingId: String(booking.id), type: 'booking' }).catch(() => {});
  }
  await Notification.create({
    userId: booking.userId, title: 'Booking Updated', body: msg,
    data: { bookingId: String(booking.id) }, type: 'booking',
  });

  return booking.reload();
};

module.exports = {
  getProfile, updateProfile, updateDocuments, deleteAccount,
  getDashboard, getBookings, getBookingById, getAvailableBookings, acceptBooking, claimServices, updateBookingStatus,
  markArrived, updateDeviceToken, getEarnings, addExtraServices, addBookingPackage, removeBookingPackage,
};
