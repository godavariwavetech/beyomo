const catchAsync = require("../../../../utils/errorHandlers/catchAsync");
const AppError = require("../../../../utils/errorHandlers/appError");
const adminService = require("../../services/v1/admin.service");
const settlementsService = require("../../../settlements/services/v1/settlements.service");
const Joi = require("joi");
const AdminUser = require("../../models/adminUser.model");
const User = require("../../../users/models/user.model");
const Partner = require("../../../partners/models/partner.model");
const AdminSetting = require("../../../settings/models/adminSetting.model");
const { sendPushNotification } = require("../../../../utils/firebaseUtils");

// ==================== VALIDATION SCHEMAS ====================

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

const createAdminUserSchema = Joi.object({
  name: Joi.string().trim().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  role: Joi.string().valid("super_admin", "admin", "manager", "analyst", "support").required(),
  customPermissions: Joi.array().items(Joi.string()),
  allowedCities: Joi.array().items(Joi.number()).allow(null),
  allowedZones:  Joi.array().items(Joi.number()).allow(null),
  status: Joi.string().valid("active", "inactive").default("active"),
});

const updateAdminUserSchema = Joi.object({
  name: Joi.string().trim(),
  // The edit form shows Email as an editable required field and posts it back on every
  // save, so leaving it out of this schema made every admin-user update fail outright
  // with `"email" is not allowed` (Joi rejects unknown keys by default).
  email: Joi.string().email().trim().lowercase(),
  role: Joi.string().valid("super_admin", "admin", "manager", "analyst", "support"),
  customPermissions: Joi.array().items(Joi.string()),
  allowedCities: Joi.array().items(Joi.number()).allow(null),
  allowedZones:  Joi.array().items(Joi.number()).allow(null),
  status: Joi.string().valid("active", "inactive"),
});

const createPartnerSchema = Joi.object({
  name: Joi.string().trim().required(),
  phone: Joi.string().trim().required(),
  email: Joi.string().email().allow(null, ""),
  city: Joi.string().trim().allow(null, ""),
  experience: Joi.number().min(0).default(0),
  gender: Joi.string().valid("female", "male").allow(null, ""),
  professions: Joi.array().items(Joi.string().trim()).default([]),
  categories: Joi.array().items(Joi.number().integer().positive()).default([]),
  profilePicture: Joi.string().allow(null, ""),
  aadharUrl: Joi.string().allow(null, ""),
  agreementUrl: Joi.string().allow(null, ""),
  bankAccountNo: Joi.string().trim().allow(null, ""),
  bankIfsc: Joi.string().trim().allow(null, ""),
  bankName: Joi.string().trim().allow(null, ""),
  bankHolderName: Joi.string().trim().allow(null, ""),
});

const updatePartnerSchema = Joi.object({
  name: Joi.string().trim(),
  phone: Joi.string().trim(),
  email: Joi.string().email().allow(null, ""),
  city: Joi.string().trim().allow(null, ""),
  experience: Joi.number().min(0),
  gender: Joi.string().valid("female", "male").allow(null, ""),
  professions: Joi.array().items(Joi.string().trim()),
  categories: Joi.array().items(Joi.number().integer().positive()),
  profilePicture: Joi.string().allow(null, ""),
  aadharUrl: Joi.string().allow(null, ""),
  agreementUrl: Joi.string().allow(null, ""),
  bankAccountNo: Joi.string().trim().allow(null, ""),
  bankIfsc: Joi.string().trim().allow(null, ""),
  bankName: Joi.string().trim().allow(null, ""),
  bankHolderName: Joi.string().trim().allow(null, ""),
}).min(1);

const createUserSchema = Joi.object({
  name: Joi.string().trim().required(),
  phone: Joi.string().trim().required(),
  email: Joi.string().email().allow(null, ""),
});

const patchServiceSchema = Joi.object({
  name: Joi.string().trim(),
  categoryId: Joi.alternatives().try(Joi.string(), Joi.number()),
  description: Joi.string().trim().allow(null, ""),
  basePrice: Joi.number().positive(),
  subcategoryId: Joi.number().integer().positive().allow(null, ""),
  duration: Joi.number().integer().positive(),
  isActive: Joi.boolean(),
  image: Joi.string().allow(null, ""),
  tags: Joi.array().items(Joi.string()),
}).min(1);

const couponSchema = Joi.object({
  code: Joi.string().trim().uppercase().required(),
  type: Joi.string().valid("flat", "percent").required(),
  discount: Joi.number().positive().required(),
  maxDiscount: Joi.number().positive().allow(null),
  minOrderAmount: Joi.number().min(0).default(0),
  maxUses: Joi.number().integer().positive().allow(null),
  validFrom: Joi.date().default(() => new Date()),
  validTill: Joi.date().allow(null).default(null),
  isActive: Joi.boolean().default(true),
  description: Joi.string().trim().allow("", null),
  cityIds: Joi.array().items(Joi.number().integer()).default([]),
});

const updateCouponSchema = Joi.object({
  code: Joi.string().trim().uppercase(),
  type: Joi.string().valid("flat", "percent"),
  discount: Joi.number().positive(),
  maxDiscount: Joi.number().positive().allow(null),
  minOrderAmount: Joi.number().min(0),
  maxUses: Joi.number().integer().positive().allow(null),
  validFrom: Joi.date().allow(null),
  validTill: Joi.date().allow(null),
  isActive: Joi.boolean(),
  description: Joi.string().trim().allow("", null),
  cityIds: Joi.array().items(Joi.number().integer()),
});

