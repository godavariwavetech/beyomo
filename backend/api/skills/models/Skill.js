const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../utils/dbconnect");

const Skill = sequelize.define("Skill", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  skillCategoryId: { type: DataTypes.INTEGER, allowNull: false },
  name: { type: DataTypes.STRING(100), allowNull: false },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  timestamps: true,
  tableName: "skills",
});

module.exports = Skill;
