import {useAdminResource} from './useAdminResource';

export function useSettlements() {
  return useAdminResource('/api/v1/admin/settlements/partners');
}