const categorySchema = Joi.object({
  name: Joi.string().trim().required(),
  description: Joi.string().trim().allow("", null),
  icon: Joi.string().allow(null, ""),
  image: Joi.string().allow(null, ""),
  isActive: Joi.boolean().default(true),
  sortOrder: Joi.number().default(0),
  showOnHome: Joi.boolean().default(false),
  adminPercent:   Joi.number().min(0).max(100).default(20),
  partnerPercent: Joi.number().min(0).max(100).default(80),
  gstPercent:     Joi.number().min(0).max(100).default(18),
  cityIds: Joi.array().items(Joi.number().integer()).default([]),
});

// Optional second level under a category (Waxing -> Honey / Rica).
const subcategorySchema = Joi.object({
  categoryId: Joi.number().integer().positive().required(),
  name: Joi.string().trim().required(),
  description: Joi.string().trim().allow("", null),
  image: Joi.string().allow(null, ""),
  isActive: Joi.boolean().default(true),
  sortOrder: Joi.number().allow(null),
});

// Every field optional on update so the dashboard can PATCH just isActive or just name.
const subcategoryUpdateSchema = Joi.object({
  categoryId: Joi.number().integer().positive(),
  name: Joi.string().trim(),
  description: Joi.string().trim().allow("", null),
  image: Joi.string().allow(null, ""),
  isActive: Joi.boolean(),
  sortOrder: Joi.number().allow(null),
});

// customPrice: per-city price override. null/"" clears it back to the global basePrice;
// omitting the key entirely leaves whatever the city already had untouched.
const cityMappingItem = Joi.object({
  cityId: Joi.number().integer().required(),
  isActive: Joi.boolean().default(true),
  customPrice: Joi.number().positive().allow(null, ""),
});

const serviceSchema = Joi.object({
  categoryId: Joi.alternatives().try(Joi.number(), Joi.string()).required(),
  name: Joi.string().trim().required(),
  description: Joi.string().trim().allow("", null),
  basePrice: Joi.number().positive().required(),
  // Optional second level under the category; null = lists under the category only.
  subcategoryId: Joi.number().integer().positive().allow(null, ""),
  duration: Joi.number().integer().positive().default(60),
  tags: Joi.array().items(Joi.string()),
  image: Joi.string().allow(null, ""),
  priceStartsFrom: Joi.boolean().default(false),
  isPopular: Joi.boolean().default(false),
  showOnHome: Joi.boolean().default(false),
  isActive: Joi.boolean().default(true),
  cityIds: Joi.array().items(Joi.number().integer()).default([]),
  cityMappings: Joi.array().items(cityMappingItem).default([]),
});

const reorderCategoriesSchema = Joi.object({
  order: Joi.array().items(Joi.number().integer()).min(1).required(),
});

const reorderServicesSchema = Joi.object({
  categoryId: Joi.number().integer().required(),
  order: Joi.array().items(Joi.number().integer()).min(1).required(),
});

const serviceUpdateSchema = Joi.object({
  categoryId: Joi.alternatives().try(Joi.number(), Joi.string()),
  name: Joi.string().trim(),
  description: Joi.string().trim().allow("", null),
  basePrice: Joi.number().positive(),
  subcategoryId: Joi.number().integer().positive().allow(null, ""),
  duration: Joi.number().integer().positive(),
  tags: Joi.array().items(Joi.string()),
  image: Joi.string().allow(null, ""),
  priceStartsFrom: Joi.boolean(),
  isPopular: Joi.boolean(),
  showOnHome: Joi.boolean(),
  isActive: Joi.boolean(),
  cityIds: Joi.array().items(Joi.number().integer()),
  cityMappings: Joi.array().items(cityMappingItem),
});

// Admin/support-created booking — same mixed catalog + free-form add-on item shape
// as editBookingServicesSchema below, plus the target customer and their address.
const adminCreateBookingSchema = Joi.object({
  userId: Joi.number().integer().positive().required(),
  services: Joi.array().items(
    Joi.alternatives().try(
      Joi.object({
        id: Joi.alternatives().try(Joi.number(), Joi.string()).required(),
        qty: Joi.number().integer().min(1).default(1),
      }),
      Joi.object({
        isAddOn: Joi.boolean().valid(true).required(),
        name: Joi.string().trim().min(1).max(120).required(),
        price: Joi.number().min(0).required(),
        qty: Joi.number().integer().min(1).default(1),
      })
    )
  ).min(1).required(),
  partnerId: Joi.alternatives().try(Joi.number(), Joi.string()).allow(null, ""),
  address: Joi.object({
    label: Joi.string().allow("", null),
    line1: Joi.string().required(),
    line2: Joi.string().allow("", null),
    city: Joi.string().allow("", null).default(""),
    state: Joi.string().allow("", null).default(""),
    pincode: Joi.string().allow("", null).default(""),
    lat: Joi.number().allow(null),
    lng: Joi.number().allow(null),
  }).required(),
  scheduledAt: Joi.date().required(),
  paymentMode: Joi.string().valid("online", "cod").default("cod"),
  notes: Joi.string().trim().max(500).allow("", null),
});

const broadcastSchema = Joi.object({
  title: Joi.string().required(),
  body: Joi.string().required(),
  data: Joi.object().default({}),
  segment: Joi.string().valid("all_users", "all_partners", "all").default("all"),
  cityIds: Joi.array().items(Joi.number().integer().positive()).default([]),
});

// ==================== AUTH ====================

const login = catchAsync(async (req, res, next) => {
  const { error, value } = loginSchema.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 400));

  const result = await adminService.adminLogin(value.email, value.password);
  res.status(200).json({ status: true, message: "Login successful", data: result });
});

const logout = catchAsync(async (req, res, next) => {
  res.status(200).json({ status: true, message: "Logged out successfully" });
});

