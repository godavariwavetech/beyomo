const { Op } = require("sequelize");
const Offer = require("../../models/offer.model");
const Service = require("../../../services/models/service.model");
const AppError = require("../../../../utils/errorHandlers/appError");
const { normalizeSplitInput } = require("../../../../utils/revenueSplit");

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const activeWhere = (cityId) => ({
  isActive: true,
  validFrom: { [Op.lte]: new Date() },
  validTill: { [Op.gte]: startOfToday() },
  // with city: show city-specific + global (null). without city: show all active offers
  ...(cityId ? { [Op.or]: [{ cityId: Number(cityId) }, { cityId: null }] } : {}),
});

const freeServiceInclude = {
  model: Service,
  as: "freeService",
  attributes: ["id", "name", "image", "duration", "basePrice"],
};

const parseTv = (raw) => {
  if (!raw) return {};
  if (typeof raw === 'string') { try { return JSON.parse(raw); } catch { return {}; } }
  return raw;
};

const checkTrigger = (offer, { serviceIds, categoryIds, totalAmount, totalCount }) => {
  const tv = parseTv(offer.triggerValue);
  switch (offer.triggerType) {
    case "min_spend":
      return totalAmount >= Number(tv.amount ?? 0);
    case "specific_services":
      return (tv.serviceIds ?? []).every(id => serviceIds.includes(Number(id)));
    case "min_count":
      return totalCount >= Number(tv.count ?? 1);
    case "category":
      return categoryIds.filter(id => id === Number(tv.categoryId)).length >= Number(tv.count ?? 1);
    default:
      return false;
  }
};

const listActive = async (cityId) => {
  const offers = await Offer.findAll({
    where: activeWhere(cityId),
    include: [freeServiceInclude],
    order: [["createdAt", "DESC"]],
  });

  // For specific_services offers, attach human-readable service names
  return Promise.all(offers.map(async (o) => {
    const plain = parseOfferRow(o);
    if (o.triggerType === "specific_services") {
      const ids = (o.triggerValue?.serviceIds ?? []).map(Number).filter(Boolean);
      if (ids.length > 0) {
        const svcs = await Service.findAll({ where: { id: ids }, attributes: ["id", "name", "image"] });
        plain.requiredServices = svcs.map(s => ({ id: s.id, name: s.name, image: s.image }));
      } else {
        plain.requiredServices = [];
      }
    }
    return plain;
  }));
};

const checkEligibility = async ({ serviceIds, totalAmount, cityId }) => {
  const numIds = (serviceIds ?? []).map(Number);
  const totalCount = numIds.length;

  // Fetch categoryIds for min_count-by-category trigger
  const services = await Service.findAll({
    where: { id: numIds },
    attributes: ["id", "categoryId"],
  });
  const categoryIds = services.map(s => s.categoryId);

  const offers = await listActive(cityId);

  return offers
    .filter(o => {
      if (o.maxUses && o.usedCount >= o.maxUses) return false;
      return checkTrigger(o, { serviceIds: numIds, categoryIds, totalAmount: Number(totalAmount ?? 0), totalCount });
    })
    .map(o => ({
      offerId: o.id,
      title: o.title,
      description: o.description,
      triggerType: o.triggerType,
      triggerValue: parseTv(o.triggerValue),
      freeService: o.freeService
        ? { id: o.freeService.id, name: o.freeService.name, image: o.freeService.image, duration: o.freeService.duration, price: 0 }
        : null,
    }))
    .filter(o => o.freeService);
};

const validateAndApply = async (offerId, { serviceIds, totalAmount }) => {
  const numIds = (serviceIds ?? []).map(Number);
  const totalCount = numIds.length;

  const services = await Service.findAll({ where: { id: numIds }, attributes: ["id", "categoryId"] });
  const categoryIds = services.map(s => s.categoryId);

  const offer = await Offer.findOne({
    where: { id: offerId, isActive: true, validFrom: { [Op.lte]: new Date() }, validTill: { [Op.gte]: new Date() } },
    include: [freeServiceInclude],
  });

  if (!offer) throw new AppError("Offer not found or expired", 400);
  if (offer.maxUses && offer.usedCount >= offer.maxUses) throw new AppError("Offer usage limit reached", 400);
  if (!checkTrigger(offer, { serviceIds: numIds, categoryIds, totalAmount: Number(totalAmount ?? 0), totalCount })) {
    throw new AppError("Your cart does not qualify for this offer", 400);
  }
  if (!offer.freeService) throw new AppError("Free service not available", 400);

  await offer.increment("usedCount");
  return { offer, freeService: offer.freeService };
};

const parseOfferRow = (row) => {
  const plain = row.get({ plain: true });
  if (typeof plain.triggerValue === 'string') {
    try { plain.triggerValue = JSON.parse(plain.triggerValue); } catch { plain.triggerValue = {}; }
  }
  return plain;
};

const listAll = async ({ page = 1, limit = 20, cityIds } = {}) => {
  const offset = (page - 1) * limit;
  // City-specific offers for the selected cities, plus global (cityId: null) offers
  const where = cityIds?.length ? { [Op.or]: [{ cityId: { [Op.in]: cityIds } }, { cityId: null }] } : {};
  const { count, rows } = await Offer.findAndCountAll({
    where,
    include: [freeServiceInclude],
    order: [["createdAt", "DESC"]],
    limit,
    offset,
  });
  return { total: count, data: rows.map(parseOfferRow) };
};

const createOffer = async (data) => Offer.create(normalizeSplitInput(data));

const updateOffer = async (id, data) => {
  const offer = await Offer.findByPk(id);
  if (!offer) throw new AppError("Offer not found", 404);
  return offer.update(normalizeSplitInput(data));
};

const deleteOffer = async (id) => {
  const offer = await Offer.findByPk(id);
  if (!offer) throw new AppError("Offer not found", 404);
  await offer.destroy();
};

module.exports = { listActive, checkEligibility, validateAndApply, listAll, createOffer, updateOffer, deleteOffer };
