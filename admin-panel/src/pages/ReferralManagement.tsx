import Grid from "@mui/material";
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
  IconButton,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  LinearProgress,
  Tab,
  Tabs,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
} from "@mui/material";
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  MonetizationOn as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  EmojiEvents as TrophyIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Schedule as PendingIcon,
  Edit as EditIcon,
  AttachMoney as PaymentIcon,
} from "@mui/icons-material";
import api from "../services/api";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";

interface ReferralStats {
  totalReferrals: number;
  activeReferrals: number;
  completedReferrals: number;
  totalEarnings: number;
  pendingPayouts: number;
  averageConversionRate: number;
}

interface Referral {
  id: number;
  referrerName: string;
  referrerId: number;
  refereeName: string | null;
  refereeId: number | null;
  code: string;
  status: "pending" | "completed" | "expired" | "cancelled";
  rewardStatus: "pending" | "paid" | "failed";
  referrerReward: number;
  refereeReward: number;
  createdAt: string;
  completedAt: string | null;
  expiresAt: string;
}

interface LeaderboardEntry {
  userId: number;
  userName: string;
  referralCount: number;
  totalEarnings: number;
  rank: number;
}

const ReferralManagement: React.FC = () => {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [tabValue, setTabValue] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [leaderboardPeriod, setLeaderboardPeriod] = useState<
    "week" | "month" | "all"
  >("month");
  const [paymentDialog, setPaymentDialog] = useState<{
    open: boolean;
    referral: Referral | null;
  }>({
    open: false,
    referral: null,
  });
  const [editDialog, setEditDialog] = useState<{
    open: boolean;
    referral: Referral | null;
  }>({
    open: false,
    referral: null,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, referralsRes, leaderboardRes] = await Promise.all([
        api.get("/analytics/referrals/stats"),
        api.get("/analytics/referrals"),
        api.get(`/referrals/leaderboard?period=${leaderboardPeriod}`),
      ]);

      setStats(statsRes.data);
      setReferrals(referralsRes.data);
      setLeaderboard(leaderboardRes.data.data.leaderboard);
    } catch (error) {
      console.error("Failed to fetch referral data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPayment = async (referralId: number) => {
    try {
      await api.post(`/referrals/process-reward`, {
        referralId,
      });
      fetchData();
      setPaymentDialog({ open: false, referral: null });
    } catch (error) {
      console.error("Failed to process payment:", error);
    }
  };

  const handleUpdateStatus = async (referralId: number, newStatus: string) => {
    try {
      await api.put(`/analytics/referrals/${referralId}/status`, {
        status: newStatus,
      });
      fetchData();
      setEditDialog({ open: false, referral: null });
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "success";
      case "pending":
        return "warning";
      case "expired":
        return "default";
      case "cancelled":
        return "error";
      default:
        return "default";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "success";
      case "pending":
        return "warning";
      case "failed":
        return "error";
      default:
        return "default";
    }
  };

  const filteredReferrals = referrals.filter((referral) => {
    const matchesSearch =
      referral.referrerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      referral.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (referral.refereeName &&
        referral.refereeName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === "all" || referral.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

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
        title="Referral Management"
        subtitle="Manage referral program and rewards"
        action={
          <Button
            startIcon={<RefreshIcon />}
            onClick={fetchData}
            variant="outlined"
          >
            Refresh
          </Button>
        }
      />

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Referrals"
            value={stats?.totalReferrals || 0}
            icon={<PeopleIcon />}
            trend={12.5}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Referrals"
            value={stats?.activeReferrals || 0}
            icon={<TrendingUpIcon />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Conversion Rate"
            value={`${stats?.averageConversionRate || 0}%`}
            icon={<CheckIcon />}
            trend={5.2}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Payouts"
            value={`$${stats?.pendingPayouts || 0}`}
            icon={<MoneyIcon />}
            color="warning"
          />
        </Grid>
      </Grid>

      {/* Tabs */}
      <Card sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab label="All Referrals" />
          <Tab label="Leaderboard" />
          <Tab label="Settings" />
        </Tabs>
      </Card>

      {/* All Referrals Tab */}
      {tabValue === 0 && (
        <Card>
          <CardContent>
            <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
              <TextField
                placeholder="Search by name or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{ flex: 1 }}
              />
              <FormControl sx={{ minWidth: 150 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="expired">Expired</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Referrer</TableCell>
                    <TableCell>Code</TableCell>
                    <TableCell>Referee</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Reward Status</TableCell>
                    <TableCell align="right">Reward</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredReferrals.map((referral) => (
                    <TableRow key={referral.id}>
                      <TableCell>{referral.referrerName}</TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{ fontFamily: "monospace" }}
                        >
                          {referral.code}
                        </Typography>
                      </TableCell>
                      <TableCell>{referral.refereeName || "-"}</TableCell>
                      <TableCell>
                        <Chip
                          label={referral.status}
                          size="small"
                          color={getStatusColor(referral.status) as any}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={referral.rewardStatus}
                          size="small"
                          color={
                            getPaymentStatusColor(referral.rewardStatus) as any
                          }
                        />
                      </TableCell>
                      <TableCell align="right">
                        ${referral.referrerReward}
                      </TableCell>
                      <TableCell>
                        {format(new Date(referral.createdAt), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", gap: 1 }}>
                          {referral.status === "completed" &&
                            referral.rewardStatus === "pending" && (
                              <Tooltip title="Process Payment">
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    setPaymentDialog({ open: true, referral })
                                  }
                                >
                                  <PaymentIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={() =>
                                setEditDialog({ open: true, referral })
                              }
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Leaderboard Tab */}
      {tabValue === 1 && (
        <Card>
          <CardContent>
            <Box
              sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}
            >
              <Typography variant="h6">Top Referrers</Typography>
              <FormControl sx={{ minWidth: 120 }}>
                <Select
                  value={leaderboardPeriod}
                  onChange={(e) => {
                    setLeaderboardPeriod(e.target.value as any);
                    fetchData();
                  }}
                  size="small"
                >
                  <MenuItem value="week">This Week</MenuItem>
                  <MenuItem value="month">This Month</MenuItem>
                  <MenuItem value="all">All Time</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Grid container spacing={3}>
              {leaderboard.slice(0, 3).map((entry, index) => (
                <Grid item xs={12} md={4} key={entry.userId}>
                  <Card
                    sx={{
                      textAlign: "center",
                      p: 3,
                      background:
                        index === 0
                          ? "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)"
                          : index === 1
                            ? "linear-gradient(135deg, #C0C0C0 0%, #808080 100%)"
                            : "linear-gradient(135deg, #CD7F32 0%, #8B4513 100%)",
                      color: "white",
                    }}
                  >
                    <TrophyIcon sx={{ fontSize: 48, mb: 2 }} />
                    <Typography variant="h4">#{index + 1}</Typography>
                    <Typography variant="h6" sx={{ mb: 1 }}>
                      {entry.userName}
                    </Typography>
                    <Typography variant="body1">
                      {entry.referralCount} referrals
                    </Typography>
                    <Typography variant="h5" sx={{ mt: 2 }}>
                      ${entry.totalEarnings}
                    </Typography>
                  </Card>
                </Grid>
              ))}
            </Grid>

            <TableContainer sx={{ mt: 3 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Rank</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell align="center">Referrals</TableCell>
                    <TableCell align="right">Total Earnings</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {leaderboard.slice(3).map((entry, index) => (
                    <TableRow key={entry.userId}>
                      <TableCell>{index + 4}</TableCell>
                      <TableCell>{entry.userName}</TableCell>
                      <TableCell align="center">
                        {entry.referralCount}
                      </TableCell>
                      <TableCell align="right">
                        ${entry.totalEarnings}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Settings Tab */}
      {tabValue === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Referral Program Settings
                </Typography>
                <Alert severity="info" sx={{ mt: 2 }}>
                  Referral program configuration can be managed in the backend
                  settings.
                </Alert>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Reward Structure
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Standard Program: $20 referrer / 20% off referee
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Premium Program: $30 referrer / 30% off referee
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Coach Program: $25 referrer / 25% off referee
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Payment Dialog */}
      <Dialog
        open={paymentDialog.open}
        onClose={() => setPaymentDialog({ open: false, referral: null })}
      >
        <DialogTitle>Process Referral Payment</DialogTitle>
        <DialogContent>
          {paymentDialog.referral && (
            <Box sx={{ pt: 2 }}>
              <Typography>
                Process payment of ${paymentDialog.referral.referrerReward} to{" "}
                {paymentDialog.referral.referrerName}?
              </Typography>
              <Alert severity="info" sx={{ mt: 2 }}>
                This will mark the reward as paid and trigger the payment
                process.
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setPaymentDialog({ open: false, referral: null })}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() =>
              paymentDialog.referral &&
              handleProcessPayment(paymentDialog.referral.id)
            }
          >
            Process Payment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={editDialog.open}
        onClose={() => setEditDialog({ open: false, referral: null })}
      >
        <DialogTitle>Edit Referral Status</DialogTitle>
        <DialogContent>
          {editDialog.referral && (
            <Box sx={{ pt: 2, minWidth: 300 }}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={editDialog.referral.status}
                  onChange={(e) =>
                    handleUpdateStatus(editDialog.referral!.id, e.target.value)
                  }
                  label="Status"
                >
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="expired">Expired</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setEditDialog({ open: false, referral: null })}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ReferralManagement;