// Dev-only: return admin list for login-page credential hints (no passwords)
const devAdminHints = catchAsync(async (req, res, next) => {
  if (process.env.NODE_ENV === "production") {
    return next(new AppError("Not found", 404));
  }
  const admins = await AdminUser.findAll({
    attributes: ["id", "name", "email", "role", "status"],
    order: [["role", "ASC"], ["createdAt", "ASC"]],
  });
  res.status(200).json({ status: true, data: admins });
});

const parseCityIds = (q) => {
  if (!q) return null;
  const ids = String(q).split(',').map(Number).filter(n => Number.isInteger(n) && n > 0);
  return ids.length ? ids : null;
};

// ==================== USERS ====================

const listUsers = catchAsync(async (req, res, next) => {
  let cityIds = parseCityIds(req.query.cityIds) ?? (req.query.cityId ? [parseInt(req.query.cityId)] : null);
  if (req.admin.allowedZones?.length && req.admin.role !== "super_admin") {
    const zoneCityIds = await adminService.resolveZoneCityIds(req.admin.allowedZones);
    if (zoneCityIds) cityIds = cityIds ? cityIds.filter(id => zoneCityIds.includes(id)) : zoneCityIds;
  }
  const result = await adminService.listUsers({
    search: req.query.search,
    status: req.query.status,
    cityIds,
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 10,
  });
  res.status(200).json({ status: true, data: result.data, pagination: result.pagination });
});

const getUserById = catchAsync(async (req, res, next) => {
  const user = await adminService.getUserById(req.params.id);
  res.status(200).json({ status: true, data: user });
});

const updateUserStatus = catchAsync(async (req, res, next) => {
  const { status } = req.body;
  if (!["active", "blocked"].includes(status)) {
    return next(new AppError("Status must be active or blocked", 400));
  }
  const user = await adminService.updateUserStatus(req.params.id, status);
  res.status(200).json({ status: true, message: "User status updated", data: user });
});

const deleteUser = catchAsync(async (req, res, next) => {
  const result = await adminService.deleteUser(req.params.id);
  res.status(200).json({ status: true, message: result.message });
});

// ==================== PARTNERS ====================

const listPartners = catchAsync(async (req, res, next) => {
  let cityIds = parseCityIds(req.query.cityIds) ?? (req.query.cityId ? [parseInt(req.query.cityId)] : null);
  if (req.admin.allowedZones?.length && req.admin.role !== "super_admin") {
    const zoneCityIds = await adminService.resolveZoneCityIds(req.admin.allowedZones);
    if (zoneCityIds) cityIds = cityIds ? cityIds.filter(id => zoneCityIds.includes(id)) : zoneCityIds;
  }
  const result = await adminService.listPartners({
    search: req.query.search,
    status: req.query.status,
    source: req.query.source,
    cityIds,
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 10,
  });
  res.status(200).json({ status: true, data: result.data, pagination: result.pagination });
});

const getPartnerById = catchAsync(async (req, res, next) => {
  const partner = await adminService.getPartnerById(req.params.id);
  res.status(200).json({ status: true, data: partner });
});

const updatePartnerStatus = catchAsync(async (req, res, next) => {
  const { status, reason } = req.body;
  const partner = await adminService.updatePartnerStatus(req.params.id, status, reason);
  res.status(200).json({ status: true, message: "Partner status updated", data: partner });
});

const createPartner = catchAsync(async (req, res, next) => {
  const { error, value } = createPartnerSchema.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 400));
  const partner = await adminService.createPartner(value);
  res.status(201).json({ status: true, message: "Partner created", data: partner });
});

const updatePartner = catchAsync(async (req, res, next) => {
  const { error, value } = updatePartnerSchema.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 400));
  const partner = await adminService.updatePartner(req.params.id, value);
  res.status(200).json({ status: true, message: "Partner updated", data: partner });
});

const createUser = catchAsync(async (req, res, next) => {
  const { error, value } = createUserSchema.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 400));
  const user = await adminService.createUser(value);
  res.status(201).json({ status: true, message: "User created", data: user });
});

// ==================== SERVICE CATEGORIES ====================

const listCategories = catchAsync(async (req, res, next) => {
  const cityId = req.query.cityId ? parseInt(req.query.cityId) : null;
  const categories = await adminService.listCategories({ cityId });
  res.status(200).json({ status: true, data: categories });
});

const createCategory = catchAsync(async (req, res, next) => {
  const { error, value } = categorySchema.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 400));
  const category = await adminService.createCategory(value);
  res.status(201).json({ status: true, message: "Category created", data: category });
});

const updateCategory = catchAsync(async (req, res, next) => {
  const { error, value } = categorySchema.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 400));
  const category = await adminService.updateCategory(req.params.id, value);
  res.status(200).json({ status: true, message: "Category updated", data: category });
});

const deleteCategory = catchAsync(async (req, res, next) => {
  const result = await adminService.deleteCategory(req.params.id);
  res.status(200).json({ status: true, message: result.message });
});

const reorderCategories = catchAsync(async (req, res, next) => {
  const { error, value } = reorderCategoriesSchema.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 400));
  await adminService.reorderCategories(value.order);
  res.status(200).json({ status: true, message: "Category order updated" });
});

// ==================== SERVICE SUBCATEGORIES ====================

const listSubcategories = catchAsync(async (req, res, next) => {
  const categoryId = req.query.categoryId ? parseInt(req.query.categoryId) : null;
  const subcategories = await adminService.listSubcategories({ categoryId });
  res.status(200).json({ status: true, data: subcategories });
});

const createSubcategory = catchAsync(async (req, res, next) => {
  const { error, value } = subcategorySchema.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 400));
  const subcategory = await adminService.createSubcategory(value);
  res.status(201).json({ status: true, message: "Subcategory created", data: subcategory });
});

