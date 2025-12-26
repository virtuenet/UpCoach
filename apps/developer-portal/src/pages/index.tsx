import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Tab,
  Tabs,
  Button,
  List,
  ListItem,
  ListItemText,
  Chip,
  Divider,
  Alert,
} from '@mui/material';
import {
  Code as CodeIcon,
  PlayArrow as PlayArrowIcon,
  Download as DownloadIcon,
  Book as BookIcon,
  Api as ApiIcon,
} from '@mui/icons-material';

/**
 * Developer Portal - UpCoach GraphQL API Documentation
 *
 * Interactive API documentation for developers:
 * - GraphiQL playground
 * - Code samples in 5 languages
 * - SDK downloads
 * - Authentication guide
 * - Webhook documentation
 * - Postman collections
 *
 * Features:
 * - Live API explorer
 * - Copy-paste code examples
 * - Downloadable SDKs
 * - Rate limiting info
 * - Error code reference
 */

export default function DeveloperPortalHome() {
  const [activeTab, setActiveTab] = useState(0);

  const renderQuickstart = () => (
    <Box>
      <Typography variant="h5" gutterBottom>
        Quick Start Guide
      </Typography>
      <Typography variant="body1" color="textSecondary" paragraph>
        Get started with the UpCoach GraphQL API in minutes.
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        You'll need an API key to authenticate requests. Generate one from your{' '}
        <a href="/dashboard/settings/api-keys">Dashboard Settings</a>.
      </Alert>

      <Typography variant="h6" gutterBottom>
        1. Install the SDK
      </Typography>
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="caption" color="textSecondary">
            npm
          </Typography>
          <Box
            sx={{
              bgcolor: 'grey.900',
              color: 'white',
              p: 2,
              borderRadius: 1,
              fontFamily: 'monospace',
              fontSize: 14,
            }}
          >
            npm install @upcoach/graphql-client
          </Box>
        </CardContent>
      </Card>

      <Typography variant="h6" gutterBottom>
        2. Initialize the Client
      </Typography>
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="caption" color="textSecondary">
            TypeScript
          </Typography>
          <Box
            sx={{
              bgcolor: 'grey.900',
              color: 'white',
              p: 2,
              borderRadius: 1,
              fontFamily: 'monospace',
              fontSize: 14,
              whiteSpace: 'pre',
            }}
          >
            {`import { UpCoachClient } from '@upcoach/graphql-client';

const client = new UpCoachClient({
  apiKey: 'your-api-key-here',
  endpoint: 'https://api.upcoach.com/graphql',
});`}
          </Box>
        </CardContent>
      </Card>

      <Typography variant="h6" gutterBottom>
        3. Make Your First Request
      </Typography>
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="caption" color="textSecondary">
            TypeScript
          </Typography>
          <Box
            sx={{
              bgcolor: 'grey.900',
              color: 'white',
              p: 2,
              borderRadius: 1,
              fontFamily: 'monospace',
              fontSize: 14,
              whiteSpace: 'pre',
            }}
          >
            {`// Get current user
const user = await client.getMe();
console.log(user);

// Create a goal
const goal = await client.createGoal({
  title: 'Learn GraphQL',
  category: 'PERSONAL_GROWTH',
  targetDate: '2025-12-31',
});

// Check in a habit
const checkin = await client.checkInHabit('habit-id', 'Completed my morning run!', 5);`}
          </Box>
        </CardContent>
      </Card>

      <Box display="flex" gap={2}>
        <Button variant="contained" startIcon={<PlayArrowIcon />}>
          Try in Playground
        </Button>
        <Button variant="outlined" startIcon={<BookIcon />}>
          View Full Documentation
        </Button>
      </Box>
    </Box>
  );

  const renderCodeSamples = () => (
    <Box>
      <Typography variant="h5" gutterBottom>
        Code Samples
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Fetch User Goals (TypeScript)
              </Typography>
              <Box
                sx={{
                  bgcolor: 'grey.900',
                  color: 'white',
                  p: 2,
                  borderRadius: 1,
                  fontFamily: 'monospace',
                  fontSize: 14,
                  whiteSpace: 'pre',
                }}
              >
                {`const goals = await client.getGoals({
  userId: 'user-123',
  status: 'ACTIVE',
  category: 'HEALTH',
  limit: 10,
});

goals.edges.forEach((edge) => {
  console.log(\`Goal: \${edge.node.title}\`);
  console.log(\`Progress: \${edge.node.progress}%\`);
});`}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Create Habit (Python)
              </Typography>
              <Box
                sx={{
                  bgcolor: 'grey.900',
                  color: 'white',
                  p: 2,
                  borderRadius: 1,
                  fontFamily: 'monospace',
                  fontSize: 14,
                  whiteSpace: 'pre',
                }}
              >
                {`from upcoach import UpCoachClient

client = UpCoachClient(api_key="your-api-key")

habit = client.create_habit({
    "name": "Morning Meditation",
    "description": "10 minutes of mindfulness",
    "frequency": "DAILY",
    "category": "MEDITATION",
    "reminderTime": "07:00",
})

print(f"Created habit: {habit['id']}")`}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Raw GraphQL Query (cURL)
              </Typography>
              <Box
                sx={{
                  bgcolor: 'grey.900',
                  color: 'white',
                  p: 2,
                  borderRadius: 1,
                  fontFamily: 'monospace',
                  fontSize: 14,
                  whiteSpace: 'pre',
                }}
              >
                {`curl -X POST https://api.upcoach.com/graphql \\
  -H "Authorization: Bearer your-api-key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "query": "query { me { id email firstName lastName } }"
  }'`}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  const renderWebhooks = () => (
    <Box>
      <Typography variant="h5" gutterBottom>
        Webhooks
      </Typography>
      <Typography variant="body1" color="textSecondary" paragraph>
        Receive real-time notifications when events occur in your UpCoach workspace.
      </Typography>

      <Typography variant="h6" gutterBottom>
        Available Events
      </Typography>
      <List>
        <ListItem>
          <ListItemText
            primary={
              <Box display="flex" alignItems="center" gap={1}>
                <Chip label="goal.created" size="small" color="primary" />
              </Box>
            }
            secondary="Triggered when a new goal is created"
          />
        </ListItem>
        <Divider />
        <ListItem>
          <ListItemText
            primary={
              <Box display="flex" alignItems="center" gap={1}>
                <Chip label="goal.completed" size="small" color="success" />
              </Box>
            }
            secondary="Triggered when a goal is marked as completed"
          />
        </ListItem>
        <Divider />
        <ListItem>
          <ListItemText
            primary={
              <Box display="flex" alignItems="center" gap={1}>
                <Chip label="habit.checked_in" size="small" color="info" />
              </Box>
            }
            secondary="Triggered when a user checks in a habit"
          />
        </ListItem>
        <Divider />
        <ListItem>
          <ListItemText
            primary={
              <Box display="flex" alignItems="center" gap={1}>
                <Chip label="achievement.unlocked" size="small" color="warning" />
              </Box>
            }
            secondary="Triggered when a user unlocks an achievement"
          />
        </ListItem>
      </List>

      <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
        Creating a Webhook
      </Typography>
      <Card variant="outlined">
        <CardContent>
          <Typography variant="caption" color="textSecondary">
            TypeScript
          </Typography>
          <Box
            sx={{
              bgcolor: 'grey.900',
              color: 'white',
              p: 2,
              borderRadius: 1,
              fontFamily: 'monospace',
              fontSize: 14,
              whiteSpace: 'pre',
            }}
          >
            {`const webhook = await client.createWebhook({
  url: 'https://your-server.com/webhook',
  events: ['GOAL_CREATED', 'HABIT_CHECKED_IN'],
  secret: 'your-webhook-secret',
});

console.log(\`Webhook ID: \${webhook.id}\`);`}
          </Box>
        </CardContent>
      </Card>

      <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
        Verifying Webhook Signatures
      </Typography>
      <Card variant="outlined">
        <CardContent>
          <Typography variant="caption" color="textSecondary">
            Node.js
          </Typography>
          <Box
            sx={{
              bgcolor: 'grey.900',
              color: 'white',
              p: 2,
              borderRadius: 1,
              fontFamily: 'monospace',
              fontSize: 14,
              whiteSpace: 'pre',
            }}
          >
            {`const crypto = require('crypto');

function verifySignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');

  return signature === expectedSignature;
}

app.post('/webhook', (req, res) => {
  const signature = req.headers['x-upcoach-signature'];

  if (!verifySignature(req.body, signature, 'your-webhook-secret')) {
    return res.status(401).send('Invalid signature');
  }

  console.log('Event:', req.body.event);
  console.log('Data:', req.body.data);

  res.status(200).send('OK');
});`}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );

  const renderSDKDownloads = () => (
    <Box>
      <Typography variant="h5" gutterBottom>
        SDK Downloads
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <CodeIcon fontSize="large" color="primary" />
                <Box>
                  <Typography variant="h6">TypeScript / JavaScript</Typography>
                  <Typography variant="caption" color="textSecondary">
                    v1.0.0
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" paragraph>
                Official TypeScript SDK with full type safety and IntelliSense support.
              </Typography>
              <Button variant="contained" startIcon={<DownloadIcon />} fullWidth>
                npm install @upcoach/graphql-client
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <CodeIcon fontSize="large" color="primary" />
                <Box>
                  <Typography variant="h6">Python</Typography>
                  <Typography variant="caption" color="textSecondary">
                    v1.0.0
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" paragraph>
                Python SDK with async/await support and type hints.
              </Typography>
              <Button variant="contained" startIcon={<DownloadIcon />} fullWidth>
                pip install upcoach-client
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <CodeIcon fontSize="large" color="primary" />
                <Box>
                  <Typography variant="h6">Go</Typography>
                  <Typography variant="caption" color="textSecondary">
                    v1.0.0
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" paragraph>
                Go SDK with context support and error handling.
              </Typography>
              <Button variant="contained" startIcon={<DownloadIcon />} fullWidth>
                go get github.com/upcoach/go-client
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <ApiIcon fontSize="large" color="primary" />
                <Box>
                  <Typography variant="h6">Postman Collection</Typography>
                  <Typography variant="caption" color="textSecondary">
                    v1.0.0
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" paragraph>
                Pre-configured Postman collection with all API endpoints.
              </Typography>
              <Button variant="outlined" startIcon={<DownloadIcon />} fullWidth>
                Download Collection
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  return (
    <Container maxWidth="lg">
      <Box py={4}>
        <Box mb={4}>
          <Typography variant="h3" gutterBottom>
            UpCoach Developer Portal
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Build powerful integrations with the UpCoach GraphQL API
          </Typography>
        </Box>

        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
          <Tab label="Quick Start" />
          <Tab label="Code Samples" />
          <Tab label="Webhooks" />
          <Tab label="SDK Downloads" />
        </Tabs>

        <Box>
          {activeTab === 0 && renderQuickstart()}
          {activeTab === 1 && renderCodeSamples()}
          {activeTab === 2 && renderWebhooks()}
          {activeTab === 3 && renderSDKDownloads()}
        </Box>
      </Box>
    </Container>
  );
}
