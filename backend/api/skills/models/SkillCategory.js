const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../utils/dbconnect");

const SkillCategory = sequelize.define("SkillCategory", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  sortOrder: { type: DataTypes.INTEGER, defaultValue: 0 },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  timestamps: true,
  tableName: "skill_categories",
});

module.exports = SkillCategory;
