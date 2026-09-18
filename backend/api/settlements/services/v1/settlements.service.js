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

  // The booking's own partnerEarning is the authoritative split — it's what the partner
  // app shows as "Your Earnings", and recomputeBookingAmounts keeps it current as
  // services/packages are added or removed. Apportioning it is the only way the ledger
  // can agree with that figure.
  //
  // The category-weighted fallback below cannot: it weights by raw catalog prices and
  // reads adminPercent off each service's CATEGORY, so it is blind to packages. A
  // package's fixed price isn't the sum of its services' list prices, and a package
  // carries its own adminPercent — so on any booking with a package or combo the two
  // numbers drift apart (GEN2600026: ledger said 2108.74, the booking said 2147.82,
  // because the ledger weighted 3894 of raw prices instead of the 2797 actually charged
  // and counted a 50%-commission service twice, once inside a combo and once standalone).
  const bookingEarning = parseFloat(booking.partnerEarning);
  if (Number.isFinite(bookingEarning) && bookingEarning > 0) {
    // Clamped because the Booking model falls back to partnerEarning = totalAmount when
    // none was computed, and totalAmount includes GST — which would otherwise produce a
    // share above gross and a negative commission.
    const partnerNetAmount = parseFloat(Math.min(grossShare, bookingEarning * fraction).toFixed(2));
    const adminCommissionAmount = parseFloat(Math.max(0, grossShare - partnerNetAmount).toFixed(2));
    return {
      grossShare: parseFloat(grossShare.toFixed(2)),
      commissionPercent: grossShare > 0
        ? parseFloat(((adminCommissionAmount / grossShare) * 100).toFixed(2))
        : 0,
      adminCommissionAmount,
      partnerNetAmount,
    };
  }

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

  // Outstanding totals derived from the entries themselves, across every page — not from
  // walletBalance. These are what the settlement screen shows as owed, so the figure always
  // equals the bookings still open rather than a running total that a mis-settle could skew.
  const [unsettledCredit, unsettledDebit] = await Promise.all([
    PartnerLedgerEntry.sum("amount", { where: { partnerId, direction: "credit", status: "unsettled" } }),
    PartnerLedgerEntry.sum("amount", { where: { partnerId, direction: "debit", status: "unsettled" } }),
  ]);
  const unsettledCreditTotal = parseFloat((unsettledCredit || 0).toFixed(2));
  const unsettledDebitTotal = parseFloat((unsettledDebit || 0).toFixed(2));
  const outstandingBalance = parseFloat((unsettledCreditTotal - unsettledDebitTotal).toFixed(2));

  // The same outstanding totals, but each entry rounded to whole rupees BEFORE being summed.
  // Every screen shows entry amounts rounded, so a column of them adds up to this figure and
  // not to a rounding of the exact total - for Alex the 11 open entries display as 6664 while
  // the exact sum is 6663.30, and rounding that sum would print 6663 beside a column that
  // visibly adds to 6664. Derived from the entries, so it is independent of page size.
  const roundedRows = await PartnerLedgerEntry.findAll({
    where: { partnerId, status: "unsettled" },
    attributes: [
      "direction",
      [sequelize.fn("SUM", sequelize.fn("ROUND", sequelize.col("amount"))), "total"],
    ],
    group: ["direction"],
    raw: true,
  });
  const roundedByDirection = Object.fromEntries(
    roundedRows.map(r => [r.direction, Math.round(parseFloat(r.total) || 0)])
  );
  const roundedCreditTotal = roundedByDirection.credit || 0;
  const roundedDebitTotal = roundedByDirection.debit || 0;
  const roundedOutstandingBalance = roundedCreditTotal - roundedDebitTotal;

  return {
    partner: {
      id: partner.id,
      name: partner.name,
      phone: partner.phone,
      walletBalance: parseFloat(partner.walletBalance || 0),
      totalEarnings: parseFloat(partner.totalEarnings || 0),
      amountAdminOwesYou: Math.max(0, parseFloat(partner.walletBalance || 0)),
      amountYouOweAdmin: Math.max(0, -parseFloat(partner.walletBalance || 0)),
      unsettledCreditTotal,
      unsettledDebitTotal,
      outstandingBalance,
      outstandingOwedToPartner: Math.max(0, outstandingBalance),
      outstandingOwedByPartner: Math.max(0, -outstandingBalance),
      roundedCreditTotal,
      roundedDebitTotal,
      roundedOutstandingBalance,
      roundedOwedToPartner: Math.max(0, roundedOutstandingBalance),
      roundedOwedByPartner: Math.max(0, -roundedOutstandingBalance),
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

  // Rounded outstanding per partner, summed from per-entry rounding — the same basis the
  // ledger modal uses, so the balance in this table and the one inside the modal are never
  // a rupee apart. One grouped query for the whole page rather than a query per row.
  const partnerIds = rows.map(p => p.id);
  const roundedRows = partnerIds.length
    ? await PartnerLedgerEntry.findAll({
        where: { partnerId: partnerIds, status: "unsettled" },
        attributes: [
          "partnerId",
          "direction",
          [sequelize.fn("SUM", sequelize.fn("ROUND", sequelize.col("amount"))), "total"],
        ],
        group: ["partnerId", "direction"],
        raw: true,
      })
    : [];
  const roundedByPartner = {};
  for (const r of roundedRows) {
    const signed = Math.round(parseFloat(r.total) || 0) * (r.direction === "credit" ? 1 : -1);
    roundedByPartner[r.partnerId] = (roundedByPartner[r.partnerId] || 0) + signed;
  }

  return {
    data: rows.map(p => ({
      id: p.id, name: p.name, phone: p.phone, city: p.locationCity, status: p.status,
      walletBalance: parseFloat(p.walletBalance || 0),
      totalEarnings: parseFloat(p.totalEarnings || 0),
      roundedOutstandingBalance: roundedByPartner[p.id] || 0,
    })),
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

const recordSettlement = async (adminId, partnerId, { type, amount, method, note, entryIds }) => {
  if (!["payout", "collection"].includes(type)) throw new AppError("type must be 'payout' or 'collection'", 400);

  const direction = type === "payout" ? "credit" : "debit";
  const targetedIds = Array.isArray(entryIds)
    ? [...new Set(entryIds.map(id => parseInt(id)).filter(Number.isInteger))]
    : null;

  if (!targetedIds && (!parseFloat(amount) || parseFloat(amount) <= 0)) {
    throw new AppError("Settlement amount must be greater than 0", 400);
  }

  return sequelize.transaction(async (t) => {
    const partner = await Partner.findByPk(partnerId, { transaction: t, lock: t.LOCK.UPDATE });
    if (!partner) throw new AppError("Partner not found", 404);

    // When specific bookings are selected they alone define the settlement, and the amount
    // is the exact sum of THEIR ledger amounts rather than a figure typed by hand. That is
    // what keeps walletBalance and the unsettled-entry total moving by the same number, so
    // "Partner Owes" cannot drift away from the bookings actually outstanding.
    let targetedEntries = null;
    let settleAmount;

    if (targetedIds) {
      if (targetedIds.length === 0) throw new AppError("Select at least one booking to settle", 400);

      targetedEntries = await PartnerLedgerEntry.findAll({
        where: { id: targetedIds, partnerId },
        order: [["createdAt", "ASC"]],
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (targetedEntries.length !== targetedIds.length) {
        throw new AppError("One or more selected bookings were not found for this partner", 404);
      }
      const alreadyClosed = targetedEntries.find(e => e.status !== "unsettled");
      if (alreadyClosed) {
        throw new AppError(`${alreadyClosed.bookingCode || `Entry ${alreadyClosed.id}`} is already ${alreadyClosed.status} — reload the ledger`, 400);
      }
      const wrongDirection = targetedEntries.find(e => e.direction !== direction);
      if (wrongDirection) {
        throw new AppError(`${wrongDirection.bookingCode || `Entry ${wrongDirection.id}`} cannot be settled as a ${type}`, 400);
      }

      settleAmount = parseFloat(targetedEntries.reduce((sum, e) => sum + parseFloat(e.amount), 0).toFixed(2));
      if (settleAmount <= 0) throw new AppError("Selected bookings total ₹0 — nothing to settle", 400);
    } else {
      settleAmount = parseFloat(amount);
    }

    const balanceBefore = parseFloat(partner.walletBalance || 0);
    const EPS = 0.005;
    // The balance ceiling guards the free-amount path, where nothing else bounds the figure.
    // Selected entries are already bounded — each is unsettled and settles exactly once — and
    // an earlier rounded settlement can legitimately leave the balance a little under the
    // open-booking total, so holding selections to it would block the last open booking.
    if (!targetedEntries) {
      if (type === "payout") {
        if (balanceBefore <= 0 || settleAmount > balanceBefore + EPS) {
          throw new AppError(`Cannot pay out ₹${settleAmount} — admin only owes this partner ₹${Math.max(0, balanceBefore).toFixed(2)}`, 400);
        }
      } else {
        const owed = -balanceBefore;
        if (owed <= 0 || settleAmount > owed + EPS) {
          throw new AppError(`Cannot collect ₹${settleAmount} — this partner only owes ₹${Math.max(0, owed).toFixed(2)}`, 400);
        }
      }
    }

    const balanceAfter = parseFloat(
      (type === "payout" ? balanceBefore - settleAmount : balanceBefore + settleAmount).toFixed(2)
    );

    const settlement = await PartnerSettlement.create({
      partnerId, type, amount: settleAmount, method: method || null, note: note || null,
      balanceBefore, balanceAfter, settledByAdminId: adminId || null,
    }, { transaction: t });

    await partner.update({ walletBalance: balanceAfter }, { transaction: t });

    if (targetedEntries) {
      // Settle exactly the selected bookings. No other entry is read or written.
      for (const entry of targetedEntries) {
        await entry.update({ status: "settled", settlementId: settlement.id }, { transaction: t });
      }
    } else {
      // No bookings selected — settle oldest-first as before, but only entries the amount
      // FULLY covers. Marking an entry settled out of a leftover remainder smaller than the
      // entry's own amount is what used to close a second, unpaid booking alongside the
      // intended one (₹500 settled GEN2600010 at ₹499.50, then GEN2600008 at ₹199.80 on the
      // ₹0.50 left over) and left walletBalance disagreeing with the unsettled total.
      const entries = await PartnerLedgerEntry.findAll({
        where: { partnerId, direction, status: "unsettled" },
        order: [["createdAt", "ASC"]],
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      let remaining = settleAmount;
      for (const entry of entries) {
        const entryAmount = parseFloat(entry.amount);
        if (remaining + EPS < entryAmount) break;
        await entry.update({ status: "settled", settlementId: settlement.id }, { transaction: t });
        remaining = parseFloat((remaining - entryAmount).toFixed(2));
      }
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
