const SkillCategory = require("../../models/SkillCategory");
const Skill = require("../../models/Skill");
const AppError = require("../../../../utils/errorHandlers/appError");

const getActiveCategories = async () => {
  return SkillCategory.findAll({
    where: { isActive: true },
    order: [["sortOrder", "ASC"], ["name", "ASC"]],
    include: [{
      model: Skill,
      as: "skills",
      where: { isActive: true },
      required: false,
      order: [["name", "ASC"]],
    }],
  });
};

const getAllCategories = async () => {
  return SkillCategory.findAll({
    order: [["sortOrder", "ASC"], ["name", "ASC"]],
    include: [{
      model: Skill,
      as: "skills",
      required: false,
      order: [["name", "ASC"]],
    }],
  });
};

const createCategory = async ({ name, sortOrder = 0 }) => {
  return SkillCategory.create({ name, sortOrder });
};

const updateCategory = async (id, data) => {
  const cat = await SkillCategory.findByPk(id);
  if (!cat) throw new AppError("Skill category not found", 404);
  await cat.update(data);
  return SkillCategory.findByPk(id, {
    include: [{ model: Skill, as: "skills", required: false, order: [["name", "ASC"]] }],
  });
};

const deleteCategory = async (id) => {
  const cat = await SkillCategory.findByPk(id);
  if (!cat) throw new AppError("Skill category not found", 404);
  await Skill.destroy({ where: { skillCategoryId: id } });
  await cat.destroy();
};

const createSkill = async (skillCategoryId, { name }) => {
  const cat = await SkillCategory.findByPk(skillCategoryId);
  if (!cat) throw new AppError("Skill category not found", 404);
  return Skill.create({ skillCategoryId, name });
};

const updateSkill = async (id, data) => {
  const skill = await Skill.findByPk(id);
  if (!skill) throw new AppError("Skill not found", 404);
  await skill.update(data);
  return skill;
};

const deleteSkill = async (id) => {
  const skill = await Skill.findByPk(id);
  if (!skill) throw new AppError("Skill not found", 404);
  await skill.destroy();
};

module.exports = {
  getActiveCategories, getAllCategories,
  createCategory, updateCategory, deleteCategory,
  createSkill, updateSkill, deleteSkill,
};
