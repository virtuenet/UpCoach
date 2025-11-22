import { tenantContextMiddleware } from '../tenantContext';
import { logger } from '../../utils/logger';

const mockedDb = {
  findOne: jest.fn(),
};

jest.mock('../../services/database', () => ({
  db: mockedDb,
}));

jest.mock('../../utils/logger', () => ({
  logger: {
    warn: jest.fn(),
  },
}));

const baseReq = {
  headers: {},
  query: {},
  user: { id: 'user-1', email: 'admin@example.com', role: 'admin' },
} as any;

const createRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('tenantContextMiddleware', () => {
  beforeEach(() => {
    mockedDb.findOne.mockReset();
  });

  it('blocks requests without tenant id', async () => {
    const req = { ...baseReq };
    const res = createRes();
    const next = jest.fn();

    await tenantContextMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it('attaches tenant + membership to request', async () => {
    const req = {
      ...baseReq,
      headers: { 'x-tenant-id': 'tenant-1' },
    };
    const res = createRes();
    const next = jest.fn();

    const tenantRow = {
      id: 'tenant-1',
      slug: 'acme',
      name: 'Acme Inc.',
      plan: 'growth',
      status: 'active',
      limits: { seats: 25, storageGb: 100, automationJobs: 50, aiCredits: 1000 },
      settings: { locale: 'en-US', timezone: 'UTC', branding: {} },
      feature_flags: [],
      created_at: new Date(),
      updated_at: new Date(),
    };

    const membershipRow = {
      id: 'membership-1',
      tenant_id: 'tenant-1',
      user_id: 'user-1',
      role: 'admin',
      status: 'active',
      created_at: new Date(),
      updated_at: new Date(),
    };

    mockedDb.findOne.mockImplementation(async (table: string) => {
      if (table === 'tenants') return tenantRow as any;
      if (table === 'tenant_memberships') return membershipRow as any;
      return null as any;
    });

    await tenantContextMiddleware(req, res, next);

    expect(req.tenant?.id).toBe('tenant-1');
    expect(req.membership?.role).toBe('admin');
    expect(next).toHaveBeenCalled();
  });

  it('denies access when membership missing', async () => {
    const req = {
      ...baseReq,
      headers: { 'x-tenant-id': 'tenant-1' },
    };
    const res = createRes();
    const next = jest.fn();

    mockedDb.findOne.mockImplementation(async (table: string) => {
      if (table === 'tenants') {
        return {
          id: 'tenant-1',
          slug: 'acme',
          name: 'Acme',
          plan: 'starter',
          status: 'active',
          limits: { seats: 10, storageGb: 10, automationJobs: 5, aiCredits: 200 },
          settings: { locale: 'en-US', timezone: 'UTC', branding: {} },
          feature_flags: [],
          created_at: new Date(),
          updated_at: new Date(),
        } as any;
      }
      if (table === 'tenant_memberships') {
        return null as any;
      }
      return null as any;
    });

    await tenantContextMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(logger.warn).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });
});


