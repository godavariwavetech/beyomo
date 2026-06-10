import {useAdminResource} from './useAdminResource';

export function useReports() {
  return useAdminResource('/api/v1/admin/reports');
}
