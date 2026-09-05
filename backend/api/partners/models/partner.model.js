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
  // Free-text profession labels picked on the website "Join Now" form (not tied to real service_categories rows)
  professions: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() { try { return JSON.parse(this.getDataValue('professions') || '[]'); } catch { return []; } },
    set(val) { this.setDataValue('professions', JSON.stringify(val || [])); },
  },
  gender: { type: DataTypes.ENUM("female", "male"), allowNull: true },
  // "I am comfortable for Home Services" consent checkbox from the website Join Now form
  homeServicesConsent: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
  panUrl: { type: DataTypes.TEXT, allowNull: true },
  bankAccountNo: { type: DataTypes.STRING(30), allowNull: true },
  bankIfsc: { type: DataTypes.STRING(20), allowNull: true },
  bankName: { type: DataTypes.STRING(100), allowNull: true },
  bankHolderName: { type: DataTypes.STRING(100), allowNull: true },
  ratingsAverage: { type: DataTypes.FLOAT, defaultValue: 0 },
  ratingsCount: { type: DataTypes.INTEGER, defaultValue: 0 },
  totalEarnings: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  pendingEarnings: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  // Signed running settlement balance: positive = admin owes partner; negative = partner owes admin
  walletBalance: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  status: { type: DataTypes.ENUM("pending", "approved", "suspended", "rejected", "deleted"), defaultValue: "pending" },
  source: { type: DataTypes.ENUM("app", "website"), allowNull: false, defaultValue: "app" },
  deviceTokens: { type: DataTypes.JSON, defaultValue: [] },
  fcmToken: { type: DataTypes.TEXT, allowNull: true, defaultValue: null },
  // Availability: isOnline is what the partner last toggled in the app; lastSeenAt is when
  // they last told us. Both are needed - a partner who force-quits the app, loses signal or
  // whose battery dies never sends "offline", so isOnline alone would stay true forever.
  // Readers treat a partner as online only if isOnline AND lastSeenAt is recent
  // (see isPartnerOnline in utils/partnerPresence).
  isOnline: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  lastSeenAt: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
}, {
  timestamps: true,
  tableName: "partners",
});

module.exports = Partner;
