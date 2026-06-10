import { useAdminResource } from './useAdminResource';
export function useZones() { return useAdminResource('/api/v1/admin/zones'); }
