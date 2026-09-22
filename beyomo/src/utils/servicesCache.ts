/**
 * Session-lived cache of services already fetched for a given category (scoped by
 * city, since results differ per city). Lets switching back to an already-visited
 * Category or Subcategory show its data immediately instead of hitting the network
 * again — a plain in-memory Map is enough since it only needs to survive navigation
 * within this app session, not a restart. Cleared per-key by an explicit
 * pull-to-refresh, not automatically, so browsing stays instant by default.
 */
const cache = new Map<string, any[]>();

const cacheKey = (categoryId: any, cityId: any) => `${categoryId ?? ''}|${cityId ?? ''}`;

export const getCachedServices = (categoryId: any, cityId: any): any[] | undefined =>
  cache.get(cacheKey(categoryId, cityId));

export const setCachedServices = (categoryId: any, cityId: any, data: any[]) => {
  cache.set(cacheKey(categoryId, cityId), Array.isArray(data) ? data : []);
};

export const clearCachedServices = (categoryId: any, cityId: any) => {
  cache.delete(cacheKey(categoryId, cityId));
};
