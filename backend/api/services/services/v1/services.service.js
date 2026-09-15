const { Op } = require("sequelize");
const ServiceCategory = require("../../models/serviceCategory.model");
const ServiceSubcategory = require("../../models/serviceSubcategory.model");
const Service = require("../../models/service.model");
const ServiceCityMap = require("../../models/service_city_map.model");
const Partner = require("../../../partners/models/partner.model");
const AppError = require("../../../../utils/errorHandlers/appError");

const getCategories = async (query = {}) => {
  const all = await ServiceCategory.findAll({
    where: { isActive: true },
    order: [["sortOrder", "ASC"], ["name", "ASC"]],
  });
  // If a cityId filter is requested, include only categories active in that city (cityIds empty = global)
  if (!query.cityId) return all;
  const cid = Number(query.cityId);
  return all.filter((c) => {
    const ids = c.cityIds ?? [];
    return ids.length === 0 || ids.map(Number).includes(cid);
  });
};

/**
 * Active subcategories, optionally for one category (Waxing -> Honey / Rica).
 *
 * Returns [] for a category that has none, which the app reads as "no subcategory row
 * to show" — so categories that were never given subcategories look unchanged.
 */
const getSubcategories = async (query = {}) => {
  const where = { isActive: true };
  if (query.categoryId) where.categoryId = query.categoryId;
  return ServiceSubcategory.findAll({
    where,
    order: [["sortOrder", "ASC"], ["name", "ASC"]],
  });
};

// Returns true if the service is available in the requested city.
// Global = no city mappings; city-specific = has an active mapping for that city.
const isAvailableInCity = (cityMappings, cityId) => {
  if (!cityId) return true;
  if (!cityMappings || cityMappings.length === 0) return true; // global
  return cityMappings.some((m) => Number(m.cityId) === Number(cityId) && m.isActive);
};

const getServices = async (query, page = 1, limit = 20) => {
  const offset = (page - 1) * limit;
  const where = { isActive: true };
  if (query.categoryId) where.categoryId = query.categoryId;
  // Optional narrowing within a category; omitted = the category's full list, as before.
  if (query.subcategoryId) where.subcategoryId = query.subcategoryId;
  if (query.isPopular) where.isPopular = true;
  if (query.showOnHome) where.showOnHome = true;
  if (query.search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${query.search}%` } },
      { description: { [Op.like]: `%${query.search}%` } },
    ];
  }

  const { count: total, rows } = await Service.findAndCountAll({
    where,
    order: [["sortOrder", "ASC"], ["name", "ASC"]],
    offset,
    limit,
    include: [
      { model: ServiceCategory, as: "category", attributes: ["name", "icon", "image", "adminPercent", "partnerPercent", "gstPercent"] },
      { model: ServiceCityMap, as: "cityMappings", required: false },
    ],
  });

  const services = rows
    .filter((s) => isAvailableInCity(s.cityMappings, query.cityId))
    .map((s) => {
      const plain = s.get({ plain: true });
      // Apply city-specific price override if one exists
      if (query.cityId) {
        const mapping = (s.cityMappings ?? []).find(
          (m) => Number(m.cityId) === Number(query.cityId) && m.isActive
        );
        if (mapping?.customPrice != null) plain.basePrice = mapping.customPrice;
      }
      return plain;
    });

  return { data: services, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};

const getServiceById = async (serviceId, cityId = null) => {
  const service = await Service.findOne({
    where: { id: serviceId, isActive: true },
    include: [
      { model: ServiceCategory, as: "category", attributes: ["name", "icon", "image", "description", "adminPercent", "partnerPercent", "gstPercent"] },
      { model: ServiceCityMap, as: "cityMappings", required: false },
    ],
  });
  if (!service) throw new AppError("Service not found", 404);

  // Same per-city price override the list endpoint applies — without this the detail
  // screen shows the global base price while the list shows the city's rate.
  const plain = service.get({ plain: true });
  if (cityId) {
    const mapping = (service.cityMappings ?? []).find(
      (m) => Number(m.cityId) === Number(cityId) && m.isActive
    );
    if (mapping?.customPrice != null) plain.basePrice = mapping.customPrice;
  }
  return plain;
};

const getNearbyPartners = async (lat, lng, serviceId, radiusKm = 10, page = 1, limit = 20) => {
  if (!lat || !lng) throw new AppError("lat and lng are required", 400);

  const radiusDeg = radiusKm / 111;
  const where = {
    status: "approved",
    locationLat: { [Op.between]: [lat - radiusDeg, lat + radiusDeg] },
    locationLng: { [Op.between]: [lng - radiusDeg, lng + radiusDeg] },
  };

  const offset = (page - 1) * limit;
  const { count: total, rows: partners } = await Partner.findAndCountAll({
    where,
    order: [["ratingsAverage", "DESC"]],
    offset,
    limit,
    attributes: ["id", "name", "profilePicture", "bio", "experience", "ratingsAverage", "ratingsCount",
      "locationLat", "locationLng", "locationCity", "locationAddress"],
  });

  const partnersWithDistance = partners.map((p) => {
    const obj = p.get({ plain: true });
    if (p.locationLat && p.locationLng) {
      const dLat = (p.locationLat - lat) * (Math.PI / 180);
      const dLng = (p.locationLng - lng) * (Math.PI / 180);
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat * (Math.PI / 180)) * Math.cos(p.locationLat * (Math.PI / 180)) * Math.sin(dLng / 2) ** 2;
      obj.distanceKm = parseFloat((6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(2));
    }
    return obj;
  });

  partnersWithDistance.sort((a, b) => (a.distanceKm || 999) - (b.distanceKm || 999));
  return { data: partnersWithDistance, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};

module.exports = { getCategories, getSubcategories, getServices, getServiceById, getNearbyPartners };
