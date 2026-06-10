import { useAdminResource } from './useAdminResource';

export function useEarnings() {
  return useAdminResource('/api/v1/admin/earnings');
}
