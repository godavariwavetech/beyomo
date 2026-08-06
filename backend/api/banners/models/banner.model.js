const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../utils/dbconnect");

// type identifies which fixed slot on the site/app this banner's image fills —
// exactly one active row per type is used. See dbconnect.js for the migration that
// narrowed this from the old free-form top/promo + title/subtitle/gradient design
// (which nothing ever actually consumed beyond the image itself) down to this.
const Banner = sequelize.define("Banner", {
  id:            { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  type:          { type: DataTypes.ENUM("hero", "custom_package", "combo"), allowNull: false, defaultValue: "hero" },
  title:         { type: DataTypes.STRING(120), allowNull: true },
  subtitle:      { type: DataTypes.STRING(120), allowNull: true },
  description:   { type: DataTypes.TEXT, allowNull: true },
  image:         { type: DataTypes.TEXT, allowNull: true },
  gradientStart: { type: DataTypes.STRING(30), defaultValue: "#1a5c4a" },
  gradientEnd:   { type: DataTypes.STRING(30), defaultValue: "#022723" },
  buttonText:    { type: DataTypes.STRING(40), defaultValue: "Book Now" },
  targetScreen:  { type: DataTypes.STRING(60), allowNull: true },
  targetParam:   { type: DataTypes.STRING(120), allowNull: true },
  isActive:      { type: DataTypes.BOOLEAN, defaultValue: true },
  sortOrder:     { type: DataTypes.INTEGER, defaultValue: 0 },
}, {
  timestamps: true,
  tableName: "banners",
});

module.exports = Banner;
