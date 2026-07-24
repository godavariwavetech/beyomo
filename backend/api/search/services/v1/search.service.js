const servicesService = require("../../../services/services/v1/services.service");
const packagesService = require("../../../packages/services/v1/packages.service");
const offersService = require("../../../offers/services/v1/offers.service");

const matches = (text, needle) => (text ?? "").toLowerCase().includes(needle);

const globalSearch = async ({ q, cityId, limit = 10 }) => {
  const needle = q.toLowerCase();

  const [categories, servicesResult, allPackages, allOffers] = await Promise.all([
    servicesService.getCategories({ cityId }),
    servicesService.getServices({ search: q, cityId }, 1, limit),
    packagesService.listActive(cityId),
    offersService.listActive(cityId),
  ]);

  const matchedCategories = categories
    .filter((c) => matches(c.name, needle) || matches(c.description, needle))
    .slice(0, limit);

  const matchedPackages = allPackages
    .filter((p) => matches(p.title, needle) || matches(p.description, needle))
    .slice(0, limit);

  const matchedOffers = allOffers
    .filter((o) => matches(o.title, needle) || matches(o.description, needle))
    .slice(0, limit);

  return {
    categories: matchedCategories,
    services: servicesResult.data,
    packages: matchedPackages,
    offers: matchedOffers,
    total: matchedCategories.length + servicesResult.data.length + matchedPackages.length + matchedOffers.length,
  };
};

module.exports = { globalSearch };
