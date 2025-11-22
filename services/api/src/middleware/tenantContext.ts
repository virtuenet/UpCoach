import { NextFunction, Request, Response } from 'express';
import { db } from '../services/database';
import { tenantFactory, tenantSchema } from '../models/Tenant';
import { membershipSchema, TenantMembership, assertTenantRole } from '../models/TenantMembership';
import { ApiError } from '../utils/apiError';
import { logger } from '../utils/logger';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      tenant?: ReturnType<typeof tenantFactory>;
      membership?: TenantMembership;
    }
  }
}

const resolveTenantId = (req: Request): string | null => {
  return (
    (req.headers['x-tenant-id'] as string) ||
    (req.query.tenantId as string) ||
    (req.user as any)?.tenantId ||
    null
  );
};

export const tenantContextMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const tenantId = resolveTenantId(req);
    if (!tenantId) {
      throw new ApiError(400, 'tenantId header or query parameter is required');
    }

    const tenantRow = await db.findOne('tenants', { id: tenantId });
    if (!tenantRow) {
      throw new ApiError(404, 'Tenant not found');
    }

    const tenant = tenantFactory(
      tenantSchema.parse({
        id: tenantRow.id,
        slug: tenantRow.slug,
        name: tenantRow.name,
        plan: tenantRow.plan,
        status: tenantRow.status,
        limits: tenantRow.limits,
        settings: tenantRow.settings,
        featureFlags: tenantRow.feature_flags ?? tenantRow.featureFlags ?? [],
        createdAt: tenantRow.created_at ?? tenantRow.createdAt,
        updatedAt: tenantRow.updated_at ?? tenantRow.updatedAt,
      })
    );
    req.tenant = tenant;

    if (!req.user) {
      throw new ApiError(401, 'Authentication required for tenant-scoped routes');
    }

    const membershipRow = await db.findOne('tenant_memberships', {
      tenant_id: tenant.id,
      user_id: req.user.id,
    });

    if (!membershipRow) {
      throw new ApiError(403, 'User is not a member of this tenant');
    }

    const membership = membershipSchema.parse({
      id: membershipRow.id,
      tenantId: membershipRow.tenant_id,
      userId: membershipRow.user_id,
      role: membershipRow.role,
      status: membershipRow.status,
      createdAt: membershipRow.created_at ?? membershipRow.createdAt,
      updatedAt: membershipRow.updated_at ?? membershipRow.updatedAt,
    });

    req.membership = membership;

    assertTenantRole(membership, 'member', { tenantId: tenant.id, action: req.path });

    next();
  } catch (error) {
    logger.warn('Tenant context middleware blocked request', {
      path: req.path,
      tenantId: req.headers['x-tenant-id'],
      error: error instanceof Error ? error.message : error,
    });

    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
        metadata: error.metadata,
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Failed to resolve tenant context',
    });
  }
};


