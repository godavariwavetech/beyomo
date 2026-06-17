const { sequelize } = require("../../../../utils/dbconnect");
const PartnerLedgerEntry = require("../../models/partnerLedgerEntry.model");
const PartnerSettlement = require("../../models/partnerSettlement.model");
const Partner = require("../../../partners/models/partner.model");
const Service = require("../../../services/models/service.model");
const ServiceCategory = require("../../../services/models/serviceCategory.model");
const AppError = require("../../../../utils/errorHandlers/appError");
const { cityIdsFilter } = require("../../../../utils/cityFilter");
const { Op } = require("sequelize");

const DEFAULT_ADMIN_PERCENT = 20;

const parseServices = (s) => {
  if (Array.isArray(s)) return s;
  if (typeof s === "string") { try { return JSON.parse(s); } catch { return []; } }
  return [];
};

/**
 * Computes a partner's revenue share for the services they performed within a booking.
 * Works for both single-partner bookings (partnerServiceItems = all active services) and
 * multi-partner split bookings (partnerServiceItems = just this partner's claimed services).
 */
const computePartnerShare = async (booking, partnerServiceItems) => {
  const allServices = parseServices(booking.services).filter(s => !s.removed);
  const nominalTotal = allServices.reduce((sum, s) => sum + (parseFloat(s.price) || 0) * (s.qty || 1), 0);
  const nominalShare = partnerServiceItems.reduce((sum, s) => sum + (parseFloat(s.price) || 0) * (s.qty || 1), 0);
  const fraction = nominalTotal > 0 ? nominalShare / nominalTotal : 1;

  const baseAmount = parseFloat(booking.baseAmount || 0);
  const couponDiscount = parseFloat(booking.couponDiscountAmount || 0);
  const grossShare = Math.max(0, (baseAmount - couponDiscount) * fraction);

  // Weighted admin commission % across the partner's services, by their catalog-price weight
  let weightedAdminPercent = 0;
  if (nominalShare > 0) {
    const serviceIds = [...new Set(partnerServiceItems.map(s => s.serviceId).filter(Boolean))];
    let categoryByServiceId = {};
    if (serviceIds.length > 0) {
      try {
        const services = await Service.findAll({
          where: { id: serviceIds },
          include: [{ model: ServiceCategory, as: "category", attributes: ["adminPercent"] }],
        });
        categoryByServiceId = Object.fromEntries(
          services.map(s => [s.id, s.category ? parseFloat(s.category.adminPercent) : DEFAULT_ADMIN_PERCENT])
        );
      } catch {
        // Catalog lookup failed — fall through to default split below
      }
    }
    for (const s of partnerServiceItems) {
      const weight = ((parseFloat(s.price) || 0) * (s.qty || 1)) / nominalShare;
      const pct = categoryByServiceId[s.serviceId] ?? DEFAULT_ADMIN_PERCENT;
      weightedAdminPercent += pct * weight;
    }
  } else {
    weightedAdminPercent = DEFAULT_ADMIN_PERCENT;
  }

  const adminCommissionAmount = parseFloat((grossShare * weightedAdminPercent / 100).toFixed(2));
  const partnerNetAmount = parseFloat((grossShare - adminCommissionAmount).toFixed(2));

  return {
    grossShare: parseFloat(grossShare.toFixed(2)),
    commissionPercent: parseFloat(weightedAdminPercent.toFixed(2)),
    adminCommissionAmount,
    partnerNetAmount,
  };
};

/**
 * Creates the settlement ledger entry for a partner's completed portion of a booking.
 * Idempotent — skips silently if an entry already exists for this (bookingId, partnerId) pair.
 *
 * `collectedAsCash` reflects how the money was ACTUALLY settled at completion time, not
 * the customer's original payment-mode choice at checkout: an "online" booking whose
 * payment never went through can still be closed out with the partner collecting cash
 * on the spot, in which case the partner — not admin — is holding the money and owes
 * admin the commission share (debit), same as a true COD job.
 */
const createLedgerEntryForCompletion = async (booking, partnerId, partnerServiceItems, { collectedAsCash } = {}) => {
  const existing = await PartnerLedgerEntry.findOne({ where: { bookingId: booking.id, partnerId } });
  if (existing) return existing;

  if (!partnerServiceItems || partnerServiceItems.length === 0) return null;

  const { grossShare, commissionPercent, adminCommissionAmount, partnerNetAmount } =
    await computePartnerShare(booking, partnerServiceItems);

  const direction = collectedAsCash ? "debit" : "credit";
  const amount = direction === "credit" ? partnerNetAmount : adminCommissionAmount;

  return sequelize.transaction(async (t) => {
    const entry = await PartnerLedgerEntry.create({
      partnerId,
      bookingId: booking.id,
      bookingCode: booking.bookingCode,
      paymentMode: collectedAsCash ? "cod" : "online",
      grossShare,
      commissionPercent,
      adminCommissionAmount,
      partnerNetAmount,
      direction,
      amount,
    }, { transaction: t });

    await Partner.increment(
      { walletBalance: direction === "credit" ? amount : -amount, totalEarnings: partnerNetAmount },
      { where: { id: partnerId }, transaction: t }
    );

    return entry;
  });
};

