import Grid from "@mui/material/Grid";
import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tab,
  Tabs,
  Rating,
  LinearProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip,
} from "@mui/material";
import {
  Search,
  FilterList,
  Edit,
  Delete,
  Visibility,
  Star,
  Schedule,
  AttachMoney,
  Person,
  VerifiedUser,
  Block,
  CheckCircle,
  TrendingUp,
  Groups,
  EventAvailable,
  MonetizationOn,
} from "@mui/icons-material";
import { useSnackbar } from "notistack";
import apiService from "../../services/api";
import { format, parseISO } from "date-fns";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

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
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const AdminCoachMarketplace: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [coaches, setCoaches] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [selectedCoach, setSelectedCoach] = useState<any>(null);
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [verificationFilter, setVerificationFilter] = useState("all");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [coachesRes, sessionsRes, reviewsRes, statsRes] = await Promise.all(
        [
          apiService.get("/coaches/admin/list"),
          apiService.get("/coaches/admin/sessions"),
          apiService.get("/coaches/admin/reviews"),
          apiService.get("/coaches/admin/stats"),
        ],
      );

      setCoaches(coachesRes.data.data);
      setSessions(sessionsRes.data.data);
      setReviews(reviewsRes.data.data);
      setStats(statsRes.data.data);
    } catch (error) {
      enqueueSnackbar("Failed to fetch coach marketplace data", {
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCoachStatus = async (
    coachId: number,
    currentStatus: boolean,
  ) => {
    try {
      await apiService.put(`/coaches/admin/${coachId}/status`, {
        isActive: !currentStatus,
      });
      enqueueSnackbar("Coach status updated successfully", {
        variant: "success",
      });
      fetchData();
    } catch (error) {
      enqueueSnackbar("Failed to update coach status", { variant: "error" });
    }
  };

  const handleVerifyCoach = async (coachId: number) => {
    try {
      await apiService.put(`/coaches/admin/${coachId}/verify`, {
        isVerified: true,
      });
      enqueueSnackbar("Coach verified successfully", { variant: "success" });
      fetchData();
    } catch (error) {
      enqueueSnackbar("Failed to verify coach", { variant: "error" });
    }
  };

  const handleFeatureCoach = async (coachId: number, featured: boolean) => {
    try {
      await apiService.put(`/coaches/admin/${coachId}/feature`, {
        isFeatured: featured,
      });
      enqueueSnackbar(
        featured
          ? "Coach featured successfully"
          : "Coach unfeatured successfully",
        { variant: "success" },
      );
      fetchData();
    } catch (error) {
      enqueueSnackbar("Failed to update coach feature status", {
        variant: "error",
      });
    }
  };

  const handleDeleteReview = async (reviewId: number) => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;

    try {
      await apiService.delete(`/coaches/admin/reviews/${reviewId}`);
      enqueueSnackbar("Review deleted successfully", { variant: "success" });
      fetchData();
    } catch (error) {
      enqueueSnackbar("Failed to delete review", { variant: "error" });
    }
  };

  const filteredCoaches = coaches.filter((coach) => {
    const matchesSearch =
      coach.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coach.user?.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" ? coach.isActive : !coach.isActive);
    const matchesVerification =
      verificationFilter === "all" ||
      (verificationFilter === "verified"
        ? coach.isVerified
        : !coach.isVerified);

    return matchesSearch && matchesStatus && matchesVerification;
  });

  const sessionStatusColors: Record<string, any> = {
    pending: "warning",
    confirmed: "info",
    "in-progress": "primary",
    completed: "success",
    cancelled: "error",
  };

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

  if (loading) {
    return (
      <Box sx={{ width: "100%", mt: 4 }}>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Coach Marketplace Management
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid xs={12} sm={6}, md: {3}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Person sx={{ fontSize: 40, color: "primary.main", mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" variant="body2">
                    Total Coaches
                  </Typography>
                  <Typography variant="h5">
                    {stats?.totalCoaches || 0}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", mt: 2 }}>
                <VerifiedUser
                  sx={{ fontSize: 20, color: "success.main", mr: 1 }}
                />
                <Typography variant="body2" color="success.main">
                  {stats?.verifiedCoaches || 0} Verified
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid xs={12} sm={6}, md: {3}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <EventAvailable
                  sx={{ fontSize: 40, color: "info.main", mr: 2 }}
                />
                <Box>
                  <Typography color="textSecondary" variant="body2">
                    Total Sessions
                  </Typography>
                  <Typography variant="h5">
                    {stats?.totalSessions || 0}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", mt: 2 }}>
                <Schedule sx={{ fontSize: 20, color: "warning.main", mr: 1 }} />
                <Typography variant="body2" color="warning.main">
                  {stats?.upcomingSessions || 0} Upcoming
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid xs={12} sm={6}, md: {3}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <MonetizationOn
                  sx={{ fontSize: 40, color: "success.main", mr: 2 }}
                />
                <Box>
                  <Typography color="textSecondary" variant="body2">
                    Total Revenue
                  </Typography>
                  <Typography variant="h5">
                    ${stats?.totalRevenue?.toFixed(2) || "0.00"}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", mt: 2 }}>
                <TrendingUp
                  sx={{ fontSize: 20, color: "success.main", mr: 1 }}
                />
                <Typography variant="body2" color="success.main">
                  ${stats?.monthlyRevenue?.toFixed(2) || "0.00"} This Month
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid xs={12} sm={6}, md: {3}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Star sx={{ fontSize: 40, color: "warning.main", mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" variant="body2">
                    Average Rating
                  </Typography>
                  <Typography variant="h5">
                    {stats?.averageRating?.toFixed(1) || "0.0"}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", mt: 2 }}>
                <Groups sx={{ fontSize: 20, color: "info.main", mr: 1 }} />
                <Typography variant="body2" color="info.main">
                  {stats?.totalReviews || 0} Reviews
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs value={tabValue} onChange={(_e, v) => setTabValue(v)}>
          <Tab label="Coaches" />
          <Tab label="Sessions" />
          <Tab label="Reviews" />
          <Tab label="Analytics" />
        </Tabs>
      </Box>

      {/* Coaches Tab */}
      <TabPanel value={tabValue} index={0}>
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid xs={12}, md: {4}>
              <TextField
                fullWidth
                placeholder="Search coaches..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid xs={12}, md: {3}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid xs={12}, md: {3}>
              <FormControl fullWidth>
                <InputLabel>Verification</InputLabel>
                <Select
                  value={verificationFilter}
                  onChange={(e) => setVerificationFilter(e.target.value)}
                  label="Verification"
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="verified">Verified</MenuItem>
                  <MenuItem value="unverified">Unverified</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Coach</TableCell>
                <TableCell>Specializations</TableCell>
                <TableCell>Rating</TableCell>
                <TableCell>Sessions</TableCell>
                <TableCell>Hourly Rate</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCoaches.map((coach) => (
                <TableRow key={coach.id}>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Avatar src={coach.profileImageUrl} sx={{ mr: 2 }}>
                        {coach.displayName[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2">
                          {coach.displayName}
                          {coach.isVerified && (
                            <VerifiedUser
                              sx={{
                                ml: 1,
                                fontSize: 16,
                                color: "primary.main",
                              }}
                            />
                          )}
                          {coach.isFeatured && (
                            <Star
                              sx={{
                                ml: 1,
                                fontSize: 16,
                                color: "warning.main",
                              }}
                            />
                          )}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {coach.user?.email}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                      {coach.specializations
                        ?.slice(0, 3)
                        .map((spec: string) => (
                          <Chip key={spec} label={spec} size="small" />
                        ))}
                      {coach.specializations?.length > 3 && (
                        <Chip
                          label={`+${coach.specializations.length - 3}`}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Rating
                        value={coach.averageRating}
                        readOnly
                        size="small"
                      />
                      <Typography variant="body2" sx={{ ml: 1 }}>
                        ({coach.ratingCount})
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{coach.totalSessions}</TableCell>
                  <TableCell>
                    ${coach.hourlyRate?.toFixed(2) || "N/A"}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={coach.isActive ? "Active" : "Inactive"}
                      color={coach.isActive ? "success" : "default"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Tooltip title="View Details">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedCoach(coach);
                          setDetailsDialog(true);
                        }}
                      >
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={coach.isActive ? "Deactivate" : "Activate"}>
                      <IconButton
                        size="small"
                        onClick={() =>
                          handleToggleCoachStatus(coach.id, coach.isActive)
                        }
                      >
                        {coach.isActive ? <Block /> : <CheckCircle />}
                      </IconButton>
                    </Tooltip>
                    {!coach.isVerified && (
                      <Tooltip title="Verify Coach">
                        <IconButton
                          size="small"
                          onClick={() => handleVerifyCoach(coach.id)}
                        >
                          <VerifiedUser />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title={coach.isFeatured ? "Unfeature" : "Feature"}>
                      <IconButton
                        size="small"
                        onClick={() =>
                          handleFeatureCoach(coach.id, !coach.isFeatured)
                        }
                      >
                        <Star
                          color={coach.isFeatured ? "warning" : "inherit"}
                        />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Sessions Tab */}
      <TabPanel value={tabValue} index={1}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Session</TableCell>
                <TableCell>Coach</TableCell>
                <TableCell>Client</TableCell>
                <TableCell>Scheduled</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell>
                    <Typography variant="subtitle2">{session.title}</Typography>
                    <Typography variant="caption" color="textSecondary">
                      {session.sessionType}
                    </Typography>
                  </TableCell>
                  <TableCell>{session.coach?.displayName}</TableCell>
                  <TableCell>{session.client?.name}</TableCell>
                  <TableCell>
                    {format(
                      parseISO(session.scheduledAt),
                      "MMM dd, yyyy HH:mm",
                    )}
                  </TableCell>
                  <TableCell>{session.durationMinutes} min</TableCell>
                  <TableCell>${session.totalAmount.toFixed(2)}</TableCell>
                  <TableCell>
                    <Chip
                      label={session.status}
                      color={sessionStatusColors[session.status] || "default"}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Reviews Tab */}
      <TabPanel value={tabValue} index={2}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Coach</TableCell>
                <TableCell>Client</TableCell>
                <TableCell>Rating</TableCell>
                <TableCell>Review</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reviews.map((review) => (
                <TableRow key={review.id}>
                  <TableCell>{review.coach?.displayName}</TableCell>
                  <TableCell>{review.client?.name}</TableCell>
                  <TableCell>
                    <Rating value={review.rating} readOnly size="small" />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ maxWidth: 300 }}>
                      {review.comment}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {format(parseISO(review.createdAt), "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteReview(review.id)}
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Analytics Tab */}
      <TabPanel value={tabValue} index={3}>
        <Grid container spacing={3}>
          <Grid xs={12}, md: {6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Sessions Over Time
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={stats?.sessionsOverTime || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="sessions"
                      stroke="#8884d8"
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid xs={12}, md: {6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Revenue by Coach
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats?.revenueByCoach || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="coach" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="revenue" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid xs={12}, md: {6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Session Types Distribution
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stats?.sessionTypes || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {(stats?.sessionTypes || []).map(
                        (entry: any, index: number) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ),
                      )}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid xs={12}, md: {6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Top Specializations
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={stats?.topSpecializations || []}
                    layout="horizontal"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="specialization" type="category" />
                    <RechartsTooltip />
                    <Bar dataKey="count" fill="#ffc658" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Coach Details Dialog */}
      <Dialog
        open={detailsDialog}
        onClose={() => setDetailsDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Coach Details - {selectedCoach?.displayName}</DialogTitle>
        <DialogContent>
          {selectedCoach && (
            <Grid container spacing={2}>
              <Grid xs={12}, md: {4}>
                <img
                  src={selectedCoach.profileImageUrl || "/default-avatar.png"}
                  alt={selectedCoach.displayName}
                  style={{ width: "100%", borderRadius: 8 }}
                />
              </Grid>
              <Grid xs={12}, md: {8}>
                <Typography variant="h6">
                  {selectedCoach.displayName}
                </Typography>
                <Typography
                  variant="subtitle2"
                  color="textSecondary"
                  gutterBottom
                >
                  {selectedCoach.title}
                </Typography>
                <Typography variant="body2" paragraph>
                  {selectedCoach.bio}
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Details:
                  </Typography>
                  <Typography variant="body2">
                    • Experience: {selectedCoach.experienceYears} years
                  </Typography>
                  <Typography variant="body2">
                    • Languages: {selectedCoach.languages?.join(", ")}
                  </Typography>
                  <Typography variant="body2">
                    • Timezone: {selectedCoach.timezone}
                  </Typography>
                  <Typography variant="body2">
                    • Hourly Rate: $
                    {selectedCoach.hourlyRate?.toFixed(2) || "N/A"}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Certifications:
                  </Typography>
                  {selectedCoach.certifications?.map(
                    (cert: any, index: number) => (
                      <Typography key={index} variant="body2">
                        • {cert.name} - {cert.issuer} ({cert.date})
                      </Typography>
                    ),
                  )}
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminCoachMarketplace;