const updateSubcategory = catchAsync(async (req, res, next) => {
  const { error, value } = subcategoryUpdateSchema.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 400));
  const subcategory = await adminService.updateSubcategory(req.params.id, value);
  res.status(200).json({ status: true, message: "Subcategory updated", data: subcategory });
});

const deleteSubcategory = catchAsync(async (req, res, next) => {
  const result = await adminService.deleteSubcategory(req.params.id);
  res.status(200).json({ status: true, message: result.message });
});

// ==================== SERVICES ====================

const listServices = catchAsync(async (req, res, next) => {
  const result = await adminService.listServices({
    categoryId: req.query.categoryId,
    search: req.query.search,
    cityId: req.query.cityId ? parseInt(req.query.cityId) : null,
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 20,
  });
  res.status(200).json({ status: true, data: result.data, pagination: result.pagination });
});

const createService = catchAsync(async (req, res, next) => {
  const { error, value } = serviceSchema.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 400));
  const service = await adminService.createService(value);
  res.status(201).json({ status: true, message: "Service created", data: service });
});

const updateService = catchAsync(async (req, res, next) => {
  const { error, value } = serviceUpdateSchema.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 400));
  const service = await adminService.updateService(req.params.id, value);
  res.status(200).json({ status: true, message: "Service updated", data: service });
});

const deleteService = catchAsync(async (req, res, next) => {
  const result = await adminService.deleteService(req.params.id);
  res.status(200).json({ status: true, message: result.message });
});

const reorderServices = catchAsync(async (req, res, next) => {
  const { error, value } = reorderServicesSchema.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 400));
  await adminService.reorderServices(value.categoryId, value.order);
  res.status(200).json({ status: true, message: "Service order updated" });
});

const patchServiceCitySchema = Joi.object({
  isActive: Joi.boolean(),
  customPrice: Joi.number().positive().allow(null, ""),
}).min(1);

const patchServiceCity = catchAsync(async (req, res, next) => {
  const { id, cityId } = req.params;
  const { error, value } = patchServiceCitySchema.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 400));
  const result = await adminService.toggleServiceCityStatus(id, cityId, value.isActive, value.customPrice);
  res.status(200).json({ status: true, data: result });
});

// ==================== BOOKINGS ====================

const createBookingForCustomer = catchAsync(async (req, res, next) => {
  const { error, value } = adminCreateBookingSchema.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 400));

  const now = Date.now();
  const scheduledMs = new Date(value.scheduledAt).getTime();
  if (scheduledMs < now + 60 * 60 * 1000) {
    return next(new AppError("Booking must be scheduled at least 1 hour from now", 400));
  }
  if (scheduledMs > now + 30 * 24 * 60 * 60 * 1000) {
    return next(new AppError("Booking cannot be scheduled more than 1 month in advance", 400));
  }
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(scheduledMs + IST_OFFSET_MS);
  const istMinutesOfDay = istDate.getUTCHours() * 60 + istDate.getUTCMinutes();
  if (istMinutesOfDay < 8 * 60 || istMinutesOfDay > 20 * 60) {
    return next(new AppError("Bookings are only available between 8 AM and 8 PM. Please choose a slot in that window.", 400));
  }

  const booking = await adminService.createBookingForCustomer(req.admin.userId, value);
  res.status(201).json({ status: true, message: "Booking created successfully", data: booking });
});

const listBookings = catchAsync(async (req, res, next) => {
  let cityIds = parseCityIds(req.query.cityIds) ?? (req.query.cityId ? [parseInt(req.query.cityId)] : null);
  if (req.admin.allowedZones?.length && req.admin.role !== "super_admin") {
    const zoneCityIds = await adminService.resolveZoneCityIds(req.admin.allowedZones);
    if (zoneCityIds) cityIds = cityIds ? cityIds.filter(id => zoneCityIds.includes(id)) : zoneCityIds;
  }
  const result = await adminService.listBookings({
    status: req.query.status,
    userId: req.query.userId,
    partnerId: req.query.partnerId,
    cityIds,
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 10,
  });
  res.status(200).json({ status: true, data: result.data, pagination: result.pagination });
});

const getBookingDetail = catchAsync(async (req, res, next) => {
  const booking = await adminService.getBookingDetail(req.params.id);
  res.status(200).json({ status: true, data: booking });
});

const assignPartner = catchAsync(async (req, res, next) => {
  const { partnerId } = req.body;
  if (!partnerId) return next(new AppError("partnerId is required", 400));
  const booking = await adminService.assignPartner(req.params.id, partnerId);
  res.status(200).json({ status: true, message: "Partner assigned", data: booking });
});

const cancelBooking = catchAsync(async (req, res, next) => {
  const booking = await adminService.cancelBooking(req.params.id);
  res.status(200).json({ status: true, message: "Booking cancelled", data: booking });
});

const acceptBooking = catchAsync(async (req, res, next) => {
  const booking = await adminService.acceptBooking(req.params.id);
  res.status(200).json({ status: true, message: "Booking accepted", data: booking });
});

const rescheduleBookingSchema = Joi.object({
  scheduledAt: Joi.date().required(),
  reason: Joi.string().trim().max(500).allow("", null),
});

const rescheduleBooking = catchAsync(async (req, res, next) => {
  const { error, value } = rescheduleBookingSchema.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 400));

  const now = Date.now();
  const scheduledMs = new Date(value.scheduledAt).getTime();
  if (scheduledMs < now + 60 * 60 * 1000) {
    return next(new AppError("Booking must be rescheduled at least 1 hour from now", 400));
  }
  if (scheduledMs > now + 30 * 24 * 60 * 60 * 1000) {
    return next(new AppError("Booking cannot be rescheduled more than 1 month in advance", 400));
  }

  const booking = await adminService.rescheduleBooking(req.params.id, value.scheduledAt, value.reason);
  res.status(200).json({ status: true, message: "Booking rescheduled", data: booking });
});

