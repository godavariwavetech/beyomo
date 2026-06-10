import {useAdminResource} from './useAdminResource';

export function useReviews() {
  return useAdminResource('/api/v1/admin/reviews');
}
