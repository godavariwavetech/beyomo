import { get } from './http';

function toQuery(params) {
  const usp = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') usp.set(k, v);
  });
  const qs = usp.toString();
  return qs ? `?${qs}` : '';
}

function normalizeService(s) {
  return {
    ...s,
    price: parseFloat(s.basePrice ?? s.price ?? 0),
    originalPrice: s.originalPrice ? parseFloat(s.originalPrice) : undefined,
  };
}

export const getCategories = (cityId) => get(`/api/v1/services/categories${toQuery({ cityId })}`);

export const getServices = async ({ categoryId, search, cityId, page = 1, limit = 20 } = {}) => {
  const res = await get(`/api/v1/services${toQuery({ categoryId, search, cityId, page, limit })}`);
  return { ...res, data: (res.data || []).map(normalizeService) };
};

export const getServiceById = async (id) => {
  const res = await get(`/api/v1/services/${id}`);
  return { ...res, data: normalizeService(res.data) };
};
