const catchAsync = require("../../../../utils/errorHandlers/catchAsync");
const AppError = require("../../../../utils/errorHandlers/appError");
const appVersionService = require("../../services/v1/appVersion.service");

// GET /api/v1/app-version?app=user&platform=android — public, checked at splash
const getVersionConfig = catchAsync(async (req, res, next) => {
  const { app, platform } = req.query;
  if (!["user", "partner"].includes(app) || !["android", "ios"].includes(platform)) {
    return next(new AppError("app must be 'user'|'partner' and platform must be 'android'|'ios'", 400));
  }
  const data = await appVersionService.getVersionConfig(app, platform);
  res.json({ status: true, data });
});

// GET /api/v1/admin/app-versions
const adminListVersions = catchAsync(async (req, res) => {
  const data = await appVersionService.listAll();
  res.json({ status: true, data });
});

// PUT /api/v1/admin/app-versions
const adminUpsertVersion = catchAsync(async (req, res, next) => {
  const { app, platform } = req.body;
  if (!["user", "partner"].includes(app) || !["android", "ios"].includes(platform)) {
    return next(new AppError("app must be 'user'|'partner' and platform must be 'android'|'ios'", 400));
  }
  const data = await appVersionService.upsert(req.body);
  res.json({ status: true, data });
});

module.exports = { getVersionConfig, adminListVersions, adminUpsertVersion };
