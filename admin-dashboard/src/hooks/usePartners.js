import {useAdminResource} from './useAdminResource';

export function usePartners() {
  return useAdminResource('/api/v1/admin/partners');
}
