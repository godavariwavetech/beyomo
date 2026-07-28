const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const adminAuthenticate = require("../../../../utils/adminAuthenticate");
const config = require("../../../../config");

const uploadsDir = path.join(__dirname, "../../../../uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const publicDir = path.join(__dirname, "../../../../public");
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    (/^image\/(jpeg|jpg|png|webp)$/.test(file.mimetype) || file.mimetype === "application/pdf")
      ? cb(null, true)
      : cb(new Error("Only JPEG, PNG, WebP images or PDF files allowed"));
  },
});

// Multer for PDF agreement upload (saved directly as agreement.pdf in public/)
const agreementUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, publicDir),
    filename: (req, file, cb) => cb(null, "agreement.pdf"),
  }),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    file.mimetype === "application/pdf"
      ? cb(null, true)
      : cb(new Error("Only PDF files allowed"));
  },
});
const {
  login, logout, devAdminHints,
  listBanners, createBanner, updateBanner, deleteBanner,
  listZones, createZone, updateZone, deleteZone,
  listCities, createCity, updateCity, deleteCity,
  listUsers, getUserById, updateUserStatus, deleteUser, createUser,
  listPartners, getPartnerById, updatePartnerStatus, createPartner, updatePartner,
  listCategories, createCategory, updateCategory, deleteCategory,
  listServices, createService, updateService, deleteService, patchService, patchServiceCity,
  listBookings, getBookingDetail, assignPartner, cancelBooking, rescheduleBooking, editBookingServices,
  listPartnerBalances, getPartnerLedger, recordSettlement, voidLedgerEntry,
  listCoupons, createCoupon, updateCoupon, deleteCoupon, getReferral, updateReferral,
  listReviews, updateReviewStatus,
  listNotifications, broadcastNotification,
  listAdminUsers, createAdminUser, updateAdminUser, deleteAdminUser,
  listFeedback, updateFeedbackStatus,
  listEarnings, saveSettings,
  updateAdminDeviceToken, testPushNotification,
  listOffersHandler, createOfferHandler, updateOfferHandler, deleteOfferHandler,
  listPackagesHandler, createPackageHandler, updatePackageHandler, deletePackageHandler,
} = require("../../controllers/v1/admin.controller");

// File Upload
router.post("/upload", adminAuthenticate(), upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ status: false, message: "No file uploaded" });
  res.status(200).json({ status: true, url: `${config.PUBLIC_BASE_URL}/${req.file.filename}` });
});

// Agreement PDF upload/status
router.post("/settings/agreement", adminAuthenticate(["super_admin", "admin"]), agreementUpload.single("pdf"), (req, res) => {
  if (!req.file) return res.status(400).json({ status: false, message: "No PDF uploaded" });
  res.status(200).json({ status: true, message: "Agreement PDF updated successfully" });
});
router.get("/settings/agreement/status", adminAuthenticate(), (req, res) => {
  const exists = fs.existsSync(path.join(publicDir, "agreement.pdf"));
  res.status(200).json({ status: true, exists });
});

// Auth (no middleware on login)
router.post("/auth/login", login);
router.post("/auth/logout", adminAuthenticate(), logout);
router.get("/auth/dev-hints", devAdminHints);

// Users
router.get("/users", adminAuthenticate(), listUsers);
router.post("/users", adminAuthenticate(["super_admin", "admin"]), createUser);
router.get("/users/:id", adminAuthenticate(), getUserById);
router.patch("/users/:id/status", adminAuthenticate(["super_admin", "admin"]), updateUserStatus);
router.delete("/users/:id", adminAuthenticate(["super_admin", "admin"]), deleteUser);

// Partners
router.get("/partners", adminAuthenticate(), listPartners);
router.post("/partners", adminAuthenticate(["super_admin", "admin", "manager"]), createPartner);
router.get("/partners/:id", adminAuthenticate(), getPartnerById);
router.patch("/partners/:id/status", adminAuthenticate(["super_admin", "admin"]), updatePartnerStatus);
router.patch("/partners/:id", adminAuthenticate(["super_admin", "admin", "manager"]), updatePartner);

// Service Categories
router.get("/services/categories", adminAuthenticate(), listCategories);
router.post("/services/categories", adminAuthenticate(["super_admin", "admin", "manager"]), createCategory);
router.put("/services/categories/:id", adminAuthenticate(["super_admin", "admin", "manager"]), updateCategory);
router.delete("/services/categories/:id", adminAuthenticate(["super_admin", "admin"]), deleteCategory);

// Services
router.get("/services", adminAuthenticate(), listServices);
router.post("/services", adminAuthenticate(["super_admin", "admin", "manager"]), createService);
router.put("/services/:id", adminAuthenticate(["super_admin", "admin", "manager"]), updateService);
router.patch("/services/:id", adminAuthenticate(["super_admin", "admin", "manager"]), patchService);
router.patch("/services/:id/cities/:cityId", adminAuthenticate(["super_admin", "admin", "manager"]), patchServiceCity);
router.delete("/services/:id", adminAuthenticate(["super_admin", "admin"]), deleteService);

