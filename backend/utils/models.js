// Load all models (registers them with Sequelize) and define associations
const User = require("../api/users/models/user.model");
const UserAddress = require("../api/users/models/userAddress.model");
const Partner = require("../api/partners/models/partner.model");
const PartnerService = require("../api/partners/models/partnerService.model");
const ServiceCategory = require("../api/services/models/serviceCategory.model");
const Service = require("../api/services/models/service.model");
const ServiceCityMap = require("../api/services/models/service_city_map.model");
const Booking = require("../api/bookings/models/booking.model");
const Otp = require("../api/auth/models/otp.model");
const Review = require("../api/reviews/models/review.model");
const Payment = require("../api/payments/models/payment.model");
const Notification = require("../api/notifications/models/notification.model");
const Coupon = require("../api/coupons/models/coupon.model");
const ReferralProgram = require("../api/coupons/models/referralProgram.model");
const AdminUser = require("../api/adminUsers/models/adminUser.model");
const AppFeedback = require("../api/feedback/models/feedback.model");
const Banner = require("../api/banners/models/banner.model");
const ServiceZone = require("../api/zones/models/zone.model");
const Offer = require("../api/offers/models/offer.model");
const City = require("../api/cities/models/city.model");
const ServicePackage = require("../api/packages/models/package.model");
const SkillCategory = require("../api/skills/models/SkillCategory");
const Skill = require("../api/skills/models/Skill");
const PartnerSkillCategory = require("../api/skills/models/PartnerSkillCategory");
const ContactInquiry = require("../api/contacts/models/contact.model");
const PartnerLedgerEntry = require("../api/settlements/models/partnerLedgerEntry.model");
const PartnerSettlement = require("../api/settlements/models/partnerSettlement.model");
const AdminSetting = require("../api/settings/models/adminSetting.model");

// ---- User associations ----
User.hasMany(UserAddress, { foreignKey: "userId", as: "addresses" });
UserAddress.belongsTo(User, { foreignKey: "userId", as: "user" });
User.belongsTo(User, { foreignKey: "referredById", as: "referrer" });

// ---- Partner associations ----
Partner.hasMany(PartnerService, { foreignKey: "partnerId", as: "services" });
PartnerService.belongsTo(Partner, { foreignKey: "partnerId" });
PartnerService.belongsTo(Service, { foreignKey: "serviceId", as: "service" });
PartnerService.belongsTo(ServiceCategory, { foreignKey: "categoryId", as: "category" });

// ---- Service associations ----
Service.belongsTo(ServiceCategory, { foreignKey: "categoryId", as: "category" });
ServiceCategory.hasMany(Service, { foreignKey: "categoryId", as: "services" });
Service.hasMany(ServiceCityMap, { foreignKey: "serviceId", as: "cityMappings" });
ServiceCityMap.belongsTo(Service, { foreignKey: "serviceId", as: "service" });

// ---- Booking associations ----
Booking.belongsTo(User, { foreignKey: "userId", as: "user" });
Booking.belongsTo(Partner, { foreignKey: "partnerId", as: "partner" });
Booking.belongsTo(Service, { foreignKey: "serviceId", as: "service" });
Booking.belongsTo(Coupon, { foreignKey: "couponId", as: "coupon" });
Booking.belongsTo(Offer, { foreignKey: "offerId", as: "offer" });
Booking.belongsTo(ServicePackage, { foreignKey: "packageId", as: "package" });
User.hasMany(Booking, { foreignKey: "userId", as: "bookings" });
Partner.hasMany(Booking, { foreignKey: "partnerId", as: "bookings" });

// ---- Payment associations ----
Payment.belongsTo(Booking, { foreignKey: "bookingId", as: "booking" });
Payment.belongsTo(User, { foreignKey: "userId", as: "user" });
Booking.hasOne(Payment, { foreignKey: "bookingId", as: "payment" });

// ---- Review associations ----
Booking.hasOne(Review, { foreignKey: "bookingId", as: "review" });
Review.belongsTo(Booking, { foreignKey: "bookingId", as: "booking" });
Review.belongsTo(User, { foreignKey: "userId", as: "user" });
Review.belongsTo(Partner, { foreignKey: "partnerId", as: "partner" });
Review.belongsTo(Service, { foreignKey: "serviceId", as: "service" });

// ---- Notification associations ----
Notification.belongsTo(User, { foreignKey: "userId", as: "user" });
Notification.belongsTo(Partner, { foreignKey: "partnerId", as: "partner" });

// ---- Feedback associations ----
AppFeedback.belongsTo(User, { foreignKey: "userId", as: "user" });

// ---- Admin associations ----
AdminUser.belongsTo(AdminUser, { foreignKey: "createdBy", as: "creator" });
Coupon.belongsTo(AdminUser, { foreignKey: "createdBy", as: "admin" });

// ---- Offer associations ----
Offer.belongsTo(Service, { foreignKey: "freeServiceId", as: "freeService" });

// ---- Skill associations ----
SkillCategory.hasMany(Skill, { foreignKey: "skillCategoryId", as: "skills" });
Skill.belongsTo(SkillCategory, { foreignKey: "skillCategoryId", as: "category" });
Partner.hasMany(PartnerSkillCategory, { foreignKey: "partnerId", as: "skillCategories" });
PartnerSkillCategory.belongsTo(Partner, { foreignKey: "partnerId" });
PartnerSkillCategory.belongsTo(SkillCategory, { foreignKey: "skillCategoryId", as: "skillCategory" });

// ---- Settlement associations ----
PartnerLedgerEntry.belongsTo(Partner, { foreignKey: "partnerId", as: "partner" });
PartnerLedgerEntry.belongsTo(Booking, { foreignKey: "bookingId", as: "booking" });
PartnerLedgerEntry.belongsTo(PartnerSettlement, { foreignKey: "settlementId", as: "settlement" });
PartnerSettlement.belongsTo(Partner, { foreignKey: "partnerId", as: "partner" });
PartnerSettlement.belongsTo(AdminUser, { foreignKey: "settledByAdminId", as: "settledBy" });
PartnerSettlement.hasMany(PartnerLedgerEntry, { foreignKey: "settlementId", as: "entries" });
Partner.hasMany(PartnerLedgerEntry, { foreignKey: "partnerId", as: "ledgerEntries" });
Partner.hasMany(PartnerSettlement, { foreignKey: "partnerId", as: "settlements" });

module.exports = {
  User, UserAddress, Partner, PartnerService,
  ServiceCategory, Service, ServiceCityMap,
  Booking, Otp, Review, Payment, Notification,
  Coupon, ReferralProgram, AdminUser, AppFeedback,
  Banner, ServiceZone, Offer,
  City, ServicePackage,
  SkillCategory, Skill, PartnerSkillCategory,
  ContactInquiry,
  PartnerLedgerEntry, PartnerSettlement,
  AdminSetting,
};
