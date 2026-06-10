import {useAdminResource} from './useAdminResource';

export function useCoupons() {
  return useAdminResource('/api/v1/admin/coupons');
}

export function useReferral() {
  return useAdminResource('/api/v1/admin/referral');
}
