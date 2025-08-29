import Grid from "@mui/material";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tab,
  Tabs,
  TextField,
  InputAdornment,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  Article as ArticleIcon,
  Category as CategoryIcon,
  Schedule as ScheduleIcon,
  Analytics as AnalyticsIcon,
  CloudUpload as UploadIcon,
  Publish as PublishIcon,
} from "@mui/icons-material";
import api from "../../services/api";
import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";

interface ContentStats {
  totalArticles: number;
  publishedArticles: number;
  draftArticles: number;
  totalViews: number;
  totalCategories: number;
  scheduledPosts: number;
}

interface Article {
  id: number;
  title: string;
  slug: string;
  status: string;
  author: {
    id: number;
    name: string;
    avatar?: string;
  };
  category?: {
    id: number;
    name: string;
    slug: string;
  };
  viewCount: number;
  publishDate?: string;
  createdAt: string;
  updatedAt: string;
}

const CMSDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ContentStats | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [currentTab, setCurrentTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchDashboardData();
  }, [currentTab, searchTerm]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, articlesRes] = await Promise.all([
        api.get("/cms/analytics/overview"),
        api.get("/cms/articles", {
          params: {
            status:
              currentTab === 1
                ? "published"
                : currentTab === 2
                  ? "draft"
                  : undefined,
            search: searchTerm || undefined,
            limit: 10,
          },
        }),
      ]);

      setStats(statsRes.data.data);
      setArticles(articlesRes.data.data);
    } catch (error) {
      console.error("Failed to fetch CMS data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (
    event: React.SyntheticEvent,
    newValue: number,
  ) => {
    setCurrentTab(newValue);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this article?")) {
      try {
        await api.delete(`/cms/articles/${id}`);
        fetchDashboardData();
      } catch (error) {
        console.error("Failed to delete article:", error);
      }
    }
  };

  const handlePublish = async (id: number) => {
    try {
      await api.post(`/cms/articles/${id}/publish`);
      fetchDashboardData();
    } catch (error) {
      console.error("Failed to publish article:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "success";
      case "draft":
        return "default";
      case "review":
        return "warning";
      case "archived":
        return "error";
      default:
        return "default";
    }
  };

  if (loading) {
    return <LinearProgress />;
  }

  return (
    <Box>
      <PageHeader
        title="Content Management"
        subtitle="Manage articles, categories, and media"
        action={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate("/cms/content/new")}
          >
            New Article
          </Button>
        }
      />

      {/* Stats Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            title="Total Articles"
            value={stats?.totalArticles || 0}
            icon={<ArticleIcon />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            title="Published"
            value={stats?.publishedArticles || 0}
            icon={<PublishIcon />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            title="Drafts"
            value={stats?.draftArticles || 0}
            icon={<EditIcon />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            title="Total Views"
            value={stats?.totalViews || 0}
            icon={<ViewIcon />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            title="Categories"
            value={stats?.totalCategories || 0}
            icon={<CategoryIcon />}
            color="secondary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            title="Scheduled"
            value={stats?.scheduledPosts || 0}
            icon={<ScheduleIcon />}
            color="error"
          />
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item>
          <Button
            variant="outlined"
            startIcon={<CategoryIcon />}
            onClick={() => navigate("/cms/categories")}
          >
            Manage Categories
          </Button>
        </Grid>
        <Grid item>
          <Button
            variant="outlined"
            startIcon={<UploadIcon />}
            onClick={() => navigate("/cms/media")}
          >
            Media Library
          </Button>
        </Grid>
        <Grid item>
          <Button
            variant="outlined"
            startIcon={<ScheduleIcon />}
            onClick={() => navigate("/cms/schedule")}
          >
            Content Calendar
          </Button>
        </Grid>
        <Grid item>
          <Button
            variant="outlined"
            startIcon={<AnalyticsIcon />}
            onClick={() => navigate("/cms/analytics")}
          >
            Analytics
          </Button>
        </Grid>
      </Grid>

      {/* Articles List */}
      <Card>
        <CardContent>
          <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
            <Tabs value={currentTab} onChange={handleStatusChange}>
              <Tab label="All Articles" />
              <Tab label="Published" />
              <Tab label="Drafts" />
            </Tabs>
          </Box>

          <TextField
            fullWidth
            placeholder="Search articles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ mb: 3 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />

          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Author</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Views</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {articles.map((article) => (
                  <TableRow key={article.id}>
                    <TableCell>
                      <Typography variant="subtitle2">
                        {article.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        /{article.slug}
                      </Typography>
                    </TableCell>
                    <TableCell>{article.author.name}</TableCell>
                    <TableCell>{article.category?.name || "-"}</TableCell>
                    <TableCell>
                      <Chip
                        label={article.status}
                        size="small"
                        color={getStatusColor(article.status) as any}
                      />
                    </TableCell>
                    <TableCell align="center">{article.viewCount}</TableCell>
                    <TableCell>
                      {format(new Date(article.createdAt), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={() =>
                          window.open(`/preview/${article.slug}`, "_blank")
                        }
                      >
                        <ViewIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() =>
                          navigate(`/cms/content/${article.id}/edit`)
                        }
                      >
                        <EditIcon />
                      </IconButton>
                      {article.status === "draft" && (
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => handlePublish(article.id)}
                        >
                          <PublishIcon />
                        </IconButton>
                      )}
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(article.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CMSDashboard;
