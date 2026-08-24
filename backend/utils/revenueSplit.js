// Shared revenue-split math used wherever a booking's tax / partner earning needs
// computing from the service catalog's category-level adminPercent/partnerPercent/
// gstPercent. Keeping this in one place avoids the tax rate (and the admin/partner
// split) drifting out of sync between booking creation, service-update flows, and
// partner-app previews.

const DEFAULT_ADMIN_PERCENT = 20;
const DEFAULT_PARTNER_PERCENT = 80;
const DEFAULT_GST_PERCENT = 5;

const parseServiceItems = (s) => {
  if (Array.isArray(s)) return s;
  if (typeof s === "string") { try { return JSON.parse(s); } catch { return []; } }
  return [];
};

/**
 * Computes the price-weighted adminPercent/partnerPercent/gstPercent across a set of
 * booking service line items, by looking up each service's category split. Items with
 * no resolvable category (deleted/missing) fall back to the platform defaults so a
 * stale catalog reference never blocks a calculation.
 *
 * @param {Array<{serviceId:number, price:number, qty?:number}>} serviceItems
 * @returns {Promise<{adminPercent:number, partnerPercent:number, gstPercent:number}>}
 */
const computeWeightedCategoryRates = async (serviceItems) => {
  const Service = require("../api/services/models/service.model");
  const ServiceCategory = require("../api/services/models/serviceCategory.model");

  const items = (serviceItems || []).filter(s => !s.removed);
  const nominalTotal = items.reduce((sum, s) => sum + (parseFloat(s.price) || 0) * (s.qty || 1), 0);

  if (nominalTotal <= 0) {
    return { adminPercent: DEFAULT_ADMIN_PERCENT, partnerPercent: DEFAULT_PARTNER_PERCENT, gstPercent: DEFAULT_GST_PERCENT };
  }

  const serviceIds = [...new Set(items.map(s => s.serviceId).filter(Boolean))];
  let ratesByServiceId = {};
  if (serviceIds.length > 0) {
    try {
      const services = await Service.findAll({
        where: { id: serviceIds },
        include: [{ model: ServiceCategory, as: "category", attributes: ["adminPercent", "partnerPercent", "gstPercent"] }],
      });
      ratesByServiceId = Object.fromEntries(
        services.map(s => [
          s.id,
          s.category
            ? {
                adminPercent: parseFloat(s.category.adminPercent),
                partnerPercent: parseFloat(s.category.partnerPercent),
                gstPercent: parseFloat(s.category.gstPercent),
              }
            : null,
        ])
      );
    } catch {
      // Catalog lookup failed — every item falls back to defaults below
    }
  }

  let adminPercent = 0, partnerPercent = 0, gstPercent = 0;
  for (const s of items) {
    const weight = ((parseFloat(s.price) || 0) * (s.qty || 1)) / nominalTotal;
    const rates = ratesByServiceId[s.serviceId];
    adminPercent += (rates?.adminPercent ?? DEFAULT_ADMIN_PERCENT) * weight;
    partnerPercent += (rates?.partnerPercent ?? DEFAULT_PARTNER_PERCENT) * weight;
    gstPercent += (rates?.gstPercent ?? DEFAULT_GST_PERCENT) * weight;
  }

  return {
    adminPercent: parseFloat(adminPercent.toFixed(2)),
    partnerPercent: parseFloat(partnerPercent.toFixed(2)),
    gstPercent: parseFloat(gstPercent.toFixed(2)),
  };
};

/**
 * Same as computeWeightedCategoryRates, but a package's own split overrides the
 * per-service category lookup entirely — a package's fixed price isn't tied to its
 * services' individual catalog prices, so the split has to come from the package.
 */
const resolveRatesForBooking = async ({ serviceItems, package: pkg }) => {
  if (pkg) {
    return {
      adminPercent: parseFloat(pkg.adminPercent),
      partnerPercent: parseFloat(pkg.partnerPercent),
      gstPercent: parseFloat(pkg.gstPercent),
    };
  }
  return computeWeightedCategoryRates(parseServiceItems(serviceItems));
};

