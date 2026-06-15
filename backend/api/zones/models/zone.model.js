const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../utils/dbconnect");

const parseJsonArr = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try { const p = JSON.parse(val); return Array.isArray(p) ? p : []; } catch { return []; }
};

const ServiceZone = sequelize.define("ServiceZone", {
  id:          { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name:        { type: DataTypes.STRING(100), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  cityIds: {
    type: DataTypes.JSON,
    defaultValue: [],
    get() { return parseJsonArr(this.getDataValue("cityIds")); },
    set(val) { this.setDataValue("cityIds", Array.isArray(val) ? val : []); },
  },
  cities: {
    type: DataTypes.JSON,
    defaultValue: [],
    get() { return parseJsonArr(this.getDataValue("cities")); },
    set(val) { this.setDataValue("cities", Array.isArray(val) ? val : []); },
  },
  pincodes: {
    type: DataTypes.JSON,
    defaultValue: [],
    get() { return parseJsonArr(this.getDataValue("pincodes")); },
    set(val) { this.setDataValue("pincodes", Array.isArray(val) ? val : []); },
  },
  isActive:    { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  timestamps: true,
  tableName: "service_zones",
});

module.exports = ServiceZone;