const editBookingServicesSchema = Joi.object({
  services: Joi.array().items(
    Joi.alternatives().try(
      Joi.object({
        id: Joi.number().integer().min(1).required(),
        qty: Joi.number().integer().min(1).default(1),
      }),
      Joi.object({
        isAddOn: Joi.boolean().valid(true).required(),
        name: Joi.string().trim().min(1).max(120).required(),
        price: Joi.number().min(0).required(),
        qty: Joi.number().integer().min(1).default(1),
      })
    )
  ).optional().default([]),
  removeIndices: Joi.array().items(Joi.number().integer().min(0)).optional().default([]),
  updateQty: Joi.array().items(
    Joi.object({
      index: Joi.number().integer().min(0).required(),
      qty: Joi.number().integer().min(1).required(),
    })
  ).optional().default([]),
});

const editBookingServices = catchAsync(async (req, res, next) => {
  const { error, value } = editBookingServicesSchema.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 400));
  if (!value.services.length && !value.removeIndices.length && !value.updateQty.length)
    return next(new AppError("Provide services to add, indices to remove, or quantities to update", 400));
  const booking = await adminService.editBookingServices(req.params.id, value.services, value.removeIndices, value.updateQty);
  res.status(200).json({ status: true, message: "Booking services updated", data: booking });
});

const removeBookingPackage = catchAsync(async (req, res, next) => {
  const booking = await adminService.removeBookingPackage(req.params.id, req.body?.packageId);
  res.status(200).json({ status: true, message: "Package removed from booking", data: booking });
});

const addBookingPackageSchema = Joi.object({
  packageId: Joi.number().integer().positive().required(),
  qty: Joi.number().integer().min(1).max(5).default(1),
  services: Joi.array().items(Joi.object({
    id: Joi.alternatives().try(Joi.number(), Joi.string()).required(),
    qty: Joi.number().integer().min(1).max(5).default(1),
  })).min(1).required(),
});

const addBookingPackage = catchAsync(async (req, res, next) => {
  const { error, value } = addBookingPackageSchema.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 400));
  const booking = await adminService.addBookingPackage(req.params.id, value.packageId, value.qty, value.services);
  res.status(200).json({ status: true, message: "Package added to booking", data: booking });
});

// ==================== SETTLEMENTS ====================

const listPartnerBalances = catchAsync(async (req, res, next) => {
  let cityIds = parseCityIds(req.query.cityIds) ?? (req.query.cityId ? [parseInt(req.query.cityId)] : null);
  if (req.admin.allowedZones?.length && req.admin.role !== "super_admin") {
    const zoneCityIds = await adminService.resolveZoneCityIds(req.admin.allowedZones);
    if (zoneCityIds) cityIds = cityIds ? cityIds.filter(id => zoneCityIds.includes(id)) : zoneCityIds;
  }
  const result = await settlementsService.listPartnerBalances({
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 20,
    search: req.query.search,
    cityIds,
  });
  res.status(200).json({ status: true, data: result.data, pagination: result.pagination });
});

const getPartnerLedger = catchAsync(async (req, res, next) => {
  const result = await settlementsService.getPartnerLedger(req.params.partnerId, {
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 20,
  });
  res.status(200).json({ status: true, data: result });
});

const recordSettlementSchema = Joi.object({
  type: Joi.string().valid("payout", "collection").required(),
  amount: Joi.number().positive().required(),
  method: Joi.string().trim().max(30).allow("", null),
  note: Joi.string().trim().max(500).allow("", null),
});

const recordSettlement = catchAsync(async (req, res, next) => {
  const { error, value } = recordSettlementSchema.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 400));
  const settlement = await settlementsService.recordSettlement(req.admin.userId, req.params.partnerId, value);
  res.status(201).json({ status: true, message: "Settlement recorded", data: settlement });
});

const voidLedgerEntry = catchAsync(async (req, res, next) => {
  const reversal = await settlementsService.voidLedgerEntry(req.admin.userId, req.params.id, req.body?.reason);
  res.status(200).json({ status: true, message: "Ledger entry voided", data: reversal });
});

const patchService = catchAsync(async (req, res, next) => {
  const { error, value } = patchServiceSchema.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 400));
  const service = await adminService.updateService(req.params.id, value);
  res.status(200).json({ status: true, message: "Service updated", data: service });
});

const listEarnings = catchAsync(async (req, res, next) => {
  const result = await adminService.listEarnings({
    cityIds: parseCityIds(req.query.cityIds) ?? (req.query.cityId ? [parseInt(req.query.cityId)] : null),
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 20,
  });
  res.status(200).json({ status: true, data: result.data, pagination: result.pagination });
});

const saveSettings = catchAsync(async (req, res, next) => {
  const section = String(req.params.section || "").trim();
  if (!section) return next(new AppError("Settings section is required", 400));

  await AdminSetting.upsert({ section, value: req.body ?? {} });
  res.status(200).json({ status: true, message: "Settings saved" });
});

const getSettings = catchAsync(async (req, res, next) => {
  const rows = await AdminSetting.findAll();
  const settings = {};
  rows.forEach((row) => { settings[row.section] = row.value; });
  res.status(200).json({ status: true, data: settings });
});

// ==================== COUPONS ====================

const listCoupons = catchAsync(async (req, res, next) => {
  const result = await adminService.listCoupons({
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 20,
  });
  res.status(200).json({ status: true, data: result.data, pagination: result.pagination });
});

