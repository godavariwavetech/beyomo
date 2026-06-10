import { useAdminResource } from './useAdminResource';

export function useSettings() {
  return useAdminResource('/api/v1/admin/settings');
}
