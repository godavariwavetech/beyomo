const Service = require('../../../services/models/service.model');
const ServicePackage = require('../../../packages/models/package.model');
const {cityPriceResolver} = require('../../../services/services/v1/cityPricing');
const {resolveRatesForBooking, resolveRatesForMultiPackageBooking} = require('../../../../utils/revenueSplit');
const AppError = require('../../../../utils/errorHandlers/appError');

// Only partner-added catalog price offers are revalidated. Free items, packages,
// removals and customer-booked prices keep their existing behaviour.
module.exports = async booking => {
  const parse = value => Array.isArray(value) ? value : typeof value === 'string' ? JSON.parse(value) : [];
  const services = parse(booking.services);
  const offered = services.filter(s => !s.removed && s.addedByPartner && !s.isAddOn
    && !s.addedByPackage && !s.addedByOffer && s.offerPrice != null
    && Number(s.offerPrice) > 0 && Number(s.offerPrice) < Number(s.basePrice));
  if (!offered.length) return [];
  const ids = [...new Set(offered.map(s => s.serviceId))];
  const latest = await Service.findAll({where: {id: ids, isActive: true}});
  const priceOf = await cityPriceResolver(ids, booking.cityId);
  const corrections = new Map();
  for (const item of offered) {
    const service = latest.find(s => String(s.id) === String(item.serviceId));
    const base = service ? Number(priceOf(service)) : NaN;
    if (!Number.isFinite(base) || base < 0) throw new AppError('Unable to verify the current service price. Please try again.', 400);
    const offer = Number(service.offerPrice);
    if (service.offerPrice != null && Number.isFinite(offer) && offer > 0 && offer < base) continue;
    corrections.set(item, base);
  }
  if (!corrections.size) return [];
  let difference = 0;
  const updatedServices = services.map(item => {
    if (!corrections.has(item)) return item;
    const base = corrections.get(item);
    difference += (base - Number(item.price)) * (item.qty || 1);
    return {...item, price: base, basePrice: base, offerPrice: null};
  });
  // Preserve the booking's package amounts and existing discounts.
  const baseAmount = Number(booking.baseAmount) + difference;
  const active = updatedServices.filter(s => !s.removed);
  const packages = parse(booking.packages);
  let rates;
  if (packages.length) {
    const rows = await ServicePackage.findAll({where: {id: packages.map(p => p.packageId)}});
    const pools = packages.map(p => ({package: rows.find(row => String(row.id) === String(p.packageId)), qty: p.qty || 1}));
    if (pools.some(p => !p.package)) throw new AppError('Unable to verify booking totals. Please try again.', 400);
    rates = await resolveRatesForMultiPackageBooking({packages: pools, serviceItems: active});
  } else {
    const pkg = booking.packageId ? await ServicePackage.findByPk(booking.packageId) : null;
    rates = await resolveRatesForBooking({serviceItems: active, package: pkg});
  }
  const taxable = baseAmount - Number(booking.couponDiscountAmount || 0) - Number(booking.discountAmount || 0);
  const taxAmount = Number((taxable * rates.gstPercent / 100).toFixed(2));
  await booking.update({services: updatedServices, baseAmount, taxAmount,
    totalAmount: Number((taxable + taxAmount).toFixed(2)),
    partnerEarning: Number((taxable * rates.partnerPercent / 100).toFixed(2))});
  await booking.reload();
  const names = [...new Set([...corrections.keys()].map(s => s.name))];
  booking.setDataValue('staleOfferServices', names);
  return names;
};