const createCoupon = catchAsync(async (req, res, next) => {
  const { error, value } = couponSchema.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 400));
  const coupon = await adminService.createCoupon(value, req.admin.userId);
  res.status(201).json({ status: true, message: "Coupon created", data: coupon });
});

const updateCoupon = catchAsync(async (req, res, next) => {
  const { error, value } = updateCouponSchema.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 400));
  const coupon = await adminService.updateCoupon(req.params.id, value);
  res.status(200).json({ status: true, message: "Coupon updated", data: coupon });
});

const deleteCoupon = catchAsync(async (req, res, next) => {
  const result = await adminService.deleteCoupon(req.params.id);
  res.status(200).json({ status: true, message: result.message });
});

const getReferral = catchAsync(async (req, res, next) => {
  const program = await adminService.getReferralProgram();
  res.status(200).json({ status: true, data: program });
});

const updateReferral = catchAsync(async (req, res, next) => {
  const program = await adminService.updateReferralProgram(req.body);
  res.status(200).json({ status: true, message: "Referral program updated", data: program });
});

// ==================== REVIEWS ====================

const listReviews = catchAsync(async (req, res, next) => {
  const result = await adminService.listReviews({
    status: req.query.status,
    partnerId: req.query.partnerId,
    cityId: req.query.cityId ? parseInt(req.query.cityId) : null,
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 20,
  });
  res.status(200).json({ status: true, data: result.data, pagination: result.pagination });
});

const updateReviewStatus = catchAsync(async (req, res, next) => {
  const { status } = req.body;
  if (!["visible", "hidden"].includes(status)) {
    return next(new AppError("Status must be visible or hidden", 400));
  }
  const review = await adminService.updateReviewStatus(req.params.id, status);
  res.status(200).json({ status: true, message: "Review status updated", data: review });
});

// ==================== NOTIFICATIONS ====================

const listNotifications = catchAsync(async (req, res, next) => {
  const result = await adminService.listNotifications({
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 20,
  });
  res.status(200).json({ status: true, data: result.data, pagination: result.pagination });
});

const broadcastNotification = catchAsync(async (req, res, next) => {
  const { error, value } = broadcastSchema.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 400));

  let cityIds = value.cityIds?.length ? value.cityIds : null;
  if (req.admin.allowedZones?.length && req.admin.role !== "super_admin") {
    const zoneCityIds = await adminService.resolveZoneCityIds(req.admin.allowedZones);
    if (zoneCityIds) {
      cityIds = cityIds ? cityIds.filter(id => zoneCityIds.includes(id)) : zoneCityIds;
      if (!cityIds.length) return next(new AppError("None of the selected cities are within your allowed zones", 400));
    }
  }

  const result = await adminService.broadcastNotification({ ...value, cityIds });
  res.status(200).json({ status: true, message: result.message, data: { ...result.pushResult, id: result.logEntry.id, sentAt: result.logEntry.sentAt } });
});

// ==================== ADMIN USERS ====================

const listAdminUsers = catchAsync(async (req, res, next) => {
  const result = await adminService.listAdminUsers({
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 20,
  });
  res.status(200).json({ status: true, data: result.data, pagination: result.pagination });
});

const createAdminUser = catchAsync(async (req, res, next) => {
  const { error, value } = createAdminUserSchema.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 400));
  const admin = await adminService.createAdminUser(value, req.admin.userId);
  res.status(201).json({ status: true, message: "Admin user created", data: admin });
});

const updateAdminUser = catchAsync(async (req, res, next) => {
  const { error, value } = updateAdminUserSchema.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 400));
  const admin = await adminService.updateAdminUser(req.params.id, value);
  res.status(200).json({ status: true, message: "Admin user updated", data: admin });
});

const deleteAdminUser = catchAsync(async (req, res, next) => {
  const result = await adminService.deleteAdminUser(req.params.id, req.admin.userId);
  res.status(200).json({ status: true, message: result.message });
});

// ==================== FEEDBACK ====================

const listFeedback = catchAsync(async (req, res, next) => {
  let cityIds = parseCityIds(req.query.cityIds) ?? (req.query.cityId ? [parseInt(req.query.cityId)] : null);
  if (req.admin.allowedZones?.length && req.admin.role !== "super_admin") {
    const zoneCityIds = await adminService.resolveZoneCityIds(req.admin.allowedZones);
    if (zoneCityIds) cityIds = cityIds ? cityIds.filter(id => zoneCityIds.includes(id)) : zoneCityIds;
  }
  const result = await adminService.listFeedback({
    status: req.query.status,
    type: req.query.type,
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 20,
    cityIds,
  });
  res.status(200).json({ status: true, data: result.data, pagination: result.pagination });
});

const updateFeedbackStatus = catchAsync(async (req, res, next) => {
  const { status, adminNotes } = req.body;
  if (!["new", "reviewed", "resolved"].includes(status)) {
    return next(new AppError("Status must be new, reviewed, or resolved", 400));
  }
  const feedback = await adminService.updateFeedbackStatus(req.params.id, status, adminNotes);
  res.status(200).json({ status: true, message: "Feedback status updated", data: feedback });
});

// ==================== BANNERS ====================

// type identifies the fixed site/app slot this banner's image fills — one active
// row per type is used (hero = website homepage banner, custom_package/combo = the
// two CTA cards on the app + website). Everything below image/isActive is legacy from
// an earlier design and stays optional so old rows still validate.
const bannerSchema = Joi.object({
  type:          Joi.string().valid("hero", "custom_package", "combo", "why_beyomo", "book_steps").required(),
  title:         Joi.string().trim().allow("", null),
  subtitle:      Joi.string().trim().allow("", null),
  description:   Joi.string().trim().allow("", null),
  image:         Joi.string().allow("", null),
  image2:        Joi.string().allow("", null),
  image3:        Joi.string().allow("", null),
  gradientStart: Joi.string().allow("", null),
  gradientEnd:   Joi.string().allow("", null),
  buttonText:    Joi.string().allow("", null),
  targetScreen:  Joi.string().allow("", null),
  targetParam:   Joi.string().allow("", null),
  isActive:      Joi.boolean().default(true),
  sortOrder:     Joi.number().default(0),
});

