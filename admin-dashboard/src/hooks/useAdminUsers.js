import {useAdminResource} from './useAdminResource';

export function useAdminUsers() {
  return useAdminResource('/api/v1/admin/admin-users');
}
