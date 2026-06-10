import {useAdminResource} from './useAdminResource';

export function useNotificationsAdmin() {
  return useAdminResource('/api/v1/admin/notifications');
}
