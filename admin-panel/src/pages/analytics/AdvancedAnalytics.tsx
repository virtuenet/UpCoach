import Grid from "@mui/material/Grid";
import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Tab,
  Tabs,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  LinearProgress,
} from "@mui/material";
import {
  TrendingUp,
  People,
  Timeline,
  FilterList,
  Add,
  Visibility,
  CompareArrows,
  AttachMoney,
  ShowChart,
  Insights,
  DateRange,
  Download,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useSnackbar } from "notistack";
import apiService from "../../services/api";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { format, parseISO, subDays } from "date-fns";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const AdvancedAnalytics: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);

  // Cohort state
  const [cohorts, setCohorts] = useState<any[]>([]);
  const [selectedCohorts, setSelectedCohorts] = useState<number[]>([]);
  const [cohortComparison, setCohortComparison] = useState<any>(null);
  const [cohortDialog, setCohortDialog] = useState(false);
  const [newCohort, setNewCohort] = useState({
    name: "",
    description: "",
    type: "signup_date",
    startDate: subDays(new Date(), 30),
    endDate: new Date(),
  });

  // Funnel state
  const [funnels, setFunnels] = useState<any[]>([]);
  const [selectedFunnel, setSelectedFunnel] = useState<number | null>(null);
  const [funnelAnalytics, setFunnelAnalytics] = useState<any[]>([]);
  const [funnelDialog, setFunnelDialog] = useState(false);
  const [newFunnel, setNewFunnel] = useState({
    name: "",
    description: "",
    steps: [
      { name: "", eventType: "" },
      { name: "", eventType: "" },
    ],
  });

  // Feature adoption state
  const [featureAdoption, setFeatureAdoption] = useState<any[]>([]);
  const [selectedFeature, setSelectedFeature] = useState<string>("");

  // Revenue analytics state
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [revenueGroupBy, setRevenueGroupBy] = useState<
    "day" | "week" | "month"
  >("day");

  // Date filters
  const [dateRange, setDateRange] = useState({
    startDate: subDays(new Date(), 30),
    endDate: new Date(),
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [cohortsRes, funnelsRes, featureRes, revenueRes] =
        await Promise.all([
          apiService.get("/advanced-analytics/cohorts"),
          apiService.get("/advanced-analytics/funnels"),
          apiService.get("/advanced-analytics/feature-adoption"),
          apiService.get("/advanced-analytics/revenue"),
        ]);

      setCohorts(cohortsRes.data.data);
      setFunnels(funnelsRes.data.data);
      setFeatureAdoption(featureRes.data.data);
      setRevenueData(revenueRes.data.data);
    } catch (error) {
      enqueueSnackbar("Failed to fetch analytics data", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  // Cohort functions
  const handleCreateCohort = async () => {
    try {
      await apiService.post("/advanced-analytics/cohorts", newCohort);
      enqueueSnackbar("Cohort created successfully", { variant: "success" });
      setCohortDialog(false);
      setNewCohort({
        name: "",
        description: "",
        type: "signup_date",
        startDate: subDays(new Date(), 30),
        endDate: new Date(),
      });
      fetchData();
    } catch (error) {
      enqueueSnackbar("Failed to create cohort", { variant: "error" });
    }
  };

  const handleCompareCohorts = async (metricType: string) => {
    if (selectedCohorts.length < 2) {
      enqueueSnackbar("Select at least 2 cohorts to compare", {
        variant: "warning",
      });
      return;
    }

    try {
      const response = await apiService.post(
        "/advanced-analytics/cohorts/compare",
        {
          cohortIds: selectedCohorts,
          metricType,
        },
      );
      setCohortComparison({ data: response.data.data, type: metricType });
    } catch (error) {
      enqueueSnackbar("Failed to compare cohorts", { variant: "error" });
    }
  };

  // Funnel functions
  const handleCreateFunnel = async () => {
    try {
      await apiService.post("/advanced-analytics/funnels", newFunnel);
      enqueueSnackbar("Funnel created successfully", { variant: "success" });
      setFunnelDialog(false);
      setNewFunnel({
        name: "",
        description: "",
        steps: [
          { name: "", eventType: "" },
          { name: "", eventType: "" },
        ],
      });
      fetchData();
    } catch (error) {
      enqueueSnackbar("Failed to create funnel", { variant: "error" });
    }
  };

  const handleSelectFunnel = async (funnelId: number) => {
    try {
      setSelectedFunnel(funnelId);
      const response = await apiService.get(
        `/advanced-analytics/funnels/${funnelId}/analytics`,
      );
      setFunnelAnalytics(response.data.data);
    } catch (error) {
      enqueueSnackbar("Failed to fetch funnel analytics", { variant: "error" });
    }
  };

  const addFunnelStep = () => {
    setNewFunnel({
      ...newFunnel,
      steps: [...newFunnel.steps, { name: "", eventType: "" }],
    });
  };

  const updateFunnelStep = (index: number, field: string, value: string) => {
    const updatedSteps = [...newFunnel.steps];
    updatedSteps[index] = { ...updatedSteps[index], [field]: value };
    setNewFunnel({ ...newFunnel, steps: updatedSteps });
  };

  // Revenue functions
  const fetchRevenueData = async () => {
    try {
      const response = await apiService.get("/advanced-analytics/revenue", {
        params: {
          startDate: dateRange.startDate.toISOString(),
          endDate: dateRange.endDate.toISOString(),
          groupBy: revenueGroupBy,
        },
      });
      setRevenueData(response.data.data);
    } catch (error) {
      enqueueSnackbar("Failed to fetch revenue data", { variant: "error" });
    }
  };

  useEffect(() => {
    if (tabValue === 3) {
      fetchRevenueData();
    }
  }, [dateRange, revenueGroupBy, tabValue]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7c7c", "#8dd1e1"];

  if (loading) {
    return (
      <Box sx={{ width: "100%", mt: 4 }}>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <Typography variant="h4" gutterBottom>
          Advanced Analytics
        </Typography>

        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
            <Tab
              label="Cohort Analysis"
              icon={<People />}
              iconPosition="start"
            />
            <Tab
              label="Funnel Analysis"
              icon={<Timeline />}
              iconPosition="start"
            />
            <Tab
              label="Feature Adoption"
              icon={<Insights />}
              iconPosition="start"
            />
            <Tab
              label="Revenue Analytics"
              icon={<AttachMoney />}
              iconPosition="start"
            />
          </Tabs>
        </Box>

        {/* Cohort Analysis Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ mb: 3, display: "flex", gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setCohortDialog(true)}
            >
              Create Cohort
            </Button>
            <Button
              variant="outlined"
              startIcon={<CompareArrows />}
              onClick={() => handleCompareCohorts("retention")}
              disabled={selectedCohorts.length < 2}
            >
              Compare Retention
            </Button>
            <Button
              variant="outlined"
              startIcon={<AttachMoney />}
              onClick={() => handleCompareCohorts("revenue")}
              disabled={selectedCohorts.length < 2}
            >
              Compare Revenue
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <input type="checkbox" />
                  </TableCell>
                  <TableCell>Cohort Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Users</TableCell>
                  <TableCell>Day 7 Retention</TableCell>
                  <TableCell>Day 30 Retention</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cohorts.map((cohort) => (
                  <TableRow key={cohort.id}>
                    <TableCell padding="checkbox">
                      <input
                        type="checkbox"
                        checked={selectedCohorts.includes(cohort.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCohorts([...selectedCohorts, cohort.id]);
                          } else {
                            setSelectedCohorts(
                              selectedCohorts.filter((id) => id !== cohort.id),
                            );
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2">{cohort.name}</Typography>
                      {cohort.description && (
                        <Typography variant="caption" color="textSecondary">
                          {cohort.description}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip label={cohort.cohort_type} size="small" />
                    </TableCell>
                    <TableCell>{cohort.current_user_count || 0}</TableCell>
                    <TableCell>
                      {cohort.day7_retention
                        ? `${cohort.day7_retention}%`
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {cohort.day30_retention
                        ? `${cohort.day30_retention}%`
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {format(parseISO(cohort.created_at), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View Retention">
                        <IconButton
                          size="small"
                          onClick={() => {
                            // Navigate to retention details
                          }}
                        >
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {cohortComparison && (
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Cohort Comparison - {cohortComparison.type}
                </Typography>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={cohortComparison.data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey={
                        cohortComparison.type === "retention"
                          ? "period_number"
                          : "date"
                      }
                    />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    {Array.from(
                      new Set(
                        cohortComparison.data.map((d: any) => d.cohort_name),
                      ),
                    ).map((cohortName, index) => (
                      <Line
                        key={cohortName as string}
                        type="monotone"
                        dataKey={
                          cohortComparison.type === "retention"
                            ? "retention_rate"
                            : "total_revenue"
                        }
                        data={cohortComparison.data.filter(
                          (d: any) => d.cohort_name === cohortName,
                        )}
                        name={cohortName as string}
                        stroke={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabPanel>

        {/* Funnel Analysis Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ mb: 3 }}>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setFunnelDialog(true)}
            >
              Create Funnel
            </Button>
          </Box>

          <Grid container spacing={3}>
            <Grid xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Funnels
                  </Typography>
                  {funnels.map((funnel) => (
                    <Box
                      key={funnel.id}
                      sx={{
                        p: 2,
                        mb: 1,
                        border: "1px solid",
                        borderColor:
                          selectedFunnel === funnel.id
                            ? "primary.main"
                            : "divider",
                        borderRadius: 1,
                        cursor: "pointer",
                      }}
                      onClick={() => handleSelectFunnel(funnel.id)}
                    >
                      <Typography variant="subtitle2">{funnel.name}</Typography>
                      <Typography variant="caption" color="textSecondary">
                        {funnel.total_entries || 0} entries •{" "}
                        {funnel.total_completions || 0} completions
                      </Typography>
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Grid>

            <Grid xs={12} md={8}>
              {selectedFunnel && funnelAnalytics.length > 0 && (
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Funnel Performance
                    </Typography>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={funnelAnalytics} layout="horizontal">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="step" />
                        <YAxis />
                        <RechartsTooltip />
                        <Bar dataKey="users" fill="#8884d8">
                          {funnelAnalytics.map((entry, index) => (
                            <Bar
                              key={`cell-${index}`}
                              fill={`rgba(136, 132, 216, ${1 - index * 0.2})`}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>

                    <Box sx={{ mt: 3 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Conversion Rates
                      </Typography>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Step</TableCell>
                            <TableCell align="right">Users</TableCell>
                            <TableCell align="right">Conversion Rate</TableCell>
                            <TableCell align="right">Drop-off Rate</TableCell>
                            <TableCell align="right">Avg Time</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {funnelAnalytics.map((step) => (
                            <TableRow key={step.step}>
                              <TableCell>{step.step}</TableCell>
                              <TableCell align="right">{step.users}</TableCell>
                              <TableCell align="right">
                                {step.conversionRate}%
                              </TableCell>
                              <TableCell align="right">
                                {step.dropoffRate}%
                              </TableCell>
                              <TableCell align="right">
                                {step.avgTimeToComplete
                                  ? `${Math.round(step.avgTimeToComplete / 60)} min`
                                  : "-"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Box>
                  </CardContent>
                </Card>
              )}
            </Grid>
          </Grid>
        </TabPanel>

        {/* Feature Adoption Tab */}
        <TabPanel value={tabValue} index={2}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Feature Usage Over Time
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={featureAdoption}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  {Array.from(
                    new Set(featureAdoption.map((d) => d.feature_name)),
                  ).map((feature, index) => (
                    <Line
                      key={feature as string}
                      type="monotone"
                      dataKey="unique_users"
                      data={featureAdoption.filter(
                        (d) => d.feature_name === feature,
                      )}
                      name={feature as string}
                      stroke={COLORS[index % COLORS.length]}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Grid container spacing={3} sx={{ mt: 2 }}>
            {Array.from(
              new Set(featureAdoption.map((d) => d.feature_name)),
            ).map((feature) => {
              const latestData = featureAdoption
                .filter((d) => d.feature_name === feature)
                .sort((a, b) => b.date.localeCompare(a.date))[0];

              return (
                <Grid xs={12} md={4} key={feature as string}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6">{feature}</Typography>
                      <Typography variant="h3" color="primary">
                        {latestData?.unique_users || 0}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Unique Users
                      </Typography>
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2">
                          Adoption Rate: {latestData?.adoption_rate || 0}%
                        </Typography>
                        <Typography variant="body2">
                          Avg Uses/User: {latestData?.avg_uses_per_user || 0}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </TabPanel>

        {/* Revenue Analytics Tab */}
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ mb: 3, display: "flex", gap: 2, alignItems: "center" }}>
            <DatePicker
              label="Start Date"
              value={dateRange.startDate}
              onChange={(date) =>
                date && setDateRange({ ...dateRange, startDate: date })
              }
              renderInput={(params) => <TextField {...params} size="small" />}
            />
            <DatePicker
              label="End Date"
              value={dateRange.endDate}
              onChange={(date) =>
                date && setDateRange({ ...dateRange, endDate: date })
              }
              renderInput={(params) => <TextField {...params} size="small" />}
            />
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Group By</InputLabel>
              <Select
                value={revenueGroupBy}
                onChange={(e) => setRevenueGroupBy(e.target.value as any)}
                label="Group By"
              >
                <MenuItem value="day">Day</MenuItem>
                <MenuItem value="week">Week</MenuItem>
                <MenuItem value="month">Month</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Grid container spacing={3}>
            <Grid xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Revenue Trends
                  </Typography>
                  <ResponsiveContainer width="100%" height={400}>
                    <AreaChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey={
                          revenueGroupBy === "day" ? "date" : revenueGroupBy
                        }
                      />
                      <YAxis tickFormatter={(value) => `$${value}`} />
                      <RechartsTooltip
                        formatter={(value: number) => formatCurrency(value)}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="total_revenue"
                        stackId="1"
                        stroke="#8884d8"
                        fill="#8884d8"
                        name="Total Revenue"
                      />
                      <Area
                        type="monotone"
                        dataKey="recurring_revenue"
                        stackId="2"
                        stroke="#82ca9d"
                        fill="#82ca9d"
                        name="Recurring Revenue"
                      />
                      <Area
                        type="monotone"
                        dataKey="new_revenue"
                        stackId="2"
                        stroke="#ffc658"
                        fill="#ffc658"
                        name="New Revenue"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            <Grid xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Average Revenue Per User (ARPU)
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey={
                          revenueGroupBy === "day" ? "date" : revenueGroupBy
                        }
                      />
                      <YAxis tickFormatter={(value) => `$${value}`} />
                      <RechartsTooltip
                        formatter={(value: number) => formatCurrency(value)}
                      />
                      <Line
                        type="monotone"
                        dataKey="avg_arpu"
                        stroke="#8884d8"
                        name="ARPU"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            <Grid xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    MRR Growth Rate
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey={
                          revenueGroupBy === "day" ? "date" : revenueGroupBy
                        }
                      />
                      <YAxis tickFormatter={(value) => `${value}%`} />
                      <RechartsTooltip
                        formatter={(value: number) => `${value}%`}
                      />
                      <ReferenceLine y={0} stroke="#666" />
                      <Line
                        type="monotone"
                        dataKey="avg_mrr_growth"
                        stroke="#82ca9d"
                        name="MRR Growth"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Create Cohort Dialog */}
        <Dialog
          open={cohortDialog}
          onClose={() => setCohortDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Create New Cohort</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Cohort Name"
              value={newCohort.name}
              onChange={(e) =>
                setNewCohort({ ...newCohort, name: e.target.value })
              }
              margin="normal"
            />
            <TextField
              fullWidth
              label="Description"
              value={newCohort.description}
              onChange={(e) =>
                setNewCohort({ ...newCohort, description: e.target.value })
              }
              margin="normal"
              multiline
              rows={2}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Cohort Type</InputLabel>
              <Select
                value={newCohort.type}
                onChange={(e) =>
                  setNewCohort({ ...newCohort, type: e.target.value as any })
                }
                label="Cohort Type"
              >
                <MenuItem value="signup_date">Signup Date</MenuItem>
                <MenuItem value="subscription">Subscription Tier</MenuItem>
                <MenuItem value="behavior">Behavior Based</MenuItem>
                <MenuItem value="custom">Custom</MenuItem>
              </Select>
            </FormControl>
            {newCohort.type === "signup_date" && (
              <Box sx={{ mt: 2 }}>
                <DatePicker
                  label="Start Date"
                  value={newCohort.startDate}
                  onChange={(date) =>
                    date && setNewCohort({ ...newCohort, startDate: date })
                  }
                  renderInput={(params) => (
                    <TextField {...params} fullWidth margin="normal" />
                  )}
                />
                <DatePicker
                  label="End Date"
                  value={newCohort.endDate}
                  onChange={(date) =>
                    date && setNewCohort({ ...newCohort, endDate: date })
                  }
                  renderInput={(params) => (
                    <TextField {...params} fullWidth margin="normal" />
                  )}
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCohortDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateCohort} variant="contained">
              Create
            </Button>
          </DialogActions>
        </Dialog>

        {/* Create Funnel Dialog */}
        <Dialog
          open={funnelDialog}
          onClose={() => setFunnelDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Create New Funnel</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Funnel Name"
              value={newFunnel.name}
              onChange={(e) =>
                setNewFunnel({ ...newFunnel, name: e.target.value })
              }
              margin="normal"
            />
            <TextField
              fullWidth
              label="Description"
              value={newFunnel.description}
              onChange={(e) =>
                setNewFunnel({ ...newFunnel, description: e.target.value })
              }
              margin="normal"
              multiline
              rows={2}
            />
            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
              Funnel Steps
            </Typography>
            {newFunnel.steps.map((step, index) => (
              <Box key={index} sx={{ display: "flex", gap: 2, mb: 2 }}>
                <TextField
                  fullWidth
                  label={`Step ${index + 1} Name`}
                  value={step.name}
                  onChange={(e) =>
                    updateFunnelStep(index, "name", e.target.value)
                  }
                  size="small"
                />
                <TextField
                  fullWidth
                  label="Event Type"
                  value={step.eventType}
                  onChange={(e) =>
                    updateFunnelStep(index, "eventType", e.target.value)
                  }
                  size="small"
                />
              </Box>
            ))}
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={addFunnelStep}
              size="small"
            >
              Add Step
            </Button>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setFunnelDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateFunnel} variant="contained">
              Create
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default AdvancedAnalytics;
