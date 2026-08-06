const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../utils/dbconnect");

const Service = sequelize.define("Service", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  categoryId: { type: DataTypes.INTEGER, allowNull: false },
  name: { type: DataTypes.STRING(150), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  basePrice: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  duration: { type: DataTypes.INTEGER, defaultValue: 60 },
  tags: { type: DataTypes.JSON, defaultValue: [] },
  image: { type: DataTypes.TEXT, allowNull: true, defaultValue: null },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  sortOrder: { type: DataTypes.INTEGER, defaultValue: 0 },
}, {
  timestamps: true,
  tableName: "services",
});

module.exports = Service;