const listBanners = catchAsync(async (req, res) => {
  const data = await adminService.listBanners();
  res.status(200).json({ status: true, data });
});

const createBanner = catchAsync(async (req, res, next) => {
  const { error, value } = bannerSchema.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 400));
  const data = await adminService.createBanner(value);
  res.status(201).json({ status: true, data });
});

const updateBanner = catchAsync(async (req, res, next) => {
  const { error, value } = bannerSchema.fork(Object.keys(bannerSchema.describe().keys), f => f.optional()).validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 400));
  const data = await adminService.updateBanner(req.params.id, value);
  res.status(200).json({ status: true, data });
});

const deleteBanner = catchAsync(async (req, res) => {
  await adminService.deleteBanner(req.params.id);
  res.status(200).json({ status: true, message: "Banner deleted" });
});

// ==================== ZONES ====================

const zoneSchema = Joi.object({
  name:        Joi.string().trim().required(),
  description: Joi.string().trim().allow("", null),
  cityIds:     Joi.array().items(Joi.number().integer()).default([]),
  cities:      Joi.array().items(Joi.string()).default([]),
  pincodes:    Joi.array().items(Joi.string()).default([]),
  isActive:    Joi.boolean().default(true),
});

const listZones = catchAsync(async (req, res) => {
  const data = await adminService.listZones();
  res.status(200).json({ status: true, data });
});

const createZone = catchAsync(async (req, res, next) => {
  const { error, value } = zoneSchema.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 400));
  const data = await adminService.createZone(value);
  res.status(201).json({ status: true, data });
});

const updateZone = catchAsync(async (req, res, next) => {
  const { error, value } = zoneSchema.fork(Object.keys(zoneSchema.describe().keys), f => f.optional()).validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 400));
  const data = await adminService.updateZone(req.params.id, value);
  res.status(200).json({ status: true, data });
});

const deleteZone = catchAsync(async (req, res) => {
  await adminService.deleteZone(req.params.id);
  res.status(200).json({ status: true, message: "Zone deleted" });
});

// ==================== CITIES ====================

const citySchema = Joi.object({
  name:     Joi.string().trim().required(),
  code:     Joi.string().trim().uppercase().min(2).max(5).allow("", null),
  state:    Joi.string().trim().allow("", null),
  lat:      Joi.number().min(-90).max(90).allow(null),
  lng:      Joi.number().min(-180).max(180).allow(null),
  radius:   Joi.number().positive().allow(null).default(30),
  isActive: Joi.boolean().default(true),
});

const listCities = catchAsync(async (req, res) => {
  const data = await adminService.listCities();
  res.status(200).json({ status: true, data });
});

const createCity = catchAsync(async (req, res, next) => {
  const { error, value } = citySchema.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 400));
  const data = await adminService.createCity(value);
  res.status(201).json({ status: true, data });
});

const updateCity = catchAsync(async (req, res, next) => {
  const { error, value } = citySchema.fork(Object.keys(citySchema.describe().keys), f => f.optional()).validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 400));
  const data = await adminService.updateCity(req.params.id, value);
  res.status(200).json({ status: true, data });
});

const deleteCity = catchAsync(async (req, res) => {
  await adminService.deleteCity(req.params.id);
  res.status(200).json({ status: true, message: "City deleted" });
});

// ==================== DEVICE TOKEN / PUSH NOTIFICATION TEST ====================

const updateAdminDeviceToken = catchAsync(async (req, res, next) => {
  const { fcmToken } = req.body;
  if (!fcmToken) return next(new AppError("fcmToken is required", 400));
  await AdminUser.update({ fcmToken }, { where: { id: req.admin.userId } });
  res.status(200).json({ status: true, message: "Device token updated" });
});

const testPushNotification = catchAsync(async (req, res, next) => {
  const {
    target = "all",
    title = "Test Notification",
    body = "Push notifications are working! 🎉",
  } = req.body;

  const validTargets = ["users", "partners", "admins", "all"];
  if (!validTargets.includes(target)) {
    return next(new AppError("target must be one of: users, partners, admins, all", 400));
  }

  const results = {};

  if (target === "users" || target === "all") {
    const rows = await User.findAll({ attributes: ["fcmToken", "deviceTokens"] });
    const tokens = [...new Set(
      rows.flatMap(u => [u.fcmToken, ...(Array.isArray(u.deviceTokens) ? u.deviceTokens : [])])
          .filter(Boolean)
    )];
    results.users = tokens.length
      ? await sendPushNotification(tokens, title, body, { type: "test" })
      : { skipped: true, reason: "no registered tokens" };
  }

  if (target === "partners" || target === "all") {
    const rows = await Partner.findAll({ attributes: ["fcmToken", "deviceTokens"] });
    const tokens = [...new Set(
      rows.flatMap(p => [p.fcmToken, ...(Array.isArray(p.deviceTokens) ? p.deviceTokens : [])])
          .filter(Boolean)
    )];
    results.partners = tokens.length
      ? await sendPushNotification(tokens, title, body, { type: "test" })
      : { skipped: true, reason: "no registered tokens" };
  }

  if (target === "admins" || target === "all") {
    const rows = await AdminUser.findAll({ attributes: ["fcmToken"] });
    const tokens = [...new Set(rows.map(a => a.fcmToken).filter(Boolean))];
    results.admins = tokens.length
      ? await sendPushNotification(tokens, title, body, { type: "test" })
      : { skipped: true, reason: "no registered tokens" };
  }

  res.status(200).json({ status: true, message: "Test notification dispatched", results });
});

