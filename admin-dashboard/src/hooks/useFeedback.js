import {useAdminResource} from './useAdminResource';

export function useFeedback() {
  return useAdminResource('/api/v1/admin/feedback');
}
