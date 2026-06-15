const catchAsync = require("../../../../utils/errorHandlers/catchAsync");
const AppError = require("../../../../utils/errorHandlers/appError");
const skillsService = require("../../services/v1/skills.service");

// Public
const getCategories = catchAsync(async (req, res) => {
  const data = await skillsService.getActiveCategories();
  res.status(200).json({ status: true, data });
});

// Admin
const adminGetCategories = catchAsync(async (req, res) => {
  const data = await skillsService.getAllCategories();
  res.status(200).json({ status: true, data });
});

const adminCreateCategory = catchAsync(async (req, res, next) => {
  const { name, sortOrder } = req.body;
  if (!name?.trim()) return next(new AppError("name is required", 400));
  const data = await skillsService.createCategory({ name: name.trim(), sortOrder: sortOrder || 0 });
  res.status(201).json({ status: true, data });
});

const adminUpdateCategory = catchAsync(async (req, res) => {
  const { id } = req.params;
  const data = await skillsService.updateCategory(id, req.body);
  res.status(200).json({ status: true, data });
});

const adminDeleteCategory = catchAsync(async (req, res) => {
  await skillsService.deleteCategory(req.params.id);
  res.status(200).json({ status: true, message: "Category deleted" });
});

const adminCreateSkill = catchAsync(async (req, res, next) => {
  const { name } = req.body;
  if (!name?.trim()) return next(new AppError("name is required", 400));
  const data = await skillsService.createSkill(req.params.catId, { name: name.trim() });
  res.status(201).json({ status: true, data });
});

const adminUpdateSkill = catchAsync(async (req, res) => {
  const data = await skillsService.updateSkill(req.params.id, req.body);
  res.status(200).json({ status: true, data });
});

const adminDeleteSkill = catchAsync(async (req, res) => {
  await skillsService.deleteSkill(req.params.id);
  res.status(200).json({ status: true, message: "Skill deleted" });
});

module.exports = {
  getCategories,
  adminGetCategories, adminCreateCategory, adminUpdateCategory, adminDeleteCategory,
  adminCreateSkill, adminUpdateSkill, adminDeleteSkill,
};
