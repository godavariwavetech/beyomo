const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../utils/dbconnect");

/**
 * An optional second level under a service category — e.g. Waxing -> Honey / Rica.
 *
 * Services keep pointing at their category as before; `services.subcategoryId` is a
 * nullable extra. A category with no subcategories, or a service that hasn't been
 * assigned one, behaves exactly as it did before this table existed.
 */
const ServiceSubcategory = sequelize.define("ServiceSubcategory", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  categoryId: { type: DataTypes.INTEGER, allowNull: false },
  name: { type: DataTypes.STRING(100), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  image: { type: DataTypes.TEXT, allowNull: true, defaultValue: null },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  sortOrder: { type: DataTypes.INTEGER, defaultValue: 0 },
}, {
  timestamps: true,
  tableName: "service_subcategories",
  indexes: [
    // Two "Honey" rows under Waxing would be indistinguishable in the app's chip row.
    // Scoped to the category, so a "Honey" under some other category is still fine.
    { unique: true, fields: ["categoryId", "name"] },
  ],
});

module.exports = ServiceSubcategory;
