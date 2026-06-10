const { DataTypes } = require("sequelize");
const bcrypt = require("bcryptjs");
const { sequelize } = require("../../../utils/dbconnect");

const AdminUser = sequelize.define("AdminUser", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  email: { type: DataTypes.STRING(150), allowNull: false, unique: true },
  password: { type: DataTypes.STRING(255), allowNull: false },
  role: {
    type: DataTypes.ENUM("super_admin", "admin", "manager", "analyst", "support"),
    defaultValue: "support",
  },
  customPermissions: { type: DataTypes.JSON, defaultValue: [] },
  allowedCities:     { type: DataTypes.JSON, allowNull: true, defaultValue: null },
  fcmToken:          { type: DataTypes.TEXT, allowNull: true, defaultValue: null },
  status: { type: DataTypes.ENUM("active", "inactive"), defaultValue: "active" },
  lastLogin: { type: DataTypes.DATE, allowNull: true },
  createdBy: { type: DataTypes.INTEGER, allowNull: true },
}, {
  timestamps: true,
  tableName: "admin_users",
  hooks: {
    async beforeCreate(admin) {
      const salt = await bcrypt.genSalt(12);
      admin.password = await bcrypt.hash(admin.password, salt);
    },
    async beforeUpdate(admin) {
      if (admin.changed("password")) {
        const salt = await bcrypt.genSalt(12);
        admin.password = await bcrypt.hash(admin.password, salt);
      }
    },
  },
});

AdminUser.prototype.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = AdminUser;

