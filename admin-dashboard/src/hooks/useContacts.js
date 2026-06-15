import { useAdminResource } from './useAdminResource';

export function useContacts() {
  return useAdminResource('/api/v1/contacts');
}
