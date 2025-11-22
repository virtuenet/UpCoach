import { Box, Typography, Card, CardContent } from '@mui/material';

export default function FlaggedContentPage() {
  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 600, mb: 3 }}>
        FlaggedContentPage
      </Typography>
      <Card>
        <CardContent>
          <Typography color="text.secondary">
            This page is under construction. Functionality will be implemented soon.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
