const { Op } = require("sequelize");
const { sequelize } = require("../../../../utils/dbconnect");
const Banner = require("../../../banners/models/banner.model");
const ServiceZone = require("../../../zones/models/zone.model");
const City = require("../../../cities/models/city.model");
const AdminUser = require("../../models/adminUser.model");
const User = require("../../../users/models/user.model");
const UserAddress = require("../../../users/models/userAddress.model");
const Partner = require("../../../partners/models/partner.model");
const { withPresence } = require("../../../../utils/partnerPresence");
const ServiceCategory = require("../../../services/models/serviceCategory.model");
const ServiceSubcategory = require("../../../services/models/serviceSubcategory.model");
const Service = require("../../../services/models/service.model");
const ServiceCityMap = require("../../../services/models/service_city_map.model");
const { cityPriceResolver } = require("../../../services/services/v1/cityPricing");
const Booking = require("../../../bookings/models/booking.model");
const Payment = require("../../../payments/models/payment.model");
const Coupon = require("../../../coupons/models/coupon.model");
const Offer = require("../../../offers/models/offer.model");
const ServicePackage = require("../../../packages/models/package.model");
const ReferralProgram = require("../../../coupons/models/referralProgram.model");
const Review = require("../../../reviews/models/review.model");
const Notification = require("../../../notifications/models/notification.model");
const AppFeedback = require("../../../feedback/models/feedback.model");
const { signToken } = require("../../../../utils/jwtUtils");
const { sendPushNotification, PARTNER_NEW_BOOKING_CHANNEL } = require("../../../../utils/firebaseUtils");
const { haversineKm } = require("../../../../utils/geoUtils");
const {
  resolveRatesForBooking,
  resolveRatesForMultiPackageBooking,
  computeWeightedCategoryRates,
  DEFAULT_ADMIN_PERCENT,
  DEFAULT_PARTNER_PERCENT,
  DEFAULT_GST_PERCENT,
  normalizeSplitInput,
} = require("../../../../utils/revenueSplit");
const AppError = require("../../../../utils/errorHandlers/appError");

// ==================== AUTH ====================

const adminLogin = async (email, password) => {
  const admin = await AdminUser.findOne({ where: { email, status: "active" } });
  if (!admin) throw new AppError("Invalid email or password", 401);

  const isMatch = await admin.comparePassword(password);
  if (!isMatch) throw new AppError("Invalid email or password", 401);

  await admin.update({ lastLogin: new Date() });

  const token = signToken({ userId: admin.id, userType: "admin", role: admin.role, email: admin.email, allowedZones: admin.allowedZones || null });
  const adminData = admin.get({ plain: true });
  delete adminData.password;
  if (!adminData.customPermissions?.length) adminData.customPermissions = null;
  return { token, admin: adminData };
};

// ==================== USERS ====================

const cityIdsFilter = (cityIds) => {
  if (!cityIds?.length) return {};
  return { cityId: cityIds.length === 1 ? cityIds[0] : { [Op.in]: cityIds } };
};

const listUsers = async ({ search, status, cityIds, page = 1, limit = 10 }) => {
  const offset = (page - 1) * limit;
  const where = { ...cityIdsFilter(cityIds) };
  if (status) where.status = status;
  if (search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { phone: { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } },
    ];
  }
  const { count: total, rows: data } = await User.findAndCountAll({
    where, order: [["createdAt", "DESC"]], offset, limit,
  });
  return { data, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};

const getUserById = async (userId) => {
  const user = await User.findByPk(userId, {
    include: [{ model: UserAddress, as: "addresses" }],
  });
  if (!user) throw new AppError("User not found", 404);
  return user;
};

const updateUserStatus = async (userId, status) => {
  await User.update({ status }, { where: { id: userId } });
  const user = await User.findByPk(userId);
  if (!user) throw new AppError("User not found", 404);
  return user;
};

const deleteUser = async (userId) => {
  const [updated] = await User.update({ status: "deleted" }, { where: { id: userId } });
  if (!updated) throw new AppError("User not found", 404);
  return { message: "User deleted" };
};

const createUser = async (data) => {
  const existing = await User.findOne({ where: { phone: data.phone } });
  if (existing) throw new AppError("A user with this phone number already exists", 400);
  return User.create({ name: data.name, phone: data.phone, email: data.email || null, status: "active" });
};

// ==================== PARTNERS ====================

const listPartners = async ({ search, status, source, cityIds, page = 1, limit = 10 }) => {
  const offset = (page - 1) * limit;
  const where = { ...cityIdsFilter(cityIds) };
  if (status) where.status = status;
  if (source) where.source = source;
  if (search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { phone: { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } },
    ];
  }
  const { count: total, rows } = await Partner.findAndCountAll({
    where, order: [["createdAt", "DESC"]], offset, limit,
  });
  // withPresence downgrades a stale isOnline to false, so the dashboard never shows a
  // partner as available when we haven't heard from their app in ONLINE_TIMEOUT_MINUTES.
  const data = rows.map(withPresence);
  return { data, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};

const getPartnerById = async (partnerId) => {
  const partner = await Partner.findByPk(partnerId);
  if (!partner) throw new AppError("Partner not found", 404);
  return withPresence(partner);
};

/**
 * Turn a typed city name into the matching cities.id.
 *
 * partners.cityId is what the available-bookings feed matches on, but the dashboard's
 * partner form only ever wrote the free-text locationCity — so changing a partner's
 * city updated the label and left cityId pointing at the city they used to be in, and
 * they kept being offered the old city's jobs. Both are written together now.
 *
 * Exact name first, substring second, mirroring how a booking's address resolves its
 * city, so the two sides can't disagree on what "Rajahmundry" means.
 */
const resolveCityIdByName = async (name) => {
  const typed = (name ?? "").trim();
  if (!typed) return null;
  const city =
    (await City.findOne({ where: { name: typed } })) ||
    (await City.findOne({ where: { name: { [Op.like]: `%${typed}%` } } }));
  return city ? city.id : null;
};

const createPartner = async (data) => {
  const existing = await Partner.findOne({ where: { phone: data.phone } });
  if (existing) throw new AppError("A partner with this phone number already exists", 400);
  return Partner.create({
    name: data.name,
    phone: data.phone,
    email: data.email || null,
    locationCity: data.city || null,
    cityId: await resolveCityIdByName(data.city),
    experience: parseInt(data.experience) || 0,
    gender: data.gender || null,
    professions: data.professions || [],
    serviceCategoryIds: data.categories || [],
    profilePicture: data.profilePicture || null,
    aadharUrl: data.aadharUrl || null,
    agreementUrl: data.agreementUrl || null,
    bankAccountNo: data.bankAccountNo || null,
    bankIfsc: data.bankIfsc || null,
    bankName: data.bankName || null,
    bankHolderName: data.bankHolderName || null,
    status: "pending",
  });
};

