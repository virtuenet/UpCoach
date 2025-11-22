import apiClient from './api';
import { TenantOption } from '../stores/tenantStore';

export const fetchTenants = async (): Promise<TenantOption[]> => {
  const { data } = await apiClient.get<{ success: boolean; data: TenantOption[] }>('/users/tenants');
  return data.data;
};


