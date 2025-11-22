import { useEffect, useState } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Skeleton,
  Typography,
} from '@mui/material';
import { fetchTenants } from '../services/tenantService';
import { TenantOption, useTenantStore } from '../stores/tenantStore';

export function TenantSwitcher() {
  const { tenants, activeTenant, setTenants, setActiveTenant } = useTenantStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tenants.length > 0 || isLoading) return;
    setIsLoading(true);
    fetchTenants()
      .then((data: TenantOption[]) => {
        setTenants(data);
        setError(null);
      })
      .catch(() => setError('Unable to load tenants'))
      .finally(() => setIsLoading(false));
  }, [tenants.length, isLoading, setTenants]);

  const handleChange = (event: any) => {
    setActiveTenant(event.target.value as string);
  };

  if (isLoading) {
    return <Skeleton variant="rounded" width={220} height={48} />;
  }

  if (error) {
    return (
      <Box>
        <Typography color="error" variant="body2">
          {error}
        </Typography>
      </Box>
    );
  }

  if (!activeTenant) {
    return null;
  }

  return (
    <FormControl size="small" sx={{ minWidth: 220 }}>
      <InputLabel id="tenant-switcher-label">Tenant</InputLabel>
      <Select
        labelId="tenant-switcher-label"
        value={activeTenant.id}
        label="Tenant"
        onChange={handleChange}
      >
        {tenants.map(tenant => (
          <MenuItem key={tenant.id} value={tenant.id}>
            <Box display="flex" flexDirection="column">
              <Typography variant="body2">{tenant.name}</Typography>
              <Typography variant="caption" color="text.secondary">
                {tenant.plan} • {tenant.role}
              </Typography>
            </Box>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}


