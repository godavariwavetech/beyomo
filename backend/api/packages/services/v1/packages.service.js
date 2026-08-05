const { Op } = require("sequelize");
const { sequelize } = require("../../../../utils/dbconnect");
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

// Enrich a fixed package — resolve service details from an already-fetched map of
// {id: Service}, so callers doing this for many packages at once make one shared
// lookup query instead of firing one query per package.
const enrichFixedFromMap = (pkg, serviceMap) => {
  const plain = pkg.get ? pkg.get({ plain: true }) : { ...pkg };
  if (plain.packageType !== "fixed") return plain;
  plain.services = (plain.services ?? []).map((s) => ({
    ...s,
    name: serviceMap[s.serviceId]?.name ?? s.name,
    price: parseFloat(serviceMap[s.serviceId]?.basePrice ?? s.price ?? 0),
    duration: serviceMap[s.serviceId]?.duration ?? s.duration,
    image: serviceMap[s.serviceId]?.image ?? s.image,
  }));
  return plain;
};

// Single-package version (e.g. getById) — one query is fine when there's only one package.
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
  return enrichFixedFromMap(plain, map);
};

const listActive = async (cityId) => {
  const pkgs = await ServicePackage.findAll({
    where: activeWhere(),
    order: [["sortOrder", "ASC"], ["createdAt", "DESC"]],
  });

  // Batch-resolve every fixed package's service details in one query instead of
  // one query per package (which was blowing through the DB connection pool).
  const allServiceIds = [...new Set(
    pkgs.flatMap((pkg) => {
      const plain = pkg.get({ plain: true });
      return plain.packageType === "fixed" ? (plain.services ?? []).map((s) => s.serviceId).filter(Boolean) : [];
    })
  )];
  const dbServices = allServiceIds.length
    ? await Service.findAll({ where: { id: allServiceIds }, attributes: ["id", "name", "basePrice", "duration", "image"] })
    : [];
  const serviceMap = Object.fromEntries(dbServices.map((s) => [s.id, s]));

  const all = pkgs.map((pkg) => enrichFixedFromMap(pkg, serviceMap));

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

const listAll = async ({ page = 1, limit = 20, cityIds } = {}) => {
  // cityIds is a JSON array column (empty/null = available in all cities), so filtering
  // can't be a SQL where-clause — fetch all, filter, then paginate in application code.
  const rows = await ServicePackage.findAll({ order: [["sortOrder", "ASC"], ["createdAt", "DESC"]] });
  let data = rows.map((r) => r.get({ plain: true }));

  if (cityIds?.length) {
    const wanted = cityIds.map(Number);
    data = data.filter(p => {
      const ids = (p.cityIds ?? []).map(Number);
      return ids.length === 0 || ids.some(id => wanted.includes(id));
    });
  }

  const total = data.length;
  const offset = (page - 1) * limit;
  return { total, data: data.slice(offset, offset + limit) };
};

// Bulk-persist a new display order within a single packageType ('fixed' or
// 'flexible' are ordered independently, matching how each is a separate admin
// list). `orderedIds` is the full list of package IDs in the order they
// should appear; index becomes sortOrder.
const reorderPackages = async (packageType, orderedIds) => {
  return sequelize.transaction(async (t) => {
    await Promise.all(
      orderedIds.map((id, index) =>
        ServicePackage.update({ sortOrder: index }, { where: { id, packageType }, transaction: t })
      )
    );
  });
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

module.exports = { listActive, getById, listAll, createPackage, updatePackage, deletePackage, validateForBooking, reorderPackages };
