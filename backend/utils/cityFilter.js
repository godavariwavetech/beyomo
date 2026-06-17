const { Op } = require("sequelize");

// Parses a comma-separated "1,2,3" query param into an array of positive integers, or null.
const parseCityIds = (q) => {
  if (!q) return null;
  const ids = String(q).split(",").map(Number).filter(n => Number.isInteger(n) && n > 0);
  return ids.length ? ids : null;
};

// Builds a Sequelize where-clause fragment for a city-id column. Pass a custom `field`
// for models that store the column under a different name (e.g. "locationCityId").
const cityIdsFilter = (cityIds, field = "cityId") => {
  if (!cityIds?.length) return {};
  return { [field]: cityIds.length === 1 ? cityIds[0] : { [Op.in]: cityIds } };
};

module.exports = { parseCityIds, cityIdsFilter };
