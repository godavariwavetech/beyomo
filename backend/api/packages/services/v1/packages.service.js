const { Op } = require("sequelize");
const { sequelize } = require("../../../../utils/dbconnect");
const ServicePackage = require("../../models/package.model");
const Service = require("../../../services/models/service.model");
const AppError = require("../../../../utils/errorHandlers/appError");
const { normalizeSplitInput } = require("../../../../utils/revenueSplit");

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

// Enrich a package's services list — resolve service details from an already-fetched
// map of {id: Service}, so callers doing this for many packages at once make one
// shared lookup query instead of firing one query per package.
//
// Applies to both packageTypes: a 'fixed' package's pre-set services, and a
// 'flexible' package's admin-curated "Eligible Services" list (PackageDetailScreen
// uses that list, when non-empty, as the actual pickable services for the package —
// see the comment there). A 'flexible' package with no curated list has an empty
// `services` array to begin with, so this is a no-op for it either way.
//
// serviceMap is expected to hold only *active* services (see callers below), so a
// serviceId missing from it means that service is inactive/deleted — such entries are
// dropped rather than falling back to the package's own stale cached name/price, which
// would otherwise keep showing (and let a customer pick/book) a service that's no
// longer available at all. This is what actually keeps a package's shown/bookable
// services in sync with the catalog — an admin doesn't need to remember to manually
// edit every package whenever one of its services is deactivated elsewhere.
const enrichFixedFromMap = (pkg, serviceMap) => {
  const plain = pkg.get ? pkg.get({ plain: true }) : { ...pkg };
  plain.services = (plain.services ?? [])
    .filter((s) => serviceMap[s.serviceId])
    .map((s) => ({
      ...s,
      name: serviceMap[s.serviceId].name,
      price: parseFloat(serviceMap[s.serviceId].basePrice ?? 0),
      duration: serviceMap[s.serviceId].duration,
      image: serviceMap[s.serviceId].image,
    }));
  return plain;
};

// Single-package version (e.g. getById) — one query is fine when there's only one package.
const enrichFixed = async (pkg) => {
  const plain = pkg.get ? pkg.get({ plain: true }) : { ...pkg };
  const ids = (plain.services ?? []).map((s) => s.serviceId).filter(Boolean);
  if (ids.length === 0) return plain;
  const dbServices = await Service.findAll({
    where: { id: ids, isActive: true },
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

  // Batch-resolve every package's service details (fixed's pre-set list, or a
  // flexible package's curated eligible-services list) in one query instead of one
  // query per package (which was blowing through the DB connection pool).
  const allServiceIds = [...new Set(
    pkgs.flatMap((pkg) => {
      const plain = pkg.get({ plain: true });
      return (plain.services ?? []).map((s) => s.serviceId).filter(Boolean);
    })
  )];
  const dbServices = allServiceIds.length
    ? await Service.findAll({ where: { id: allServiceIds, isActive: true }, attributes: ["id", "name", "basePrice", "duration", "image"] })
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

const createPackage = async (data) => ServicePackage.create(normalizeSplitInput(data));

const updatePackage = async (id, data) => {
  const pkg = await ServicePackage.findByPk(id);
  if (!pkg) throw new AppError("Package not found", 404);
  return pkg.update(normalizeSplitInput(data));
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