// Bookings
router.get("/bookings", adminAuthenticate(), listBookings);
router.get("/bookings/:id", adminAuthenticate(), getBookingDetail);
router.patch("/bookings/:id/assign", adminAuthenticate(["super_admin", "admin", "manager"]), assignPartner);
router.patch("/bookings/:id/cancel", adminAuthenticate(["super_admin", "admin", "manager"]), cancelBooking);
router.patch("/bookings/:id/reschedule", adminAuthenticate(["super_admin", "admin", "manager"]), rescheduleBooking);
router.patch("/bookings/:id/services", adminAuthenticate(["super_admin", "admin", "manager"]), editBookingServices);

// Settlements
router.get("/settlements/partners", adminAuthenticate(["super_admin", "admin"]), listPartnerBalances);
router.get("/settlements/partners/:partnerId", adminAuthenticate(["super_admin", "admin"]), getPartnerLedger);
router.post("/settlements/partners/:partnerId/settle", adminAuthenticate(["super_admin", "admin"]), recordSettlement);
router.patch("/settlements/entries/:id/void", adminAuthenticate(["super_admin", "admin"]), voidLedgerEntry);

// Coupons
router.get("/coupons", adminAuthenticate(), listCoupons);
router.post("/coupons", adminAuthenticate(["super_admin", "admin", "manager"]), createCoupon);
router.put("/coupons/:id", adminAuthenticate(["super_admin", "admin", "manager"]), updateCoupon);
router.delete("/coupons/:id", adminAuthenticate(["super_admin", "admin"]), deleteCoupon);
router.get("/referral", adminAuthenticate(), getReferral);
router.put("/referral", adminAuthenticate(["super_admin", "admin"]), updateReferral);

// Reviews
router.get("/reviews", adminAuthenticate(), listReviews);
router.patch("/reviews/:id/status", adminAuthenticate(["super_admin", "admin", "manager"]), updateReviewStatus);

// Notifications
router.get("/notifications", adminAuthenticate(), listNotifications);
router.post("/notifications/broadcast", adminAuthenticate(["super_admin", "admin"]), broadcastNotification);

// Admin Users (super_admin only)
router.get("/admin-users", adminAuthenticate(["super_admin"]), listAdminUsers);
router.post("/admin-users", adminAuthenticate(["super_admin"]), createAdminUser);
router.put("/admin-users/:id", adminAuthenticate(["super_admin"]), updateAdminUser);
router.delete("/admin-users/:id", adminAuthenticate(["super_admin"]), deleteAdminUser);

// Feedback
router.get("/feedback", adminAuthenticate(), listFeedback);
router.patch("/feedback/:id/status", adminAuthenticate(["super_admin", "admin", "manager"]), updateFeedbackStatus);

// Earnings (completed bookings)
router.get("/earnings", adminAuthenticate(), listEarnings);

// Settings (acknowledge saves — extend with DB later)
router.patch("/settings/:section", adminAuthenticate(["super_admin", "admin"]), saveSettings);

// Banners
router.get("/banners", adminAuthenticate(), listBanners);
router.post("/banners", adminAuthenticate(["super_admin", "admin", "manager"]), createBanner);
router.put("/banners/:id", adminAuthenticate(["super_admin", "admin", "manager"]), updateBanner);
router.delete("/banners/:id", adminAuthenticate(["super_admin", "admin"]), deleteBanner);

// Service Zones
router.get("/zones", adminAuthenticate(), listZones);
router.post("/zones", adminAuthenticate(["super_admin", "admin", "manager"]), createZone);
router.put("/zones/:id", adminAuthenticate(["super_admin", "admin", "manager"]), updateZone);
router.delete("/zones/:id", adminAuthenticate(["super_admin", "admin"]), deleteZone);

// Cities
router.get("/cities", adminAuthenticate(), listCities);
router.post("/cities", adminAuthenticate(["super_admin", "admin"]), createCity);
router.put("/cities/:id", adminAuthenticate(["super_admin", "admin"]), updateCity);
router.delete("/cities/:id", adminAuthenticate(["super_admin"]), deleteCity);

// Offers
router.get("/offers",      adminAuthenticate(), listOffersHandler);
router.post("/offers",     adminAuthenticate(["super_admin", "admin", "manager"]), createOfferHandler);
router.patch("/offers/:id", adminAuthenticate(["super_admin", "admin", "manager"]), updateOfferHandler);
router.delete("/offers/:id", adminAuthenticate(["super_admin", "admin"]), deleteOfferHandler);

// Packages
router.get("/packages",      adminAuthenticate(), listPackagesHandler);
router.post("/packages",     adminAuthenticate(["super_admin", "admin", "manager"]), createPackageHandler);
router.put("/packages/:id",  adminAuthenticate(["super_admin", "admin", "manager"]), updatePackageHandler);
router.delete("/packages/:id", adminAuthenticate(["super_admin", "admin"]), deletePackageHandler);

// Admin device token (for browser push notifications)
router.patch("/me/device-token", adminAuthenticate(), updateAdminDeviceToken);

// Test push notification
router.post("/test/push-notification", adminAuthenticate(["super_admin", "admin"]), testPushNotification);

module.exports = router;
