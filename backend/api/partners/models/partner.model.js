const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../utils/dbconnect");

const Partner = sequelize.define("Partner", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(100), allowNull: true },
  phone: { type: DataTypes.STRING(20), allowNull: false, unique: true },
  email: { type: DataTypes.STRING(150), allowNull: true, unique: true },
  profilePicture: { type: DataTypes.TEXT, allowNull: true, defaultValue: null },
  bio: { type: DataTypes.STRING(500), allowNull: true },
  experience: { type: DataTypes.INTEGER, defaultValue: 0 },
  locationLat: { type: DataTypes.FLOAT, allowNull: true },
  locationLng: { type: DataTypes.FLOAT, allowNull: true },
  locationAddress: { type: DataTypes.TEXT, allowNull: true },
  locationCity: { type: DataTypes.STRING(100), allowNull: true },
  locationState: { type: DataTypes.STRING(100), allowNull: true },
  cityId: { type: DataTypes.INTEGER, allowNull: true },
  locationPincode: { type: DataTypes.STRING(10), allowNull: true },
  aadharUrl: { type: DataTypes.TEXT, allowNull: true },
  agreementUrl: { type: DataTypes.TEXT, allowNull: true },
  serviceCategoryIds: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() { try { return JSON.parse(this.getDataValue('serviceCategoryIds') || '[]'); } catch { return []; } },
    set(val) { this.setDataValue('serviceCategoryIds', JSON.stringify(val || [])); },
  },
  panUrl: { type: DataTypes.TEXT, allowNull: true },
  bankAccountNo: { type: DataTypes.STRING(30), allowNull: true },
  bankIfsc: { type: DataTypes.STRING(20), allowNull: true },
  bankName: { type: DataTypes.STRING(100), allowNull: true },
  bankHolderName: { type: DataTypes.STRING(100), allowNull: true },
  ratingsAverage: { type: DataTypes.FLOAT, defaultValue: 0 },
  ratingsCount: { type: DataTypes.INTEGER, defaultValue: 0 },
  totalEarnings: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  pendingEarnings: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  status: { type: DataTypes.ENUM("pending", "approved", "suspended", "rejected"), defaultValue: "pending" },
  deviceTokens: { type: DataTypes.JSON, defaultValue: [] },
  fcmToken: { type: DataTypes.TEXT, allowNull: true, defaultValue: null },
}, {
  timestamps: true,
  tableName: "partners",
});

module.exports = Partner;
