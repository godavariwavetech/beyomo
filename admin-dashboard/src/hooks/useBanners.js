import { useAdminResource } from './useAdminResource';
export function useBanners() { return useAdminResource('/api/v1/admin/banners'); }
