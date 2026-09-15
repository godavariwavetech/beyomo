const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../utils/dbconnect");

const Service = sequelize.define("Service", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  categoryId: { type: DataTypes.INTEGER, allowNull: false },
  // Optional second level under the category (Waxing -> Honey / Rica). Nullable: a
  // service with no subcategory still lists normally under its category, which is
  // what every service created before subcategories existed relies on.
  subcategoryId: { type: DataTypes.INTEGER, allowNull: true, defaultValue: null },
  name: { type: DataTypes.STRING(150), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  basePrice: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  duration: { type: DataTypes.INTEGER, defaultValue: 60 },
  tags: { type: DataTypes.JSON, defaultValue: [] },
  image: { type: DataTypes.TEXT, allowNull: true, defaultValue: null },
  priceStartsFrom: { type: DataTypes.BOOLEAN, defaultValue: false },
  // Admin-curated flag — powers the app's "Most Booked Services" home section.
  isPopular: { type: DataTypes.BOOLEAN, defaultValue: false },
  // Admin-curated flag — powers the website's "Special Offers" home section.
  showOnHome: { type: DataTypes.BOOLEAN, defaultValue: false },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  sortOrder: { type: DataTypes.INTEGER, defaultValue: 0 },
}, {
  timestamps: true,
  tableName: "services",
});

module.exports = Service;