const updatePartner = async (partnerId, data) => {
  const partner = await Partner.findByPk(partnerId);
  if (!partner) throw new AppError("Partner not found", 404);

  if (data.phone && data.phone !== partner.phone) {
    const existing = await Partner.findOne({ where: { phone: data.phone } });
    if (existing) throw new AppError("A partner with this phone number already exists", 400);
  }

  const updates = {};
  if (data.name !== undefined) updates.name = data.name;
  if (data.phone !== undefined) updates.phone = data.phone;
  if (data.email !== undefined) updates.email = data.email || null;
  if (data.city !== undefined) {
    updates.locationCity = data.city || null;
    // Kept in lockstep — a stale cityId is what made a partner moved to Vijayawada
    // carry on seeing Rajahmundry jobs.
    updates.cityId = await resolveCityIdByName(data.city);
  }
  if (data.experience !== undefined) updates.experience = parseInt(data.experience) || 0;
  if (data.gender !== undefined) updates.gender = data.gender || null;
  if (data.professions !== undefined) updates.professions = data.professions || [];
  if (data.categories !== undefined) updates.serviceCategoryIds = data.categories || [];
  if (data.profilePicture !== undefined) updates.profilePicture = data.profilePicture || null;
  if (data.aadharUrl !== undefined) updates.aadharUrl = data.aadharUrl || null;
  if (data.agreementUrl !== undefined) updates.agreementUrl = data.agreementUrl || null;
  if (data.bankAccountNo !== undefined) updates.bankAccountNo = data.bankAccountNo || null;
  if (data.bankIfsc !== undefined) updates.bankIfsc = data.bankIfsc || null;
  if (data.bankName !== undefined) updates.bankName = data.bankName || null;
  if (data.bankHolderName !== undefined) updates.bankHolderName = data.bankHolderName || null;

  await partner.update(updates);
  return partner;
};

const updatePartnerStatus = async (partnerId, status) => {
  const validStatuses = ["pending", "approved", "suspended", "rejected"];
  if (!validStatuses.includes(status)) throw new AppError("Invalid status", 400);

  await Partner.update({ status }, { where: { id: partnerId } });
  const partner = await Partner.findByPk(partnerId);
  if (!partner) throw new AppError("Partner not found", 404);

  if (partner.fcmToken) {
    const messages = {
      approved: "Congratulations! Your partner account has been approved.",
      suspended: "Your partner account has been suspended. Please contact support.",
      rejected: "Your partner application has been rejected. Please contact support.",
    };
    if (messages[status]) {
      await sendPushNotification([partner.fcmToken], "Account Status Update", messages[status], { type: "system" });
    }
  }
  return partner;
};

// ==================== SERVICE CATEGORIES ====================

/**
 * Categories for the dashboard, optionally narrowed to one city.
 *
 * The dashboard has always sent its selected cityId here, but this ignored it — so the
 * city switcher filtered the service list while the category list stayed global, and a
 * Vijayawada-only category still showed while viewing Rajahmundry.
 *
 * Same rule the public endpoint uses: an empty cityIds means "all cities". Note there's
 * no isActive filter — unlike the app, the dashboard must still see hidden categories.
 */
const listCategories = async (query = {}) => {
  const all = await ServiceCategory.findAll({ order: [["sortOrder", "ASC"], ["name", "ASC"]] });
  if (!query.cityId) return all;
  const cid = Number(query.cityId);
  return all.filter((c) => {
    const ids = c.cityIds ?? [];
    return ids.length === 0 || ids.map(Number).includes(cid);
  });
};

const createCategory = async (data) => {
  data = normalizeSplitInput(data);
  try {
    if (data.sortOrder == null) {
      const last = await ServiceCategory.findOne({ order: [["sortOrder", "DESC"]] });
      data = { ...data, sortOrder: last ? last.sortOrder + 1 : 0 };
    }
    return await ServiceCategory.create(data);
  } catch (e) {
    if (e.name === "SequelizeUniqueConstraintError") {
      throw new AppError(`A category named "${data.name}" already exists`, 400);
    }
    throw e;
  }
};

// Bulk-persist a new category display order. `orderedIds` is the full list of
// category IDs in the order they should appear; index becomes sortOrder.
const reorderCategories = async (orderedIds) => {
  return sequelize.transaction(async (t) => {
    await Promise.all(
      orderedIds.map((id, index) =>
        ServiceCategory.update({ sortOrder: index }, { where: { id }, transaction: t })
      )
    );
  });
};

const updateCategory = async (id, data) => {
  data = normalizeSplitInput(data);
  try {
    await ServiceCategory.update(data, { where: { id } });
  } catch (e) {
    if (e.name === "SequelizeUniqueConstraintError") {
      throw new AppError(`A category named "${data.name}" already exists`, 400);
    }
    throw e;
  }
  const category = await ServiceCategory.findByPk(id);
  if (!category) throw new AppError("Category not found", 404);
  return category;
};

const deleteCategory = async (id) => {
  const deleted = await ServiceCategory.destroy({ where: { id } });
  if (!deleted) throw new AppError("Category not found", 404);
  return { message: "Category deleted" };
};

// ==================== SERVICE SUBCATEGORIES ====================
// Optional second level under a category (Waxing -> Honey / Rica). Services point at
// one via the nullable services.subcategoryId.

const listSubcategories = async (query = {}) => {
  const where = {};
  if (query.categoryId) where.categoryId = query.categoryId;
  return ServiceSubcategory.findAll({
    where,
    order: [["categoryId", "ASC"], ["sortOrder", "ASC"], ["name", "ASC"]],
    include: [{ model: ServiceCategory, as: "category", attributes: ["name"] }],
  });
};

const createSubcategory = async (data) => {
  try {
    if (data.sortOrder == null) {
      const last = await ServiceSubcategory.findOne({
        where: { categoryId: data.categoryId },
        order: [["sortOrder", "DESC"]],
      });
      data = { ...data, sortOrder: last ? last.sortOrder + 1 : 0 };
    }
    return await ServiceSubcategory.create(data);
  } catch (e) {
    if (e.name === "SequelizeUniqueConstraintError") {
      throw new AppError(`A subcategory named "${data.name}" already exists in this category`, 400);
    }
    throw e;
  }
};

const updateSubcategory = async (id, data) => {
  try {
    await ServiceSubcategory.update(data, { where: { id } });
  } catch (e) {
    if (e.name === "SequelizeUniqueConstraintError") {
      throw new AppError(`A subcategory named "${data.name}" already exists in this category`, 400);
    }
    throw e;
  }
  const subcategory = await ServiceSubcategory.findByPk(id);
  if (!subcategory) throw new AppError("Subcategory not found", 404);
  return subcategory;
};

const deleteSubcategory = async (id) => {
  const sub = await ServiceSubcategory.findByPk(id);
  if (!sub) throw new AppError("Subcategory not found", 404);
  // Detach rather than block: the services themselves are untouched and simply fall
  // back to listing under their category, which is how they behaved before.
  return sequelize.transaction(async (t) => {
    await Service.update({ subcategoryId: null }, { where: { subcategoryId: id }, transaction: t });
    await ServiceSubcategory.destroy({ where: { id }, transaction: t });
    return { message: "Subcategory deleted" };
  });
};

// ==================== SERVICES ====================

