const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../utils/dbconnect");

const ContactInquiry = sequelize.define("ContactInquiry", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(150), allowNull: false },
  email: { type: DataTypes.STRING(200), allowNull: false },
  phone: { type: DataTypes.STRING(20), allowNull: true },
  subject: { type: DataTypes.STRING(200), allowNull: false },
  message: { type: DataTypes.TEXT, allowNull: false },
  status: { type: DataTypes.ENUM("new", "in_progress", "resolved"), defaultValue: "new" },
  adminNotes: { type: DataTypes.TEXT, allowNull: true },
}, {
  timestamps: true,
  tableName: "contact_inquiries",
});

module.exports = ContactInquiry;
