import { apiClient } from './api';

export type OrgBranding = {
  primaryColor?: string;
  secondaryColor?: string;
  logoUrl?: string;
  fontFamily?: string;
};

export async function fetchOrgBranding(orgId: string): Promise<OrgBranding> {
  const { data } = await apiClient.get(`/api/v2/orgs/${encodeURIComponent(orgId)}/branding`);
  return data?.data || {};
}


