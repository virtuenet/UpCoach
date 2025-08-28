import Grid from "@mui/material/Grid";
import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Chip,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  Button,
} from "@mui/material";
import {
  Psychology as PsychologyIcon,
  TrendingUp as TrendingUpIcon,
  ChatBubble as ChatBubbleIcon,
  Insights as InsightsIcon,
  RecordVoiceOver as VoiceIcon,
  Speed as SpeedIcon,
  AttachMoney as MoneyIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";
import api from "../services/api";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";

interface AIMetrics {
  totalInteractions: number;
  activeUsers: number;
  avgResponseTime: number;
  satisfactionRate: number;
  tokenUsage: {
    total: number;
    cost: number;
    trend: number;
  };
  modelUsage: {
    openai: number;
    claude: number;
  };
}

interface AIInteraction {
  id: string;
  userId: string;
  userName: string;
  type: string;
  model: string;
  tokens: number;
  responseTime: number;
  sentiment: string;
  createdAt: string;
}

const AIAnalytics: React.FC = () => {
  const [metrics, setMetrics] = useState<AIMetrics | null>(null);
  const [interactions, setInteractions] = useState<AIInteraction[]>([]);
  const [usageData, setUsageData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("week");

  useEffect(() => {
    fetchAIData();
  }, [dateRange]);

  const fetchAIData = async () => {
    setLoading(true);
    try {
      const [metricsRes, interactionsRes, usageRes] = await Promise.all([
        api.get(`/analytics/ai/metrics?range=${dateRange}`),
        api.get(`/analytics/ai/interactions?limit=20`),
        api.get(`/analytics/ai/usage?range=${dateRange}`),
      ]);

      setMetrics(metricsRes.data);
      setInteractions(interactionsRes.data);
      setUsageData(usageRes.data);
    } catch (error) {
      console.error("Failed to fetch AI data:", error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ["#3f51b5", "#9c27b0", "#f44336", "#ff9800", "#4caf50"];

  const sentimentColors = {
    positive: "#4caf50",
    neutral: "#ff9800",
    negative: "#f44336",
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("en-US").format(value);
  };

  if (loading) {
    return (
      <Box sx={{ width: "100%", mt: 4 }}>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title="AI Analytics"
        subtitle="Monitor AI service performance and usage"
        action={
          <IconButton onClick={fetchAIData} color="primary">
            <RefreshIcon />
          </IconButton>
        }
      />

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Interactions"
            value={formatNumber(metrics?.totalInteractions || 0)}
            icon={<ChatBubbleIcon />}
            trend={12.5}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active AI Users"
            value={formatNumber(metrics?.activeUsers || 0)}
            icon={<PsychologyIcon />}
            trend={8.3}
            color="secondary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Avg Response Time"
            value={`${metrics?.avgResponseTime || 0}s`}
            icon={<SpeedIcon />}
            trend={-5.2}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="AI Costs (Month)"
            value={formatCurrency(metrics?.tokenUsage.cost || 0)}
            icon={<MoneyIcon />}
            trend={metrics?.tokenUsage.trend || 0}
            color="warning"
          />
        </Grid>
      </Grid>

      {/* Usage Charts */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                AI Usage Trends
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={usageData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) => format(new Date(date), "MMM dd")}
                  />
                  <YAxis />
                  <ChartTooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="conversations"
                    stackId="1"
                    stroke="#3f51b5"
                    fill="#3f51b5"
                    name="Conversations"
                  />
                  <Area
                    type="monotone"
                    dataKey="recommendations"
                    stackId="1"
                    stroke="#9c27b0"
                    fill="#9c27b0"
                    name="Recommendations"
                  />
                  <Area
                    type="monotone"
                    dataKey="voiceAnalysis"
                    stackId="1"
                    stroke="#f44336"
                    fill="#f44336"
                    name="Voice Analysis"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Model Usage Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      {
                        name: "OpenAI GPT-4",
                        value: metrics?.modelUsage.openai || 0,
                      },
                      {
                        name: "Claude 3",
                        value: metrics?.modelUsage.claude || 0,
                      },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    <Cell fill="#3f51b5" />
                    <Cell fill="#9c27b0" />
                  </Pie>
                  <ChartTooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Satisfaction & Performance */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                User Satisfaction Rate
              </Typography>
              <Box sx={{ mt: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <Box sx={{ flex: 1, mr: 2 }}>
                    <LinearProgress
                      variant="determinate"
                      value={metrics?.satisfactionRate || 0}
                      sx={{ height: 10, borderRadius: 5 }}
                      color="success"
                    />
                  </Box>
                  <Typography variant="h4" color="success.main">
                    {metrics?.satisfactionRate || 0}%
                  </Typography>
                </Box>
                <Alert severity="success" sx={{ mt: 2 }}>
                  AI interactions are receiving positive feedback from users
                </Alert>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Response Time Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={[
                    { range: "<1s", count: 45 },
                    { range: "1-2s", count: 35 },
                    { range: "2-3s", count: 15 },
                    { range: ">3s", count: 5 },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <ChartTooltip />
                  <Bar dataKey="count" fill="#3f51b5" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Interactions */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Recent AI Interactions
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Model</TableCell>
                  <TableCell align="center">Tokens</TableCell>
                  <TableCell align="center">Response Time</TableCell>
                  <TableCell align="center">Sentiment</TableCell>
                  <TableCell>Time</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {interactions.map((interaction) => (
                  <TableRow key={interaction.id}>
                    <TableCell>{interaction.userName}</TableCell>
                    <TableCell>
                      <Chip
                        label={interaction.type}
                        size="small"
                        color={
                          interaction.type === "conversation"
                            ? "primary"
                            : interaction.type === "voice"
                              ? "secondary"
                              : "default"
                        }
                      />
                    </TableCell>
                    <TableCell>{interaction.model}</TableCell>
                    <TableCell align="center">{interaction.tokens}</TableCell>
                    <TableCell align="center">
                      {interaction.responseTime}s
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={interaction.sentiment}
                        size="small"
                        style={{
                          backgroundColor:
                            sentimentColors[
                              interaction.sentiment as keyof typeof sentimentColors
                            ],
                          color: "white",
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      {format(new Date(interaction.createdAt), "MMM dd, HH:mm")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Cost Analysis */}
      <Box sx={{ mt: 4 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              AI Service Cost Breakdown
            </Typography>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: "center" }}>
                  <Typography variant="h3" color="primary">
                    {formatNumber(metrics?.tokenUsage.total || 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Tokens Used
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: "center" }}>
                  <Typography variant="h3" color="secondary">
                    {formatCurrency(metrics?.tokenUsage.cost || 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Cost (Month)
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: "center" }}>
                  <Typography variant="h3" color="success.main">
                    $
                    {(
                      (metrics?.tokenUsage.cost || 0) /
                      (metrics?.activeUsers || 1)
                    ).toFixed(2)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Cost per Active User
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default AIAnalytics;