/**
 * Multi-package version: each package keeps its own fixed price AND its own
 * adminPercent/partnerPercent/gstPercent (set per-package by the admin), so the
 * booking's overall split has to be a price-weighted blend across all of them —
 * a single flat rate (as the single-package path uses) would be wrong the moment
 * two packages have different splits. Any true extra (non-package) services are
 * folded into the same weighted pool via their own category rates, so the result
 * is one coherent blended rate for the whole booking.
 *
 * @param {Array<{package: object, qty: number}>} packages
 * @param {Array} serviceItems - the full service line-items (extras only need be
 *   present here; package-sourced items are represented via `packages` instead)
 */
const resolveRatesForMultiPackageBooking = async ({ packages = [], serviceItems }) => {
  const pools = packages.map(({ package: pkg, qty }) => ({
    amount: parseFloat(pkg.price) * qty,
    adminPercent: parseFloat(pkg.adminPercent),
    partnerPercent: parseFloat(pkg.partnerPercent),
    gstPercent: parseFloat(pkg.gstPercent),
  }));

  const extraItems = parseServiceItems(serviceItems).filter(s => !s.removed && !s.packageId);
  const extraAmount = extraItems.reduce((sum, s) => sum + (parseFloat(s.price) || 0) * (s.qty || 1), 0);
  if (extraAmount > 0) {
    const extraRates = await computeWeightedCategoryRates(extraItems);
    pools.push({ amount: extraAmount, ...extraRates });
  }

  const totalAmount = pools.reduce((sum, p) => sum + p.amount, 0);
  if (totalAmount <= 0) {
    return { adminPercent: DEFAULT_ADMIN_PERCENT, partnerPercent: DEFAULT_PARTNER_PERCENT, gstPercent: DEFAULT_GST_PERCENT };
  }

  let adminPercent = 0, partnerPercent = 0, gstPercent = 0;
  for (const p of pools) {
    const weight = p.amount / totalAmount;
    adminPercent += p.adminPercent * weight;
    partnerPercent += p.partnerPercent * weight;
    gstPercent += p.gstPercent * weight;
  }

  return {
    adminPercent: parseFloat(adminPercent.toFixed(2)),
    partnerPercent: parseFloat(partnerPercent.toFixed(2)),
    gstPercent: parseFloat(gstPercent.toFixed(2)),
  };
};

/**
 * Normalizes an incoming create/update payload's revenue split before it hits the DB.
 * adminPercent and partnerPercent are two halves of the same 100%, so only the admin
 * cut is authoritative — the partner's share is always derived from it. Without this,
 * an admin-dashboard payload carrying a stale partnerPercent (e.g. 80 alongside an
 * adminPercent of 80) persisted a split summing to 160%, which then drove booking
 * totals, partner earnings, and settlement ledgers apart.
 */
const normalizeSplitInput = (data) => {
  if (!data || typeof data !== "object") return data;
  if (data.adminPercent == null && data.partnerPercent == null) return data;

  let admin = parseFloat(data.adminPercent);
  if (!Number.isFinite(admin)) {
    // Only the partner cut was sent — treat that as authoritative instead.
    const partner = parseFloat(data.partnerPercent);
    admin = Number.isFinite(partner) ? 100 - partner : DEFAULT_ADMIN_PERCENT;
  }
  admin = Math.min(100, Math.max(0, admin));

  return {
    ...data,
    adminPercent: parseFloat(admin.toFixed(2)),
    partnerPercent: parseFloat((100 - admin).toFixed(2)),
  };
};

module.exports = {
  DEFAULT_ADMIN_PERCENT,
  DEFAULT_PARTNER_PERCENT,
  DEFAULT_GST_PERCENT,
  computeWeightedCategoryRates,
  resolveRatesForBooking,
  resolveRatesForMultiPackageBooking,
  normalizeSplitInput,
};