// ==================== OFFERS ====================
const offerSchema = Joi.object({
  title:        Joi.string().trim().required(),
  description:  Joi.string().trim().allow("", null),
  image:        Joi.string().trim().allow("", null),
  triggerType:  Joi.string().valid("min_spend", "specific_services", "min_count", "category").required(),
  triggerValue: Joi.object().required(),
  freeServiceId: Joi.number().integer().required(),
  validFrom:    Joi.date().required(),
  validTill:    Joi.date().required(),
  isActive:     Joi.boolean().default(true),
  cityId:       Joi.number().integer().allow(null),
  maxUses:      Joi.number().integer().allow(null),
  createdBy:    Joi.number().integer().allow(null),
  adminPercent:   Joi.number().min(0).max(100),
  partnerPercent: Joi.number().min(0).max(100),
  gstPercent:     Joi.number().min(0).max(100),
});

const listOffersHandler = catchAsync(async (req, res) => {
  const page  = parseInt(req.query.page)  || 1;
  const limit = parseInt(req.query.limit) || 20;
  let cityIds = parseCityIds(req.query.cityIds) ?? (req.query.cityId ? [parseInt(req.query.cityId)] : null);
  if (req.admin.allowedZones?.length && req.admin.role !== "super_admin") {
    const zoneCityIds = await adminService.resolveZoneCityIds(req.admin.allowedZones);
    if (zoneCityIds) cityIds = cityIds ? cityIds.filter(id => zoneCityIds.includes(id)) : zoneCityIds;
  }
  const result = await adminService.listOffers({ page, limit, cityIds });
  res.json({ status: true, data: result });
});

const createOfferHandler = catchAsync(async (req, res) => {
  const { error, value } = offerSchema.validate(req.body);
  if (error) return res.status(400).json({ status: false, message: error.details[0].message });
  value.createdBy = req.admin?.id ?? null;
  const offer = await adminService.createOffer(value);
  res.status(201).json({ status: true, data: offer });
});

const updateOfferHandler = catchAsync(async (req, res) => {
  const offer = await adminService.updateOffer(req.params.id, req.body);
  res.json({ status: true, data: offer });
});

const deleteOfferHandler = catchAsync(async (req, res) => {
  await adminService.deleteOffer(req.params.id);
  res.json({ status: true, message: "Offer deleted" });
});

// ── Packages ──────────────────────────────────────────────────────────────────
const packagesService = require("../../../packages/services/v1/packages.service");

const listPackagesHandler = catchAsync(async (req, res) => {
  const page  = parseInt(req.query.page)  || 1;
  const limit = parseInt(req.query.limit) || 20;
  let cityIds = parseCityIds(req.query.cityIds) ?? (req.query.cityId ? [parseInt(req.query.cityId)] : null);
  if (req.admin.allowedZones?.length && req.admin.role !== "super_admin") {
    const zoneCityIds = await adminService.resolveZoneCityIds(req.admin.allowedZones);
    if (zoneCityIds) cityIds = cityIds ? cityIds.filter(id => zoneCityIds.includes(id)) : zoneCityIds;
  }
  const result = await packagesService.listAll({ page, limit, cityIds });
  res.json({
    status: true,
    data: result.data,
    pagination: { total: result.total, page, limit, totalPages: Math.ceil(result.total / limit) },
  });
});

const createPackageHandler = catchAsync(async (req, res) => {
  const pkg = await packagesService.createPackage(req.body);
  res.status(201).json({ status: true, data: pkg });
});

const updatePackageHandler = catchAsync(async (req, res) => {
  const pkg = await packagesService.updatePackage(req.params.id, req.body);
  res.json({ status: true, data: pkg });
});

const deletePackageHandler = catchAsync(async (req, res) => {
  await packagesService.deletePackage(req.params.id);
  res.json({ status: true, message: "Package deleted" });
});

module.exports = {
  login, logout, devAdminHints,
  listUsers, getUserById, updateUserStatus, deleteUser, createUser,
  listPartners, getPartnerById, updatePartnerStatus, createPartner, updatePartner,
  listCategories, createCategory, updateCategory, deleteCategory, reorderCategories,
  listSubcategories, createSubcategory, updateSubcategory, deleteSubcategory,
  listServices, createService, updateService, deleteService, patchService, patchServiceCity, reorderServices,
  createBookingForCustomer,
  listBookings, getBookingDetail, assignPartner, acceptBooking, cancelBooking, rescheduleBooking, editBookingServices, removeBookingPackage, addBookingPackage,
  listPartnerBalances, getPartnerLedger, recordSettlement, voidLedgerEntry,
  listCoupons, createCoupon, updateCoupon, deleteCoupon, getReferral, updateReferral,
  listReviews, updateReviewStatus,
  listNotifications, broadcastNotification,
  listAdminUsers, createAdminUser, updateAdminUser, deleteAdminUser,
  listFeedback, updateFeedbackStatus,
  listEarnings, saveSettings, getSettings,
  listBanners, createBanner, updateBanner, deleteBanner,
  listZones, createZone, updateZone, deleteZone,
  listCities, createCity, updateCity, deleteCity,
  updateAdminDeviceToken, testPushNotification,
  listOffersHandler, createOfferHandler, updateOfferHandler, deleteOfferHandler,
  listPackagesHandler, createPackageHandler, updatePackageHandler, deletePackageHandler,
};
