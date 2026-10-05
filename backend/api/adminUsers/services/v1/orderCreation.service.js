const User = require('../../../users/models/user.model');
const City = require('../../../cities/models/city.model');
const bookings = require('../../../bookings/services/v1/bookings.service');
const catalog = require('../../../services/services/v1/services.service');
const packages = require('../../../packages/services/v1/packages.service');
const offers = require('../../../offers/services/v1/offers.service');
const AppError = require('../../../../utils/errorHandlers/appError');

const getCatalog = async cityId => {
  const city = await City.findOne({where: {id: cityId, isActive: true}});
  if (!city) throw new AppError('Select an active service city', 400);
  const [services, packageList] = await Promise.all([
    catalog.getServices({cityId}, 1, 10000), packages.listActive(cityId),
  ]);
  return {services: services.data, packages: packageList};
};

const prepare = async data => {
  if (!(data.services?.length || data.packages?.length)) throw new AppError('Add at least one service or package', 400);
  if ((data.services || []).some(s => s.qty > 5)) throw new AppError('Maximum service quantity is 5', 400);
  const user = await User.findOne({where: {id: data.userId, status: 'active'}});
  if (!user) throw new AppError('Select an active customer', 400);
  const city = await City.findOne({where: {id: data.cityId, isActive: true}});
  if (!city || city.name.trim().toLowerCase() !== data.address.city.trim().toLowerCase()) {
    throw new AppError('Select the service city matching the customer address', 400);
  }
  const available = await getCatalog(city.id);
  if (data.couponCode) {
    const Coupon = require('../../../coupons/models/coupon.model');
    const coupon = await Coupon.findOne({where: {code: data.couponCode.toUpperCase()}});
    if (coupon?.cityIds?.length && !coupon.cityIds.map(Number).includes(Number(city.id))) {
      throw new AppError('Coupon is unavailable in this service city', 400);
    }
  }
  const availableIds = new Set(available.services.map(s => Number(s.id)));
  const entries = data.packages || [];
  const allItems = [...(data.services || []).filter(s => !s.isAddOn), ...entries.flatMap(p => p.services)];
  if (allItems.some(s => !availableIds.has(Number(s.id)))) {
    throw new AppError('One or more services are unavailable in this city', 400);
  }
  for (const entry of entries) {
    const pkg = available.packages.find(p => Number(p.id) === entry.packageId);
    if (!pkg) throw new AppError('Package is unavailable in this city or has expired', 400);
    const ids = entry.services.map(s => Number(s.id));
    if (new Set(ids).size !== ids.length || entry.services.some(s => s.qty !== entry.qty)) {
      throw new AppError('Package services must have distinct IDs and match the package quantity', 400);
    }
    const configured = (pkg.services || []).map(s => Number(s.serviceId));
    if (pkg.packageType === 'fixed') {
      if (!configured.length || ids.length !== configured.length || configured.some(id => !ids.includes(id))) {
        throw new AppError('Combo must include all of its configured services', 400);
      }
    } else if (ids.length !== (pkg.serviceCount || 1) || ids.some(id => {
      const svc = available.services.find(s => Number(s.id) === id);
      return configured.length ? !configured.includes(id) : pkg.categoryId && Number(svc.categoryId) !== Number(pkg.categoryId);
    })) {
      throw new AppError('Select the required eligible services for this package', 400);
    }
  }
  const addons = (data.services || []).filter(s => s.isAddOn).map(s => ({
    name: s.name, price: s.price, qty: s.qty, isAddOn: true, addedByAdmin: true,
    serviceStatus: 'unassigned', assignedPartnerId: null, assignedPartnerName: null,
  }));
  const services = (data.services || []).filter(s => !s.isAddOn);
  const prepared = await bookings.prepareBooking(data.userId, {
    ...data, services: entries.length ? [] : services,
    extraServices: entries.length ? services : [], paymentMode: 'cod',
  }, {additionalServices: addons, consumeOffer: false});
  prepared.bookingRow.services.forEach(s => {s.addedByAdmin = true;});
  if (data.offerId) {
    const eligible = await offers.checkEligibility({
      serviceIds: allItems.map(s => Number(s.id)), totalAmount: prepared.bookingRow.baseAmount, cityId: city.id,
    });
    if (!eligible.some(o => o.offerId === data.offerId)) throw new AppError('Offer is not available for this cart and city', 400);
  }
  return prepared;
};

const preview = async data => {
  const prepared = await prepare(data);
  const row = prepared.bookingRow;
  const eligibleOffers = await offers.checkEligibility({
    serviceIds: row.services.filter(s => !s.addedByOffer && s.serviceId).map(s => s.serviceId),
    totalAmount: row.baseAmount, cityId: row.cityId,
  });
  return {...row, eligibleOffers};
};

const create = async (adminId, data) => {
  const prepared = await prepare(data);
  if (data.expectedTotal != null && Math.abs(data.expectedTotal - prepared.bookingRow.totalAmount) > 0.001) {
    throw new AppError('Prices have changed. Review Total again before creating the booking.', 409);
  }
  const booking = await bookings.persistBooking(prepared, {createdByAdminId: adminId});
  if (data.offerId) {
    const Offer = require('../../../offers/models/offer.model');
    await Offer.increment('usedCount', {where: {id: data.offerId}});
  }
  return booking;
};

module.exports = {getCatalog, preview, create};