// Replace a service's city mappings atomically inside an existing transaction.
// mappings: array of { cityId, isActive, customPrice } — preserves per-city pause
// state AND the per-city price override. Dropping customPrice here would wipe every
// city's rate card on any unrelated edit to the service, since this destroys and
// recreates the rows.
const syncCityMappings = async (serviceId, mappings = [], t) => {
  // Carry forward existing overrides for any mapping the caller sent without an
  // explicit customPrice (e.g. an older client, or a payload built from cityIds only).
  const existing = await ServiceCityMap.findAll({
    where: { serviceId },
    attributes: ["cityId", "customPrice"],
    transaction: t,
  });
  const priorPrice = new Map(existing.map((m) => [Number(m.cityId), m.customPrice]));

  await ServiceCityMap.destroy({ where: { serviceId }, transaction: t });
  if (mappings.length > 0) {
    await ServiceCityMap.bulkCreate(
      mappings.map(({ cityId, isActive = true, customPrice }) => ({
        serviceId,
        cityId,
        isActive,
        customPrice: customPrice === undefined
          ? (priorPrice.get(Number(cityId)) ?? null)
          : (customPrice === null || customPrice === "" ? null : customPrice),
      })),
      { transaction: t, ignoreDuplicates: true }
    );
  }
};

// Attach computed `cityIds` (active city IDs) to a plain service object.
// `cityMappings` is normalised so the dashboard always gets numeric cityId and a
// numeric-or-null customPrice, and `basePrice` is resolved to the requested city's
// effective price when one is asked for.
const attachCityIds = (svc, cityId = null) => {
  const plain = svc.get ? svc.get({ plain: true }) : { ...svc };
  const mappings = (plain.cityMappings ?? []).map((m) => ({
    ...m,
    cityId: Number(m.cityId),
    isActive: m.isActive ?? true,
    customPrice: m.customPrice == null ? null : parseFloat(m.customPrice),
  }));

  plain.cityMappings = mappings;
  plain.cityIds = mappings.filter((m) => m.isActive).map((m) => m.cityId);
  // Keep the global figure available so the edit form can show "base" vs "this city"
  plain.baseServicePrice = parseFloat(plain.basePrice ?? 0);

  if (cityId) {
    const mapping = mappings.find((m) => m.cityId === Number(cityId) && m.isActive);
    if (mapping?.customPrice != null) plain.basePrice = mapping.customPrice;
  }
  return plain;
};

