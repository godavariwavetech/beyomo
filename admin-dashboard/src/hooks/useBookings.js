import {useAdminResource} from './useAdminResource';

export function useBookings() {
  return useAdminResource('/api/v1/admin/bookings');
}