const getPartnerLedger = async (partnerId, { page = 1, limit = 20 } = {}) => {
  const offset = (page - 1) * limit;
  const partner = await Partner.findByPk(partnerId, { attributes: ["id", "name", "phone", "walletBalance", "totalEarnings"] });
  if (!partner) throw new AppError("Partner not found", 404);

  const { count: total, rows: entries } = await PartnerLedgerEntry.findAndCountAll({
    where: { partnerId },
    order: [["createdAt", "DESC"]],
    offset, limit,
  });
  const settlements = await PartnerSettlement.findAll({
    where: { partnerId },
    order: [["createdAt", "DESC"]],
    limit: 50,
  });

  return {
    partner: {
      id: partner.id,
      name: partner.name,
      phone: partner.phone,
      walletBalance: parseFloat(partner.walletBalance || 0),
      totalEarnings: parseFloat(partner.totalEarnings || 0),
      amountAdminOwesYou: Math.max(0, parseFloat(partner.walletBalance || 0)),
      amountYouOweAdmin: Math.max(0, -parseFloat(partner.walletBalance || 0)),
    },
    entries,
    settlements,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

const listPartnerBalances = async ({ page = 1, limit = 20, search, cityIds } = {}) => {
  const offset = (page - 1) * limit;
  const where = { ...cityIdsFilter(cityIds) };
  if (search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { phone: { [Op.like]: `%${search}%` } },
    ];
  }
  const { count: total, rows } = await Partner.findAndCountAll({
    where,
    attributes: ["id", "name", "phone", "locationCity", "walletBalance", "totalEarnings", "status"],
    order: [["walletBalance", "DESC"]],
    offset, limit,
  });
  return {
    data: rows.map(p => ({
      id: p.id, name: p.name, phone: p.phone, city: p.locationCity, status: p.status,
      walletBalance: parseFloat(p.walletBalance || 0),
      totalEarnings: parseFloat(p.totalEarnings || 0),
    })),
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

const recordSettlement = async (adminId, partnerId, { type, amount, method, note }) => {
  amount = parseFloat(amount);
  if (!amount || amount <= 0) throw new AppError("Settlement amount must be greater than 0", 400);
  if (!["payout", "collection"].includes(type)) throw new AppError("type must be 'payout' or 'collection'", 400);

  return sequelize.transaction(async (t) => {
    const partner = await Partner.findByPk(partnerId, { transaction: t, lock: t.LOCK.UPDATE });
    if (!partner) throw new AppError("Partner not found", 404);

    const balanceBefore = parseFloat(partner.walletBalance || 0);
    if (type === "payout") {
      if (balanceBefore <= 0 || amount > balanceBefore) {
        throw new AppError(`Cannot pay out ₹${amount} — admin only owes this partner ₹${Math.max(0, balanceBefore).toFixed(2)}`, 400);
      }
    } else {
      const owed = -balanceBefore;
      if (owed <= 0 || amount > owed) {
        throw new AppError(`Cannot collect ₹${amount} — this partner only owes ₹${Math.max(0, owed).toFixed(2)}`, 400);
      }
    }

    const balanceAfter = type === "payout" ? balanceBefore - amount : balanceBefore + amount;

    const settlement = await PartnerSettlement.create({
      partnerId, type, amount, method: method || null, note: note || null,
      balanceBefore, balanceAfter, settledByAdminId: adminId || null,
    }, { transaction: t });

    await partner.update({ walletBalance: balanceAfter }, { transaction: t });

    // Mark oldest unsettled entries of the matching direction as settled, FIFO, up to `amount`
    const direction = type === "payout" ? "credit" : "debit";
    const entries = await PartnerLedgerEntry.findAll({
      where: { partnerId, direction, status: "unsettled" },
      order: [["createdAt", "ASC"]],
      transaction: t,
    });
    let remaining = amount;
    for (const entry of entries) {
      if (remaining <= 0) break;
      await entry.update({ status: "settled", settlementId: settlement.id }, { transaction: t });
      remaining -= parseFloat(entry.amount);
    }

    return settlement;
  });
};

const voidLedgerEntry = async (adminId, entryId, reason) => {
  return sequelize.transaction(async (t) => {
    const entry = await PartnerLedgerEntry.findByPk(entryId, { transaction: t });
    if (!entry) throw new AppError("Ledger entry not found", 404);
    if (entry.status !== "unsettled") {
      throw new AppError(`Cannot void a ${entry.status} entry — record a manual adjustment instead`, 400);
    }

    const reversal = await PartnerLedgerEntry.create({
      partnerId: entry.partnerId,
      bookingId: entry.bookingId,
      bookingCode: entry.bookingCode,
      paymentMode: entry.paymentMode,
      grossShare: entry.grossShare,
      commissionPercent: entry.commissionPercent,
      adminCommissionAmount: entry.adminCommissionAmount,
      partnerNetAmount: entry.partnerNetAmount,
      direction: entry.direction === "credit" ? "debit" : "credit",
      amount: entry.amount,
      status: "settled",
      reversesEntryId: entry.id,
    }, { transaction: t });

    await Partner.increment(
      { walletBalance: entry.direction === "credit" ? -parseFloat(entry.amount) : parseFloat(entry.amount) },
      { where: { id: entry.partnerId }, transaction: t }
    );

    await entry.update({ status: "voided", voidReason: reason || null, voidedAt: new Date() }, { transaction: t });

    return reversal;
  });
};

module.exports = {
  computePartnerShare,
  createLedgerEntryForCompletion,
  getPartnerLedger,
  listPartnerBalances,
  recordSettlement,
  voidLedgerEntry,
};
