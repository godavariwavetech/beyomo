import { get } from './http';

export const getBanners = () => get('/api/v1/banners');
