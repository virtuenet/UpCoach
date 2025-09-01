import { Box, Typography, Card, CardContent } from '@mui/material';
import { People } from '@mui/icons-material';

export default function UsersPage() {
  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 600, mb: 3 }}>
        User Management
      </Typography>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <People color="primary" />
            <Typography variant="h6">Users Dashboard</Typography>
          </Box>
          <Typography color="text.secondary">
            User management functionality will be implemented here.
            This includes user listings, role management, and user activity monitoring.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}