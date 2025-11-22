import { z } from 'zod';
import { ApiError } from '../utils/apiError';

export type TenantRole = 'owner' | 'admin' | 'coach' | 'member' | 'viewer';

export interface TenantMembership {
  id: string;
  tenantId: string;
  userId: string;
  role: TenantRole;
  status: 'active' | 'invited' | 'suspended';
  createdAt: Date;
  updatedAt: Date;
}

export const membershipSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  userId: z.string().uuid(),
  role: z.enum(['owner', 'admin', 'coach', 'member', 'viewer']),
  status: z.enum(['active', 'invited', 'suspended']).default('active'),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const TENANT_ROLE_HIERARCHY: Record<TenantRole, number> = {
  owner: 5,
  admin: 4,
  coach: 3,
  member: 2,
  viewer: 1,
};

export const assertTenantRole = (
  membership: TenantMembership | null,
  minimumRole: TenantRole,
  context?: { tenantId?: string; action?: string }
) => {
  if (!membership || membership.status !== 'active') {
    throw new ApiError(403, 'Tenant membership required', {
      tenantId: context?.tenantId,
      action: context?.action,
    });
  }

  const hasRole =
    TENANT_ROLE_HIERARCHY[membership.role] >= TENANT_ROLE_HIERARCHY[minimumRole];

  if (!hasRole) {
    throw new ApiError(403, 'Insufficient tenant role', {
      requiredRole: minimumRole,
      actualRole: membership.role,
      tenantId: context?.tenantId,
      action: context?.action,
    });
  }
};


