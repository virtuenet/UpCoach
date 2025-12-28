import { Request, Response, NextFunction } from 'express';
import { tenantManagementService } from './TenantManagementService';

/**
 * Tenant Context
 */
export interface TenantContext {
  tenantId: string;
  tenant: any;
}

declare global {
  namespace Express {
    interface Request {
      tenant?: TenantContext;
    }
  }
}

/**
 * Tenant Isolation Middleware
 *
 * Extracts tenant information from request and ensures data isolation.
 * Supports tenant identification via:
 * 1. Custom domain (coaching.company.com)
 * 2. Subdomain (company.upcoach.com)
 * 3. Path prefix (/api/v1/:tenantSlug/*)
 * 4. Header (X-Tenant-ID)
 */
export async function tenantIsolationMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    let tenant = null;

    // Method 1: Check custom domain
    const host = req.get('host') || '';
    if (!host.includes('upcoach.com')) {
      tenant = await tenantManagementService.getTenantByDomain(host);
    }

    // Method 2: Check subdomain
    if (!tenant && host.includes('.upcoach.com')) {
      const subdomain = host.split('.')[0];
      if (subdomain !== 'api' && subdomain !== 'www') {
        tenant = await tenantManagementService.getTenantBySlug(subdomain);
      }
    }

    // Method 3: Check path prefix
    if (!tenant) {
      const pathMatch = req.path.match(/^\/api\/v1\/([^\/]+)/);
      if (pathMatch) {
        const slug = pathMatch[1];
        tenant = await tenantManagementService.getTenantBySlug(slug);
      }
    }

    // Method 4: Check header
    if (!tenant) {
      const tenantId = req.get('X-Tenant-ID');
      if (tenantId) {
        tenant = await tenantManagementService.getTenant(tenantId);
      }
    }

    if (!tenant) {
      res.status(400).json({
        error: 'Tenant not found',
        message: 'Unable to identify tenant from request',
      });
      return;
    }

    if (tenant.status === 'suspended') {
      res.status(403).json({
        error: 'Tenant suspended',
        message: 'This tenant account has been suspended',
      });
      return;
    }

    // Attach tenant context to request
    req.tenant = {
      tenantId: tenant.id,
      tenant,
    };

    next();
  } catch (error: any) {
    res.status(500).json({
      error: 'Tenant resolution failed',
      message: error.message,
    });
  }
}

/**
 * Require Tenant Feature Middleware
 */
export function requireFeature(featureName: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.tenant) {
      res.status(400).json({ error: 'Tenant context not found' });
      return;
    }

    const hasFeature = (req.tenant.tenant.features as any)[featureName];

    if (!hasFeature) {
      res.status(403).json({
        error: 'Feature not available',
        message: `The '${featureName}' feature is not enabled for this tenant`,
      });
      return;
    }

    next();
  };
}

/**
 * Tenant-aware Database Query Helper
 *
 * Ensures all database queries automatically filter by tenantId
 */
export class TenantQueryBuilder {
  /**
   * Add tenant filter to query
   */
  static addTenantFilter(query: any, tenantId: string): any {
    return {
      ...query,
      where: {
        ...query.where,
        tenantId,
      },
    };
  }

  /**
   * Create tenant-scoped record
   */
  static addTenantId(data: any, tenantId: string): any {
    return {
      ...data,
      tenantId,
    };
  }
}
