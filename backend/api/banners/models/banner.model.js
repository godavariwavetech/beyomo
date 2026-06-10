const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../utils/dbconnect");

const Banner = sequelize.define("Banner", {
  id:            { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  type:          { type: DataTypes.ENUM("top", "promo"), allowNull: false, defaultValue: "top" },
  title:         { type: DataTypes.STRING(120), allowNull: false },
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
