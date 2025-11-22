import { create } from 'zustand';

export interface TenantOption {
  id: string;
  name: string;
  slug: string;
  plan: string;
  role: string;
}

interface TenantState {
  tenants: TenantOption[];
  activeTenant?: TenantOption;
  setTenants: (tenants: TenantOption[]) => void;
  setActiveTenant: (tenantId: string) => void;
}

export const useTenantStore = create<TenantState>((set, get) => ({
  tenants: [],
  activeTenant: undefined,
  setTenants: tenants => {
    const current = get().activeTenant;
    const nextActive =
      current && tenants.some(tenant => tenant.id === current.id) ? current : tenants[0];
    set({ tenants, activeTenant: nextActive });
  },
  setActiveTenant: tenantId =>
    set(state => ({
      activeTenant: state.tenants.find(t => t.id === tenantId) ?? state.activeTenant,
    })),
}));

export const getActiveTenantId = (): string | null =>
  useTenantStore.getState().activeTenant?.id ?? null;


