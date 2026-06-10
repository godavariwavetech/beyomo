import {useAdminResource} from './useAdminResource';

export function useServices() {
  return useAdminResource('/api/v1/admin/services');
}

export function useCategories() {
  return useAdminResource('/api/v1/admin/services/categories');
}
