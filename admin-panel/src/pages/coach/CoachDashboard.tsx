import React, { useState, useEffect, useCallback, useMemo, useRef, useContext } from 'react';
import { useNavigate, useParams, useLocation, Link } from 'react-router-dom';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import Grid from '@mui/material';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  LinearProgress,
  Alert,
} from '@mui/material';
import {
  Edit as EditIcon,
  Visibility as ViewIcon,
  TrendingUp as TrendingUpIcon,
  Article as ArticleIcon,
  Publish as PublishIcon,
  Create as CreateIcon,
  Analytics as AnalyticsIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';

interface DashboardData {
  stats: {
    totalArticles: number;
    publishedArticles: number;
    draftArticles: number;
    totalViews: number;
  };
  recentArticles: Article[];
  popularArticles: Article[];
  performance?: PerformanceData;
}

interface Article {
  id: number;
  title: string;
  status: string;
  viewCount: number;
  category?: { name: string };
  publishedAt?: string;
  updatedAt: string;
}

interface PerformanceData {
  viewsOverTime: { date: string; views: number }[];
  topCategories: { category: string; count: number }[];
  engagementRate: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const CoachDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [dashboardRes, performanceRes] = await Promise.all([
        api.get('/coach-content/dashboard'),
        api.get(`/coach-content/performance?period=${selectedPeriod}`),
      ]);

      setDashboardData({
        ...dashboardRes.data.data,
        performance: performanceRes.data.data,
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'success';
      case 'draft':
        return 'default';
      case 'review':
        return 'warning';
      default:
        return 'default';
    }
  };

  if (loading) {
    return <LinearProgress />;
  }

  if (!dashboardData) {
    return <Alert severity="error">Failed to load dashboard data</Alert>;
  }

  const { stats, recentArticles, popularArticles, performance } = dashboardData;

  return (
    <Box>
      <PageHeader
        title="Content Dashboard"
        subtitle="Manage and track your content performance"
        action={
          <Button
            variant="contained"
            startIcon={<CreateIcon />}
            onClick={() => navigate('/coach/content/new')}
          >
            Create Article
          </Button>
        }
      />

      {/* Stats Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Articles"
            value={stats.totalArticles}
            icon={<ArticleIcon />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Published"
            value={stats.publishedArticles}
            icon={<PublishIcon />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Drafts"
            value={stats.draftArticles}
            icon={<EditIcon />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Views"
            value={stats.totalViews.toLocaleString()}
            icon={<ViewIcon />}
            color="info"
          />
        </Grid>
      </Grid>

      {/* Performance Charts */}
      {performance && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Views Over Time
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performance.viewsOverTime}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="views" stroke="#8884d8" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Content by Category
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={performance.topCategories}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ category, percent }) =>
                        `${category} ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {performance.topCategories.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Grid container spacing={3}>
        {/* Recent Articles */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Recent Articles</Typography>
                <Button size="small" onClick={() => navigate('/coach/content')}>
                  View All
                </Button>
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Title</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentArticles.map(article => (
                      <TableRow key={article.id}>
                        <TableCell>
                          <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                            {article.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {format(new Date(article.updatedAt), 'MMM dd, yyyy')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={article.status}
                            size="small"
                            color={getStatusColor(article.status) as any}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/coach/content/${article.id}/edit`)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/coach/content/${article.id}/analytics`)}
                          >
                            <AnalyticsIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Popular Articles */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Popular Articles</Typography>
                <TrendingUpIcon color="action" />
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Title</TableCell>
                      <TableCell align="center">Views</TableCell>
                      <TableCell align="center">Category</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {popularArticles.map(article => (
                      <TableRow key={article.id}>
                        <TableCell>
                          <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                            {article.title}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" color="primary">
                            {article.viewCount.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={article.category?.name || 'Uncategorized'}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Quick Actions
        </Typography>
        <Grid container spacing={2}>
          <Grid>
            <Button
              variant="outlined"
              startIcon={<ScheduleIcon />}
              onClick={() => navigate('/coach/content/calendar')}
            >
              Content Calendar
            </Button>
          </Grid>
          <Grid>
            <Button
              variant="outlined"
              startIcon={<AnalyticsIcon />}
              onClick={() => navigate('/coach/analytics')}
            >
              Analytics Overview
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default CoachDashboard;
