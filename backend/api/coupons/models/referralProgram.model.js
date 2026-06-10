const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../utils/dbconnect");

const ReferralProgram = sequelize.define("ReferralProgram", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  rewardAmount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 50, allowNull: false },
  referrerReward: { type: DataTypes.DECIMAL(10, 2), defaultValue: 100, allowNull: false },
  minOrderAmount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  description: { type: DataTypes.TEXT, allowNull: true },
}, {
  timestamps: true,
  tableName: "referral_programs",
});

ReferralProgram.getInstance = async function () {
  let program = await ReferralProgram.findOne();
  if (!program) {
    program = await ReferralProgram.create({
      rewardAmount: 50,
      referrerReward: 100,
      minOrderAmount: 0,
      isActive: true,
    });
  }
  return program;
};

module.exports = ReferralProgram;
