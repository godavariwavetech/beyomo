import { useAdminResource } from './useAdminResource';
export function useCities() { return useAdminResource('/api/v1/admin/cities'); }
