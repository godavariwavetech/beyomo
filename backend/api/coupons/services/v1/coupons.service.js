const { Op } = require("sequelize");
const Coupon = require("../../models/coupon.model");
const AppError = require("../../../../utils/errorHandlers/appError");

const listPublicCoupons = async (cityId) => {
  const now = new Date();
  const coupons = await Coupon.findAll({
    where: {
      isActive: true,
      validFrom: { [Op.lte]: now },
      validTill: { [Op.gte]: now },
    },
    order: [["createdAt", "DESC"]],
    attributes: ["id", "code", "type", "discount", "maxDiscount", "minOrderAmount", "validTill", "description", "maxUses", "usedCount", "cityIds"],
  });

  const cid = cityId ? Number(cityId) : null;

  return coupons
    .filter((c) => !c.maxUses || c.usedCount < c.maxUses)
    .filter((c) => {
      const ids = c.cityIds ?? [];
      return ids.length === 0 || (cid != null && ids.map(Number).includes(cid));
    })
    .map((c) => ({
      id: c.id,
      code: c.code,
      discountType: c.type,
      discountValue: parseFloat(c.discount),
      maxDiscount: c.maxDiscount ? parseFloat(c.maxDiscount) : null,
      minOrderAmount: parseFloat(c.minOrderAmount),
      expiresAt: c.validTill,
      description: c.description,
    }));
};

const validateCoupon = async (code) => {
  if (!code) throw new AppError("Coupon code is required", 400);
  const now = new Date();

  const coupon = await Coupon.findOne({
    where: {
      code: code.trim().toUpperCase(),
      isActive: true,
      validFrom: { [Op.lte]: now },
      validTill: { [Op.gte]: now },
    },
  });

  if (!coupon) throw new AppError("Invalid or expired coupon code", 400);
  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
    throw new AppError("This coupon has reached its usage limit", 400);
  }

  return {
    code: coupon.code,
    discountType: coupon.type,
    discountValue: parseFloat(coupon.discount),
    maxDiscount: coupon.maxDiscount ? parseFloat(coupon.maxDiscount) : null,
    minOrderAmount: parseFloat(coupon.minOrderAmount),
    description: coupon.description,
    expiresAt: coupon.validTill,
    message: `Coupon "${coupon.code}" is valid!`,
  };
};

const applyCoupon = async (code, orderAmount) => {
  if (!code || !orderAmount) throw new AppError("Coupon code and order amount are required", 400);
  const now = new Date();

  const coupon = await Coupon.findOne({
    where: {
      code: code.toUpperCase(),
      isActive: true,
      validFrom: { [Op.lte]: now },
      validTill: { [Op.gte]: now },
    },
  });

  if (!coupon) throw new AppError("Invalid or expired coupon code", 400);
  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) throw new AppError("This coupon has reached its usage limit", 400);
  if (orderAmount < parseFloat(coupon.minOrderAmount)) {
    throw new AppError(`Minimum order amount of ₹${coupon.minOrderAmount} required for this coupon`, 400);
  }

  let discountAmount = 0;
  if (coupon.type === "flat") {
    discountAmount = Math.min(parseFloat(coupon.discount), orderAmount);
  } else {
    discountAmount = (orderAmount * parseFloat(coupon.discount)) / 100;
    if (coupon.maxDiscount) discountAmount = Math.min(discountAmount, parseFloat(coupon.maxDiscount));
  }

  discountAmount = parseFloat(discountAmount.toFixed(2));
  const finalAmount = parseFloat((orderAmount - discountAmount).toFixed(2));

  return { couponId: coupon.id, code: coupon.code, type: coupon.type, discountAmount, finalAmount, description: coupon.description };
};

module.exports = { listPublicCoupons, validateCoupon, applyCoupon };