const listServices = async ({ categoryId, search, cityId, page = 1, limit = 20 }) => {
  const offset = (page - 1) * limit;
  const where = {};
  if (categoryId) where.categoryId = categoryId;
  if (search) where.name = { [Op.like]: `%${search}%` };

  const { count: total, rows } = await Service.findAndCountAll({
    where,
    order: [["sortOrder", "ASC"], ["name", "ASC"]],
    offset,
    limit,
    include: [
      { model: ServiceCategory, as: "category", attributes: ["name", "adminPercent", "partnerPercent", "gstPercent"] },
      { model: ServiceSubcategory, as: "subcategory", attributes: ["id", "name"], required: false },
      { model: ServiceCityMap, as: "cityMappings", required: false },
    ],
  });

  let data = rows.map((r) => attachCityIds(r, cityId));

  // Client-side city filter: global (no mappings) or has active mapping for requested city
  if (cityId) {
    const cid = Number(cityId);
    data = data.filter((s) => s.cityIds.length === 0 || s.cityIds.includes(cid));
  }

  return { data, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};

// The dashboard's subcategory <select> posts "" for "None". Left as-is that would be
// written to an INT column, so normalise it to a real NULL — which is also what
// "this service isn't in any subcategory" means everywhere else.
const normalizeSubcategoryId = (serviceData) => {
  if (!("subcategoryId" in serviceData)) return serviceData;
  const raw = serviceData.subcategoryId;
  return { ...serviceData, subcategoryId: raw === "" || raw == null ? null : parseInt(raw) };
};

const createService = async (data) => {
  const { cityIds, cityMappings, ...rest } = data;
  const serviceData = normalizeSubcategoryId(rest);
  // Normalise to [{ cityId, isActive }] regardless of which shape was sent
  const mappings = cityMappings ?? (cityIds ?? []).map((cid) => ({ cityId: cid, isActive: true }));
  return sequelize.transaction(async (t) => {
    if (serviceData.sortOrder == null) {
      const last = await Service.findOne({
        where: { categoryId: serviceData.categoryId },
        order: [["sortOrder", "DESC"]],
        transaction: t,
      });
      serviceData.sortOrder = last ? last.sortOrder + 1 : 0;
    }
    const service = await Service.create(serviceData, { transaction: t });
    await syncCityMappings(service.id, mappings, t);
    return service;
  });
};

// Bulk-persist a new service display order within a single category.
// `orderedIds` is the full list of service IDs (within that category) in the
// order they should appear; index becomes sortOrder.
const reorderServices = async (categoryId, orderedIds) => {
  return sequelize.transaction(async (t) => {
    await Promise.all(
      orderedIds.map((id, index) =>
        Service.update({ sortOrder: index }, { where: { id, categoryId }, transaction: t })
      )
    );
  });
};

const updateService = async (id, data) => {
  const { cityIds, cityMappings, ...rest } = data;
  const serviceData = normalizeSubcategoryId(rest);
  const mappings = cityMappings ?? (cityIds ?? []).map((cid) => ({ cityId: cid, isActive: true }));
  return sequelize.transaction(async (t) => {
    await Service.update(serviceData, { where: { id }, transaction: t });
    await syncCityMappings(id, mappings, t);
    const service = await Service.findByPk(id, {
      include: [{ model: ServiceCityMap, as: "cityMappings" }],
      transaction: t,
    });
    if (!service) throw new AppError("Service not found", 404);
    return attachCityIds(service);
  });
};

const deleteService = async (id) => {
  return sequelize.transaction(async (t) => {
    await ServiceCityMap.destroy({ where: { serviceId: id }, transaction: t });
    const deleted = await Service.destroy({ where: { id }, transaction: t });
    if (!deleted) throw new AppError("Service not found", 404);
    return { message: "Service deleted" };
  });
};

// Toggle a single city's active flag (and optionally its price) without touching the
// rest of the service. Written as find-then-update rather than upsert so that an
// isActive-only call cannot clobber the city's customPrice back to NULL.
const toggleServiceCityStatus = async (serviceId, cityId, isActive, customPrice = undefined) => {
  const sid = Number(serviceId);
  const cid = Number(cityId);
  const patch = {};
  if (isActive !== undefined) patch.isActive = isActive;
  if (customPrice !== undefined) {
    patch.customPrice = customPrice === null || customPrice === "" ? null : customPrice;
  }

  const existing = await ServiceCityMap.findOne({ where: { serviceId: sid, cityId: cid } });
  if (existing) {
    await existing.update(patch);
  } else {
    // Admin added the city locally but hasn't saved the service yet.
    await ServiceCityMap.create({ serviceId: sid, cityId: cid, isActive: isActive ?? true, ...patch });
  }

  const row = await ServiceCityMap.findOne({ where: { serviceId: sid, cityId: cid } });
  return {
    serviceId: sid,
    cityId: cid,
    isActive: row?.isActive ?? isActive ?? true,
    customPrice: row?.customPrice == null ? null : parseFloat(row.customPrice),
  };
};

// ==================== BOOKINGS ====================

// Admin/support-created booking — e.g. a customer calls in asking for a one-time
// service. Line items can be real catalog services ({id, qty}) and/or free-form
// add-ons ({isAddOn:true, name, price, qty}), same shape editBookingServices already
// accepts, so a purely one-off request never needs a permanent catalog entry.
const createBookingForCustomer = async (adminId, data) => {
  const { userId, services: serviceItems = [], partnerId, address, scheduledAt, paymentMode, notes } = data;

  const user = await User.findByPk(userId);
  if (!user) throw new AppError("User not found", 404);

  if (partnerId) {
    const partner = await Partner.findOne({ where: { id: partnerId, status: "approved" } });
    if (!partner) throw new AppError("Partner not found or not available", 404);
  }

  const catalogItems = serviceItems.filter(s => !s.isAddOn);
  const addOnItems = serviceItems.filter(s => s.isAddOn);

  // Resolve the city before pricing — it selects the rate card (see cityPriceResolver).
  let cityId = null;
  if (address.city) {
    const city = await City.findOne({ where: { name: { [Op.like]: `%${address.city.trim()}%` }, isActive: true } });
    cityId = city ? city.id : null;
    if (city && city.lat && city.lng && address.lat && address.lng) {
      const dist = haversineKm(address.lat, address.lng, city.lat, city.lng);
      const limit = city.radius ?? 30;
      if (dist > limit) {
        throw new AppError(`Address is outside the ${city.name} service area (${Math.round(dist)} km from city center)`, 400);
      }
    }
  }

  let enrichedServices = [];
  if (catalogItems.length > 0) {
    const serviceIds = [...new Set(catalogItems.map(s => parseInt(s.id)))];
    const foundServices = await Service.findAll({ where: { id: serviceIds, isActive: true } });
    if (foundServices.length !== serviceIds.length) throw new AppError("One or more services not found or unavailable", 404);

    const serviceMap = Object.fromEntries(foundServices.map(s => [s.id, s]));
    const priceOf = await cityPriceResolver(serviceIds, cityId);
    enrichedServices = catalogItems.map(item => {
      const svc = serviceMap[parseInt(item.id)];
      return {
        serviceId: svc.id, name: svc.name, price: priceOf(svc), qty: item.qty || 1,
        duration: svc.duration || null, image: svc.image || null,
        serviceStatus: "unassigned", assignedPartnerId: null, assignedPartnerName: null,
        addedByAdmin: true,
      };
    });
  }

  if (addOnItems.length > 0) {
    enrichedServices = [...enrichedServices, ...addOnItems.map(item => ({
      name: item.name, price: parseFloat(item.price) || 0, qty: item.qty || 1,
      isAddOn: true, addedByAdmin: true,
      serviceStatus: "unassigned", assignedPartnerId: null, assignedPartnerName: null,
    }))];
  }

  const baseAmount = enrichedServices.reduce((sum, s) => sum + s.price * s.qty, 0);
  const { partnerPercent, gstPercent } = await resolveRatesForBooking({ serviceItems: enrichedServices, package: null });
  const tax = parseFloat((baseAmount * gstPercent / 100).toFixed(2));
  const total = parseFloat((baseAmount + tax).toFixed(2));
  const partnerEarning = parseFloat((baseAmount * partnerPercent / 100).toFixed(2));

  // Backward-compat single serviceId column — first catalog item if any, else null
  // (a booking made up entirely of custom add-ons has no real catalog service).
  const primaryServiceId = enrichedServices.find(s => s.serviceId)?.serviceId ?? null;
  const primaryServiceName = enrichedServices.length === 1 ? enrichedServices[0].name : `${enrichedServices.length} services`;

  const booking = await Booking.create({
    userId,
    serviceId: primaryServiceId,
    services: enrichedServices,
    partnerId: partnerId || null,
    addressLabel: address.label || "Home",
    addressLine1: address.line1,
    addressLine2: address.line2 || null,
    addressCity: address.city || "",
    addressState: address.state || "",
    addressPincode: address.pincode || "",
    addressLat: address.lat || null,
    addressLng: address.lng || null,
    scheduledAt: new Date(scheduledAt),
    status: "pending",
    paymentMode: paymentMode === "online" ? "online" : "cod",
    baseAmount,
    discountAmount: 0,
    couponDiscountAmount: 0,
    taxAmount: tax,
    totalAmount: total,
    partnerEarning,
    cityId,
    notes,
    createdByAdminId: adminId,
  });

  if (user.fcmToken) {
    await sendPushNotification(
      [user.fcmToken],
      "Booking Confirmed",
      `Your booking for ${primaryServiceName} has been placed. Booking ID: ${booking.bookingCode}`,
      { bookingId: String(booking.id), type: "booking" },
      "beyomo_booking"
    ).catch(() => {});
  }

  await Notification.create({
    userId,
    title: "Booking Placed",
    body: `Your booking for ${primaryServiceName} (${booking.bookingCode}) has been placed.`,
    data: { bookingId: String(booking.id) },
    type: "booking",
  });

  if (!partnerId && booking.addressCity) {
    const cityPartners = await Partner.findAll({
      where: { status: "approved", locationCity: booking.addressCity },
      attributes: ["id", "fcmToken"],
    });
    const tokens = cityPartners.map(p => p.fcmToken).filter(Boolean);
    if (tokens.length > 0) {
      await sendPushNotification(
        tokens,
        "New Job Available",
        `New booking for ${primaryServiceName} near you. Open the app to accept.`,
        { bookingId: String(booking.id), type: "available_booking" },
        PARTNER_NEW_BOOKING_CHANNEL
      ).catch(() => {});
    }
  }

  return booking;
};

const listBookings = async ({ status, userId, partnerId, cityIds, page = 1, limit = 10 }) => {
  const offset = (page - 1) * limit;
  const where = { ...cityIdsFilter(cityIds) };
  if (status) where.status = status;
  if (userId) where.userId = userId;
  if (partnerId) where.partnerId = partnerId;

  const { count: total, rows: data } = await Booking.findAndCountAll({
    where, order: [["createdAt", "DESC"]], offset, limit,
    include: [
      { model: User, as: "user", attributes: ["name", "phone"] },
      { model: Partner, as: "partner", attributes: ["name", "phone"] },
      { model: Service, as: "service", attributes: ["name", "basePrice"] },
    ],
  });
  return { data, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};

const getBookingDetail = async (bookingId) => {
  const booking = await Booking.findByPk(bookingId, {
    include: [
      { model: User, as: "user", attributes: ["name", "phone", "email"] },
      { model: Partner, as: "partner", attributes: ["name", "phone", "email"] },
      { model: Service, as: "service", attributes: ["name", "basePrice", "duration"] },
      { model: Payment, as: "payment" },
      { model: Coupon, as: "coupon", attributes: ["code", "type", "discount"] },
      { model: Offer, as: "offer", attributes: ["title"] },
      { model: ServicePackage, as: "package", attributes: ["id", "title", "price", "image"] },
    ],
  });
  if (!booking) throw new AppError("Booking not found", 404);

  const PartnerLedgerEntry = require("../../../settlements/models/partnerLedgerEntry.model");
  const ledgerEntries = await PartnerLedgerEntry.findAll({
    where: { bookingId, status: { [Op.ne]: "voided" } },
    include: [{ model: Partner, as: "partner", attributes: ["name"] }],
  });

  const plain = booking.toJSON();
  plain.ledgerEntries = ledgerEntries.map(e => ({
    id: e.id, partnerId: e.partnerId, partnerName: e.partner?.name,
    direction: e.direction, amount: parseFloat(e.amount), status: e.status,
    partnerNetAmount: parseFloat(e.partnerNetAmount), adminCommissionAmount: parseFloat(e.adminCommissionAmount),
  }));

  // Recompute the revenue split from the CURRENT category / package rates instead of the
  // frozen value stored on the booking at creation time. When an admin raises a category's
  // adminPercent (e.g. 20% -> 30%), new bookings pick it up but older rows keep their old
  // partnerEarning snapshot — so the dashboard would otherwise keep showing the stale split.
  // These fields let the UI display the up-to-date admin/partner split per booking.
  try {
    const serviceItems = plain.services ?? [];
    // `packages` comes back from the driver as a JSON string, so an Array.isArray test on
    // the raw column silently skips the multi-package branch and blends the booking over
    // its raw per-service prices instead of the package prices it was actually charged —
    // which reported a different split here than the partner app's stored partnerEarning.
    const bookingPackages = typeof plain.packages === "string"
      ? (() => { try { return JSON.parse(plain.packages); } catch { return []; } })()
      : plain.packages;
    let rates;
    if (Array.isArray(bookingPackages) && bookingPackages.length > 0) {
      // Multi-package: each package keeps its own split — blend them by price weight.
      // The pool must carry `price`; resolveRatesForMultiPackageBooking weights by
      // price * qty, so omitting it makes every weight NaN. Prefer the price snapshotted
      // on the booking over the package's current price — that's what the customer paid.
      const ratePools = [];
      for (const p of bookingPackages) {
        const pkg = await ServicePackage.findByPk(p.packageId);
        const price = p.price ?? pkg?.price ?? 0;
        if (pkg) ratePools.push({ package: { price, adminPercent: pkg.adminPercent, partnerPercent: pkg.partnerPercent, gstPercent: pkg.gstPercent }, qty: p.qty || 1 });
        else ratePools.push({ package: { price, adminPercent: DEFAULT_ADMIN_PERCENT, partnerPercent: DEFAULT_PARTNER_PERCENT, gstPercent: DEFAULT_GST_PERCENT }, qty: p.qty || 1 });
      }
      rates = await resolveRatesForMultiPackageBooking({ packages: ratePools, serviceItems });
    } else {
      let pkg = null;
      if (plain.packageId != null) {
        const found = await ServicePackage.findByPk(plain.packageId);
        if (found) {
          pkg = {
            adminPercent: found.adminPercent,
            partnerPercent: found.partnerPercent,
            gstPercent: found.gstPercent,
          };
        }
      }
      rates = await resolveRatesForBooking({ serviceItems, package: pkg });
    }
    plain.recomputedAdminPercent = rates.adminPercent;
    plain.recomputedPartnerPercent = rates.partnerPercent;

    const baseAmount = parseFloat(plain.baseAmount ?? 0);
    const couponDiscount = parseFloat(plain.couponDiscountAmount ?? 0);
    const taxableAmount = Math.max(0, baseAmount - couponDiscount);
    plain.recomputedAdminCommission = Math.round(taxableAmount * rates.adminPercent / 100);
    plain.recomputedPartnerEarning = Math.round(taxableAmount * rates.partnerPercent / 100);
  } catch {
    // Fall back to the frozen stored values; never fail reading a booking detail.
  }

  return plain;
};

const assignPartner = async (bookingId, partnerId) => {
  const [partner, booking] = await Promise.all([
    Partner.findOne({ where: { id: partnerId, status: "approved" } }),
    Booking.findByPk(bookingId),
  ]);
  if (!partner) throw new AppError("Partner not found or not approved", 404);
  if (!booking) throw new AppError("Booking not found", 404);
  if (booking.cityId && partner.cityId && booking.cityId !== partner.cityId) {
    throw new AppError("Partner is not in the same city as this booking", 400);
  }

  // Keep per-service tracking consistent with the booking-level assignment — every
  // booking carries this tracking now, and completion/settlement logic only credits a
  // partner for services stamped with their assignedPartnerId. Without this, a booking
  // assigned this way could never be marked completed (services stay "unassigned" forever).
  const svcs = (() => { const s = booking.services; if (Array.isArray(s)) return [...s]; if (typeof s === "string") { try { return JSON.parse(s); } catch { return []; } } return []; })();
  const updatedSvcs = svcs.map(s => {
    if (s.removed) return s;
    if (!s.assignedPartnerId || !s.serviceStatus || s.serviceStatus === "unassigned") {
      return { ...s, serviceStatus: "claimed", assignedPartnerId: partner.id, assignedPartnerName: partner.name };
    }
    return s;
  });

  await booking.update({ partnerId, status: "confirmed", services: updatedSvcs });

  // Notify partner about the new assignment
  const msg = `You have been assigned to booking ${booking.bookingCode}. Scheduled: ${new Date(booking.scheduledAt).toLocaleString("en-IN")}.`;
  if (partner.fcmToken) {
    // type "new_booking", not the generic "booking": this IS a new job for the partner,
    // and the app routes the custom alert sound (and the tap-through to the job) off
    // that distinction. The stored Notification row below keeps type "booking", which
    // is what the in-app list groups on.
    await sendPushNotification([partner.fcmToken], "New Booking Assigned", msg,
      { bookingId: String(booking.id), type: "new_booking" },
      PARTNER_NEW_BOOKING_CHANNEL).catch(() => {});
  }
  await Notification.create({
    partnerId: partner.id,
    title: "New Booking Assigned",
    body: msg,
    data: { bookingId: String(booking.id) },
    type: "booking",
  });

  return booking;
};

// Explicit admin acknowledgement of a new booking — moves it out of "pending" without
// necessarily assigning a partner yet (that stays a separate step via assignPartner).
const acceptBooking = async (bookingId) => {
  const booking = await Booking.findByPk(bookingId);
  if (!booking) throw new AppError("Booking not found", 404);
  if (booking.status !== "pending") {
    throw new AppError(`Only a pending booking can be accepted (current status: "${booking.status}")`, 400);
  }
  await booking.update({ status: "confirmed" });

  const user = await User.findByPk(booking.userId);
  const userMsg = `Your booking ${booking.bookingCode} has been accepted and is being arranged.`;
  if (user?.fcmToken) {
    await sendPushNotification([user.fcmToken], "Booking Accepted", userMsg,
      { bookingId: String(booking.id), type: "booking" }, "beyomo_booking").catch(() => {});
  }
  await Notification.create({
    userId: booking.userId,
    title: "Booking Accepted",
    body: userMsg,
    data: { bookingId: String(booking.id) },
    type: "booking",
  });

  return booking;
};

const editBookingServices = async (bookingId, serviceItems = [], removeIndices = [], updateQty = []) => {
  const booking = await Booking.findByPk(bookingId);
  if (!booking) throw new AppError("Booking not found", 404);
  if (booking.status === "cancelled") throw new AppError("Cannot edit services on a cancelled booking", 400);

  const existing = (() => { const s = booking.services; if (Array.isArray(s)) return s; if (typeof s === 'string') { try { return JSON.parse(s); } catch { return []; } } return []; })();
  let updatedServices = [...existing];

  // Update quantity on existing (non-removed) entries
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

  // Add new services — catalog references ({id, qty}) and free-form add-ons ({isAddOn, name, price, qty})
  const catalogItems = serviceItems.filter(s => !s.isAddOn);
  const addOnItems = serviceItems.filter(s => s.isAddOn);

  if (catalogItems.length > 0) {
    const serviceIds = catalogItems.map(s => parseInt(s.id));
    const foundServices = await Service.findAll({
      where: { id: serviceIds, isActive: true },
      include: [{ model: ServiceCategory, as: "category", attributes: ["adminPercent", "partnerPercent", "gstPercent"] }],
    });
    if (foundServices.length !== serviceIds.length) throw new AppError("One or more services not found or unavailable", 404);

    const serviceMap = Object.fromEntries(foundServices.map(s => [s.id, s]));
    const priceOf = await cityPriceResolver(serviceIds, booking.cityId);
    const newEntries = catalogItems.map(item => {
      const svc = serviceMap[parseInt(item.id)];
      return {
        serviceId: svc.id, name: svc.name, price: priceOf(svc), qty: item.qty || 1,
        duration: svc.duration || null, image: svc.image || null, addedByAdmin: true,
        adminPercent: svc.category ? parseFloat(svc.category.adminPercent) : DEFAULT_ADMIN_PERCENT,
        partnerPercent: svc.category ? parseFloat(svc.category.partnerPercent) : DEFAULT_PARTNER_PERCENT,
        gstPercent: svc.category ? parseFloat(svc.category.gstPercent) : DEFAULT_GST_PERCENT,
      };
    });
    updatedServices = [...updatedServices, ...newEntries];
  }

  if (addOnItems.length > 0) {
    const newAddOnEntries = addOnItems.map(item => ({
      name: item.name, price: parseFloat(item.price) || 0, qty: item.qty || 1,
      isAddOn: true, addedByAdmin: true,
      adminPercent: DEFAULT_ADMIN_PERCENT, partnerPercent: DEFAULT_PARTNER_PERCENT, gstPercent: DEFAULT_GST_PERCENT,
    }));
    updatedServices = [...updatedServices, ...newAddOnEntries];
  }

  // Recalculate total from active (non-removed) services only
  const activeServices = updatedServices.filter(s => !s.removed);
  const newBase = activeServices.reduce((sum, s) => sum + (parseFloat(s.price ?? s.basePrice ?? 0)) * (s.qty || 1), 0);
  const couponDiscount = parseFloat(booking.couponDiscountAmount || 0);
  const taxable = newBase - couponDiscount;
  const pkg = booking.packageId ? await ServicePackage.findByPk(booking.packageId) : null;
  const { partnerPercent, gstPercent } = await resolveRatesForBooking({ serviceItems: activeServices, package: pkg });
  const tax = parseFloat((taxable * gstPercent / 100).toFixed(2));
  const total = parseFloat((taxable + tax).toFixed(2));
  const partnerEarning = parseFloat((taxable * partnerPercent / 100).toFixed(2));

  await booking.update({ services: updatedServices, baseAmount: newBase, taxAmount: tax, totalAmount: total, partnerEarning });

  // Notify user and assigned partners about the service change
  const userNotifMsg = `The services on your booking ${booking.bookingCode} have been updated by support. New total: ₹${total}.`;
  const userRecord = await User.findByPk(booking.userId);
  if (userRecord?.fcmToken) {
    await sendPushNotification([userRecord.fcmToken], "Booking Updated", userNotifMsg,
      { bookingId: String(booking.id), type: "booking" }, "beyomo_booking").catch(() => {});
  }
  await Notification.create({
    userId: booking.userId,
    title: "Booking Updated",
    body: userNotifMsg,
    data: { bookingId: String(booking.id) },
    type: "booking",
  });

  if (booking.partnerId) {
    const partnerRecord = await Partner.findByPk(booking.partnerId, { attributes: ["fcmToken"] });
    if (partnerRecord?.fcmToken) {
      await sendPushNotification([partnerRecord.fcmToken], "Booking Updated",
        `Services on booking ${booking.bookingCode} have been modified by admin. New total: ₹${total}.`,
        { bookingId: String(booking.id), type: "booking" }).catch(() => {});
    }
  }

  return booking;
};

// Reuses the same array-surgery + repricing logic as the user-facing remove-package
// endpoint (handles both a single legacy package and one package out of several booked
// together) — admin just skips the userId ownership check a customer action needs.
const removeBookingPackage = async (bookingId, packageId) => {
  const { buildPackageRemoval } = require("../../../bookings/services/v1/bookings.service");
  const booking = await Booking.findByPk(bookingId);
  if (!booking) throw new AppError("Booking not found", 404);
  if (!["pending", "confirmed"].includes(booking.status))
    throw new AppError("The package can only be removed from a pending or confirmed booking", 400);

  const updates = await buildPackageRemoval(booking, packageId);
  await booking.update(updates);

  const userRecord = await User.findByPk(booking.userId);
  if (userRecord?.fcmToken) {
    await sendPushNotification([userRecord.fcmToken], "Booking Updated",
      `A package on your booking ${booking.bookingCode} was removed by support. New total: ₹${updates.totalAmount}.`,
      { bookingId: String(booking.id), type: "booking" }, "beyomo_booking").catch(() => {});
  }
  await Notification.create({
    userId: booking.userId,
    title: "Booking Updated",
    body: `A package on your booking ${booking.bookingCode} was removed by support. New total: ₹${updates.totalAmount}.`,
    data: { bookingId: String(booking.id) },
    type: "booking",
  });

  return booking;
};

// Reuses the same array-surgery + repricing logic as the user-facing add-package
// endpoint — admin skips the userId ownership check and resolves the service selection
// itself (the client still tells us which services, same contract as user booking/adding).
const addBookingPackage = async (bookingId, packageId, qty, serviceItems) => {
  const { buildPackageAddition } = require("../../../bookings/services/v1/bookings.service");
  const booking = await Booking.findByPk(bookingId);
  if (!booking) throw new AppError("Booking not found", 404);
  if (!["pending", "confirmed"].includes(booking.status))
    throw new AppError("A package can only be added to a pending or confirmed booking", 400);

  const updates = await buildPackageAddition(booking, packageId, qty, serviceItems);
  await booking.update(updates);

  const userRecord = await User.findByPk(booking.userId);
  if (userRecord?.fcmToken) {
    await sendPushNotification([userRecord.fcmToken], "Booking Updated",
      `A package was added to your booking ${booking.bookingCode} by support. New total: ₹${updates.totalAmount}.`,
      { bookingId: String(booking.id), type: "booking" }, "beyomo_booking").catch(() => {});
  }
  await Notification.create({
    userId: booking.userId,
    title: "Booking Updated",
    body: `A package was added to your booking ${booking.bookingCode} by support. New total: ₹${updates.totalAmount}.`,
    data: { bookingId: String(booking.id) },
    type: "booking",
  });

  return booking;
};

const cancelBooking = async (bookingId) => {
  const booking = await Booking.findByPk(bookingId);
  if (!booking) throw new AppError("Booking not found", 404);
  if (["completed", "cancelled"].includes(booking.status)) {
    throw new AppError("Cannot cancel a completed or already cancelled booking", 400);
  }
  await booking.update({ status: "cancelled", cancelledBy: "admin", cancellationReason: "Cancelled by admin" });

  // Notify claimed partners and the user
  const svcs = (() => { const s = booking.services; if (Array.isArray(s)) return s; if (typeof s === "string") { try { return JSON.parse(s); } catch { return []; } } return []; })();
  const claimedPartnerIds = [...new Set(svcs.filter(s => s.assignedPartnerId).map(s => s.assignedPartnerId))];
  // Also notify primary partner if set and not already in the list
  if (booking.partnerId && !claimedPartnerIds.includes(booking.partnerId)) {
    claimedPartnerIds.push(booking.partnerId);
  }
  if (claimedPartnerIds.length > 0) {
    const claimedPartners = await Partner.findAll({ where: { id: claimedPartnerIds }, attributes: ["fcmToken"] });
    const tokens = claimedPartners.map(p => p.fcmToken).filter(Boolean);
    if (tokens.length > 0) {
      await sendPushNotification(tokens, "Booking Cancelled",
        `Booking ${booking.bookingCode} has been cancelled by the admin.`,
        { bookingId: String(booking.id), type: "booking" });
    }
  }
  const user = await User.findByPk(booking.userId);
  const userMsg = `Your booking ${booking.bookingCode} has been cancelled by support. Contact us for help.`;
  if (user?.fcmToken) {
    await sendPushNotification([user.fcmToken], "Booking Cancelled", userMsg,
      { bookingId: String(booking.id), type: "booking" }, "beyomo_booking").catch(() => {});
  }
  await Notification.create({
    userId: booking.userId,
    title: "Booking Cancelled",
    body: userMsg,
    data: { bookingId: String(booking.id) },
    type: "booking",
  });

  return booking;
};

const rescheduleBooking = async (bookingId, scheduledAt, reason) => {
  const booking = await Booking.findByPk(bookingId);
  if (!booking) throw new AppError("Booking not found", 404);
  if (["completed", "cancelled"].includes(booking.status)) {
    throw new AppError("Cannot reschedule a completed or cancelled booking", 400);
  }

  const previousScheduledAt = booking.scheduledAt;
  const newScheduledAt = new Date(scheduledAt);

  await booking.update({
    scheduledAt: newScheduledAt,
    previousScheduledAt,
    rescheduledBy: "admin",
    rescheduleReason: reason || "Rescheduled by admin",
    rescheduledCount: (booking.rescheduledCount || 0) + 1,
  });

  const newTimeStr = newScheduledAt.toLocaleString("en-IN");

  const user = await User.findByPk(booking.userId);
  const userMsg = `Your booking ${booking.bookingCode} has been rescheduled to ${newTimeStr} by support.`;
  if (user?.fcmToken) {
    await sendPushNotification([user.fcmToken], "Booking Rescheduled", userMsg,
      { bookingId: String(booking.id), type: "booking" }, "beyomo_booking").catch(() => {});
  }
  await Notification.create({
    userId: booking.userId,
    title: "Booking Rescheduled",
    body: userMsg,
    data: { bookingId: String(booking.id) },
    type: "booking",
  });

  if (booking.partnerId) {
    const partner = await Partner.findByPk(booking.partnerId, { attributes: ["fcmToken"] });
    if (partner?.fcmToken) {
      await sendPushNotification([partner.fcmToken], "Booking Rescheduled",
        `Booking ${booking.bookingCode} has been rescheduled to ${newTimeStr} by admin.`,
        { bookingId: String(booking.id), type: "booking" }).catch(() => {});
    }
  }

  return booking;
};

const listEarnings = async ({ cityIds, page = 1, limit = 20 }) => {
  const offset = (page - 1) * limit;
  const where = { status: "completed", ...cityIdsFilter(cityIds) };
  const { count: total, rows: data } = await Booking.findAndCountAll({
    where,
    order: [["createdAt", "DESC"]], offset, limit,
    include: [
      { model: User, as: "user", attributes: ["name", "phone"] },
      { model: Partner, as: "partner", attributes: ["name", "phone"] },
      { model: Service, as: "service", attributes: ["name"] },
      { model: Payment, as: "payment", attributes: ["method", "status"] },
    ],
  });
  return { data, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};

// ==================== COUPONS ====================

const listCoupons = async ({ page = 1, limit = 20 }) => {
  const offset = (page - 1) * limit;
  const { count: total, rows: data } = await Coupon.findAndCountAll({
    order: [["createdAt", "DESC"]], offset, limit,
  });
  return { data, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};

const createCoupon = async (data, adminId) => Coupon.create({ ...data, createdBy: adminId });

const updateCoupon = async (id, data) => {
  await Coupon.update(data, { where: { id } });
  const coupon = await Coupon.findByPk(id);
  if (!coupon) throw new AppError("Coupon not found", 404);
  return coupon;
};

const deleteCoupon = async (id) => {
  const deleted = await Coupon.destroy({ where: { id } });
  if (!deleted) throw new AppError("Coupon not found", 404);
  return { message: "Coupon deleted" };
};

const getReferralProgram = async () => ReferralProgram.getInstance();

const updateReferralProgram = async (data) => {
  const program = await ReferralProgram.getInstance();
  await program.update(data);
  return program;
};

// ==================== REVIEWS ====================

const listReviews = async ({ status, partnerId, cityId, page = 1, limit = 20 }) => {
  const offset = (page - 1) * limit;
  const where = {};
  if (status) where.status = status;
  if (partnerId) where.partnerId = partnerId;

  const include = [
    { model: User, as: "user", attributes: ["name"] },
    { model: Partner, as: "partner", attributes: ["name"] },
    { model: Service, as: "service", attributes: ["name"] },
  ];

  if (cityId) {
    include.push({ model: Booking, as: "booking", attributes: [], where: { cityId }, required: true });
  }

  const { count: total, rows: data } = await Review.findAndCountAll({
    where, order: [["createdAt", "DESC"]], offset, limit, include,
  });
  return { data, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};

const updateReviewStatus = async (id, status) => {
  await Review.update({ status }, { where: { id } });
  const review = await Review.findByPk(id);
  if (!review) throw new AppError("Review not found", 404);
  return review;
};

// ==================== NOTIFICATIONS ====================

const listNotifications = async ({ page = 1, limit = 20 }) => {
  const offset = (page - 1) * limit;
  const { count: total, rows: data } = await Notification.findAndCountAll({
    where: { userId: null, partnerId: null },
    order: [["createdAt", "DESC"]], offset, limit,
  });
  return { data, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};

const broadcastNotification = async ({ title, body, data, segment, cityIds }) => {
  let userTokens = [];
  let partnerTokens = [];
  const cityFilter = cityIdsFilter(cityIds);

  if (segment === "all_users" || segment === "all") {
    const users = await User.findAll({ where: { status: "active", fcmToken: { [Op.ne]: null }, ...cityFilter }, attributes: ["fcmToken", "id"] });
    userTokens = users.map((u) => u.fcmToken).filter(Boolean);
    if (users.length > 0) {
      await Notification.bulkCreate(users.map((u) => ({ userId: u.id, title, body, data: data || {}, type: "promo" })));
    }
  }

  if (segment === "all_partners" || segment === "all") {
    const partners = await Partner.findAll({ where: { status: "approved", fcmToken: { [Op.ne]: null }, ...cityFilter }, attributes: ["fcmToken", "id"] });
    partnerTokens = partners.map((p) => p.fcmToken).filter(Boolean);
    if (partners.length > 0) {
      await Notification.bulkCreate(partners.map((p) => ({ partnerId: p.id, title, body, data: data || {}, type: "promo" })));
    }
  }

  const allTokens = [...userTokens, ...partnerTokens];
  let pushResult = { skipped: true };

  if (allTokens.length > 0) {
    let successCount = 0;
    for (let i = 0; i < allTokens.length; i += 500) {
      const result = await sendPushNotification(allTokens.slice(i, i + 500), title, body, data || {});
      if (result.successCount) successCount += result.successCount;
    }
    pushResult = { sent: allTokens.length, success: successCount, delivered: allTokens.length };
  }

  // Always save a broadcast log entry so admin history persists
  const logEntry = await Notification.create({
    userId: null,
    partnerId: null,
    title,
    body,
    data: data || {},
    type: "promo",
  });

  return { message: "Broadcast completed", pushResult, logEntry };
};

// ==================== ADMIN USERS ====================

const listAdminUsers = async ({ page = 1, limit = 20 }) => {
  const offset = (page - 1) * limit;
  const { count: total, rows: data } = await AdminUser.findAndCountAll({
    order: [["createdAt", "DESC"]], offset, limit,
    attributes: { exclude: ["password"] },
    include: [{ model: AdminUser, as: "creator", attributes: ["name", "email"] }],
  });
  return { data, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};

const createAdminUser = async (data, createdById) => {
  const existing = await AdminUser.findOne({ where: { email: data.email } });
  if (existing) throw new AppError("An admin user with this email already exists", 400);
  return AdminUser.create({ ...data, createdBy: createdById });
};

const updateAdminUser = async (id, data) => {
  const target = await AdminUser.findByPk(id);
  if (!target) throw new AppError("Admin user not found", 404);

  // email is unique — check it here so a clash comes back as a readable 400 rather than
  // a raw SequelizeUniqueConstraintError 500, matching what createAdminUser already does.
  if (data.email && data.email !== target.email) {
    const existing = await AdminUser.findOne({ where: { email: data.email } });
    if (existing) throw new AppError("An admin user with this email already exists", 400);
  }

  await AdminUser.update(data, { where: { id } });
  const admin = await AdminUser.findByPk(id, { attributes: { exclude: ["password"] } });
  if (!admin) throw new AppError("Admin user not found", 404);
  return admin;
};

const deleteAdminUser = async (id, requesterId) => {
  if (String(id) === String(requesterId)) throw new AppError("You cannot delete your own account", 400);
  const deleted = await AdminUser.destroy({ where: { id } });
  if (!deleted) throw new AppError("Admin user not found", 404);
  return { message: "Admin user deleted" };
};

// ==================== FEEDBACK ====================

const listFeedback = async ({ status, type, page = 1, limit = 20, cityIds }) => {
  const offset = (page - 1) * limit;
  const where = {};
  if (status) where.status = status;
  if (type) where.type = type;

  const userInclude = { model: User, as: "user", attributes: ["name", "phone", "cityId"] };
  if (cityIds?.length) {
    userInclude.where = cityIdsFilter(cityIds);
    userInclude.required = true;
  }

  const { count: total, rows: data } = await AppFeedback.findAndCountAll({
    where, order: [["createdAt", "DESC"]], offset, limit,
    include: [userInclude],
  });
  return { data, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};

const updateFeedbackStatus = async (id, status, adminNotes) => {
  await AppFeedback.update({ status, adminNotes }, { where: { id } });
  const feedback = await AppFeedback.findByPk(id);
  if (!feedback) throw new AppError("Feedback not found", 404);
  return feedback;
};

// ==================== BANNERS ====================
const listBanners = async () => Banner.findAll({ order: [["sortOrder", "ASC"], ["createdAt", "DESC"]] });
const createBanner = async (data) => Banner.create(data);
const updateBanner = async (id, data) => {
  const banner = await Banner.findByPk(id);
  if (!banner) throw new AppError("Banner not found", 404);
  return banner.update(data);
};
const deleteBanner = async (id) => {
  const banner = await Banner.findByPk(id);
  if (!banner) throw new AppError("Banner not found", 404);
  await banner.destroy();
};

// ==================== CITIES ====================
const listCities = async () => City.findAll({ order: [["name", "ASC"]] });

const createCity = async (data) => {
  const existing = await City.findOne({ where: { name: data.name } });
  if (existing) throw new AppError("A city with this name already exists", 400);
  return City.create({
    name: data.name,
    code: data.code ? data.code.toUpperCase() : null,
    state: data.state || null,
    lat: data.lat ?? null,
    lng: data.lng ?? null,
    radius: data.radius ?? 30,
    isActive: data.isActive ?? true,
  });
};

const updateCity = async (id, data) => {
  await City.update(data, { where: { id } });
  const city = await City.findByPk(id);
  if (!city) throw new AppError("City not found", 404);
  return city;
};

const deleteCity = async (id) => {
  const city = await City.findByPk(id);
  if (!city) throw new AppError("City not found", 404);
  await city.destroy();
  return { message: "City deleted" };
};

// ==================== ZONES ====================

const resolveZoneCityIds = async (zoneIds) => {
  if (!zoneIds?.length) return null;
  const zones = await ServiceZone.findAll({ where: { id: zoneIds, isActive: true } });
  const cityIds = [...new Set(zones.flatMap(z => z.cityIds || []))].filter(Boolean);
  return cityIds.length ? cityIds : null;
};

const listZones = async () => ServiceZone.findAll({ order: [["createdAt", "ASC"]] });
const createZone = async (data) => ServiceZone.create(data);
const updateZone = async (id, data) => {
  const zone = await ServiceZone.findByPk(id);
  if (!zone) throw new AppError("Zone not found", 404);
  return zone.update(data);
};
const deleteZone = async (id) => {
  const zone = await ServiceZone.findByPk(id);
  if (!zone) throw new AppError("Zone not found", 404);
  await zone.destroy();
};

// ==================== OFFERS ====================
const offersService = require("../../../offers/services/v1/offers.service");
const listOffers   = (params) => offersService.listAll(params);
const createOffer  = (data)   => offersService.createOffer(data);
const updateOffer  = (id, d)  => offersService.updateOffer(id, d);
const deleteOffer  = (id)     => offersService.deleteOffer(id);

module.exports = {
  adminLogin,
  listUsers, getUserById, updateUserStatus, deleteUser, createUser,
  listPartners, getPartnerById, updatePartnerStatus, createPartner, updatePartner,
  listCategories, createCategory, updateCategory, deleteCategory, reorderCategories,
  listSubcategories, createSubcategory, updateSubcategory, deleteSubcategory,
  listServices, createService, updateService, deleteService, toggleServiceCityStatus, reorderServices,
  createBookingForCustomer,
  listBookings, getBookingDetail, assignPartner, acceptBooking, cancelBooking, rescheduleBooking, editBookingServices, removeBookingPackage, addBookingPackage,
  listCoupons, createCoupon, updateCoupon, deleteCoupon, getReferralProgram, updateReferralProgram,
  listReviews, updateReviewStatus,
  listNotifications, broadcastNotification,
  listAdminUsers, createAdminUser, updateAdminUser, deleteAdminUser,
  listFeedback, updateFeedbackStatus,
  listEarnings,
  listBanners, createBanner, updateBanner, deleteBanner,
  resolveZoneCityIds, listZones, createZone, updateZone, deleteZone,
  listCities, createCity, updateCity, deleteCity,
  listOffers, createOffer, updateOffer, deleteOffer,
};
