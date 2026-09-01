const ServiceCityMap = require("../../models/service_city_map.model");

/**
 * Build a price resolver for a set of services in a given city.
 *
 * A service's price is `services.basePrice` unless the city has an explicit
 * override in `service_city_map.customPrice`. Every place that stamps a price
 * onto a booking must go through this — otherwise a customer in a city with a
 * higher rate card is silently charged the global base price.
 *
 * Returns (service) => number. With no cityId (or no overrides) it degrades to
 * plain basePrice, so callers can use it unconditionally.
 */
const cityPriceResolver = async (serviceIds = [], cityId = null) => {
  const fallback = (svc) => parseFloat(svc.basePrice ?? 0);
  const ids = [...new Set((serviceIds ?? []).map(Number).filter(Boolean))];
  if (!cityId || ids.length === 0) return fallback;

  const rows = await ServiceCityMap.findAll({
    where: { serviceId: ids, cityId: Number(cityId), isActive: true },
    attributes: ["serviceId", "customPrice"],
  });

  const overrides = new Map(
    rows
      .filter((r) => r.customPrice != null)
      .map((r) => [Number(r.serviceId), parseFloat(r.customPrice)])
  );
  if (overrides.size === 0) return fallback;

  return (svc) => overrides.get(Number(svc.id)) ?? fallback(svc);
};

/** Effective price for one already-loaded mapping row. */
const effectivePrice = (service, mapping) =>
  mapping?.customPrice != null ? parseFloat(mapping.customPrice) : parseFloat(service.basePrice ?? 0);

module.exports = { cityPriceResolver, effectivePrice };
