const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../utils/dbconnect");

const PartnerSkillCategory = sequelize.define("PartnerSkillCategory", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  partnerId: { type: DataTypes.INTEGER, allowNull: false },
  skillCategoryId: { type: DataTypes.INTEGER, allowNull: false },
}, {
  timestamps: false,
  tableName: "partner_skill_categories",
  indexes: [{ unique: true, fields: ["partnerId", "skillCategoryId"] }],
});

module.exports = PartnerSkillCategory;
