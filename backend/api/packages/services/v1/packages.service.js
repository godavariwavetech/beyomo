const { Op } = require("sequelize");
const ServicePackage = require("../../models/package.model");
const Service = require("../../../services/models/service.model");
const AppError = require("../../../../utils/errorHandlers/appError");

const activeWhere = () => ({
  isActive: true,
  [Op.or]: [
    { validFrom: null },
    { validFrom: { [Op.lte]: new Date() } },
  ],
  [Op.and]: [{
    [Op.or]: [
      { validTill: null },
      { validTill: { [Op.gte]: new Date() } },
    ],
  }],
});

// Enrich a fixed package — resolve service details from DB
const enrichFixed = async (pkg) => {
  const plain = pkg.get ? pkg.get({ plain: true }) : { ...pkg };
  if (plain.packageType !== "fixed") return plain;
  const ids = (plain.services ?? []).map((s) => s.serviceId).filter(Boolean);
  if (ids.length === 0) return plain;
  const dbServices = await Service.findAll({
    where: { id: ids },
    attributes: ["id", "name", "basePrice", "duration", "image"],
  });
  const map = Object.fromEntries(dbServices.map((s) => [s.id, s]));
  plain.services = (plain.services ?? []).map((s) => ({
    ...s,
    name: map[s.serviceId]?.name ?? s.name,
    price: parseFloat(map[s.serviceId]?.basePrice ?? s.price ?? 0),
    duration: map[s.serviceId]?.duration ?? s.duration,
    image: map[s.serviceId]?.image ?? s.image,
  }));
  return plain;
};

const listActive = async (cityId) => {
  const pkgs = await ServicePackage.findAll({
    where: activeWhere(),
    order: [["createdAt", "DESC"]],
  });
  const all = await Promise.all(pkgs.map(enrichFixed));
  // Filter client-side: package with empty/null cityIds is global; otherwise check if cityId is in the array
  if (!cityId) return all;
  const cid = Number(cityId);
  return all.filter(p => {
    const ids = p.cityIds ?? [];
    return ids.length === 0 || ids.map(Number).includes(cid);
  });
};

const getById = async (id) => {
  const pkg = await ServicePackage.findByPk(id);
  if (!pkg) throw new AppError("Package not found", 404);
  return enrichFixed(pkg);
};

const listAll = async ({ page = 1, limit = 20 } = {}) => {
  const offset = (page - 1) * limit;
  const { count, rows } = await ServicePackage.findAndCountAll({
    order: [["createdAt", "DESC"]],
    limit,
    offset,
  });
  return { total: count, data: rows.map((r) => r.get({ plain: true })) };
};

const createPackage = async (data) => ServicePackage.create(data);

const updatePackage = async (id, data) => {
  const pkg = await ServicePackage.findByPk(id);
  if (!pkg) throw new AppError("Package not found", 404);
  return pkg.update(data);
};

const deletePackage = async (id) => {
  const pkg = await ServicePackage.findByPk(id);
  if (!pkg) throw new AppError("Package not found", 404);
  await pkg.destroy();
};

// Validate a package at booking time and return its price
const validateForBooking = async (packageId) => {
  const pkg = await ServicePackage.findOne({ where: { id: packageId, ...activeWhere() } });
  if (!pkg) throw new AppError("Package not found or expired", 400);
  return pkg;
};

module.exports = { listActive, getById, listAll, createPackage, updatePackage, deletePackage, validateForBooking };
