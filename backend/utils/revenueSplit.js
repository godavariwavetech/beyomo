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

module.exports = {
  DEFAULT_ADMIN_PERCENT,
  DEFAULT_PARTNER_PERCENT,
  DEFAULT_GST_PERCENT,
  computeWeightedCategoryRates,
  resolveRatesForBooking,
};
