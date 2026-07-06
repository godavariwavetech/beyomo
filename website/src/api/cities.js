import { get } from './http';

export const getActiveCities = () => get('/api/v1/cities/active');
