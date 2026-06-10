import {useAdminResource} from './useAdminResource';

export function useUsers() {
  return useAdminResource('/api/v1/admin/users');
}
