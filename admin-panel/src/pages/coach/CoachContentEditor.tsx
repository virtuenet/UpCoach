import Grid from "@mui/material";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Typography,
  Tab,
  Tabs,
  Switch,
  FormControlLabel,
  Alert,
  Snackbar,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  Save as SaveIcon,
  Send as SendIcon,
  Preview as PreviewIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Delete as DeleteIcon,
  Image as ImageIcon,
} from "@mui/icons-material";
import api from "../../services/api";
import SEOHelper from "../../components/cms/SEOHelper";
import ContentPreview from "../../components/cms/ContentPreview";

interface ContentData {
  title: string;
  slug: string;
  summary: string;
  content: {
    format: "html";
    body: string;
  };
  categoryId: number | null;
  featuredImage: string;
  tags: string[];
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string[];
  metadata: any;
}

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface ValidationMessage {
  type: "error" | "warning" | "info";
  message: string;
}

const CoachContentEditor: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const editorRef = useRef<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [content, setContent] = useState<ContentData>({
    title: "",
    slug: "",
    summary: "",
    content: {
      format: "html",
      body: "",
    },
    categoryId: null,
    featuredImage: "",
    tags: [],
    seoTitle: "",
    seoDescription: "",
    seoKeywords: [],
    metadata: {},
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentTab, setCurrentTab] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [scheduleDialog, setScheduleDialog] = useState(false);
  const [publishDate, setPublishDate] = useState<Date | null>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as any,
  });
  const [wordCount, setWordCount] = useState(0);
  const [validationMessages, setValidationMessages] = useState<
    ValidationMessage[]
  >([]);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const autoSaveTimer = useRef<NodeJS.Timeout>();

  useEffect(() => {
    fetchInitialData();
  }, [id]);

  useEffect(() => {
    // Auto-save functionality
    if (
      autoSaveEnabled &&
      content.title &&
      content.content.body &&
      id &&
      id !== "new"
    ) {
      clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = setTimeout(() => {
        handleSave(true);
      }, 30000); // Auto-save every 30 seconds
    }

    return () => clearTimeout(autoSaveTimer.current);
  }, [content, autoSaveEnabled]);

  useEffect(() => {
    // Validate content on change
    validateContent();
  }, [content]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const categoriesRes = await api.get("/coach-content/categories");
      setCategories(categoriesRes.data.data);

      if (id && id !== "new") {
        const articleRes = await api.get(`/coach-content/articles/${id}`);
        setContent(articleRes.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      showSnackbar("Failed to load content", "error");
    } finally {
      setLoading(false);
    }
  };

  const validateContent = () => {
    const messages: ValidationMessage[] = [];

    // Required fields
    if (!content.title) {
      messages.push({ type: "error", message: "Title is required" });
    } else if (content.title.length < 10) {
      messages.push({
        type: "warning",
        message: "Title should be at least 10 characters",
      });
    }

    if (!content.content.body || content.content.body.length < 100) {
      messages.push({
        type: "error",
        message: "Content must be at least 100 characters",
      });
    }

    if (!content.summary) {
      messages.push({
        type: "warning",
        message: "Summary helps readers understand your content",
      });
    }

    if (!content.categoryId) {
      messages.push({
        type: "warning",
        message: "Select a category for better organization",
      });
    }

    if (content.tags.length === 0) {
      messages.push({
        type: "info",
        message: "Add tags to improve discoverability",
      });
    }

    // SEO recommendations
    if (!content.seoTitle) {
      messages.push({
        type: "info",
        message: "Add SEO title for better search visibility",
      });
    }

    if (!content.seoDescription) {
      messages.push({
        type: "info",
        message: "Add SEO description for search results",
      });
    }

    setValidationMessages(messages);
  };

  const handleSave = async (isAutoSave = false) => {
    setSaving(true);
    try {
      const endpoint =
        id && id !== "new"
          ? `/coach-content/articles/${id}`
          : "/coach-content/articles";

      const method = id && id !== "new" ? "put" : "post";

      const response = await api[method](endpoint, content);

      if (!isAutoSave) {
        showSnackbar("Content saved successfully", "success");
      }

      // If creating new article, redirect to edit page
      if (!id || id === "new") {
        navigate(`/coach/content/${response.data.data.id}/edit`, {
          replace: true,
        });
      }
    } catch (error) {
      console.error("Failed to save content:", error);
      showSnackbar("Failed to save content", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitForReview = async () => {
    // Check for errors
    const errors = validationMessages.filter((m) => m.type === "error");
    if (errors.length > 0) {
      showSnackbar("Please fix all errors before submitting", "error");
      return;
    }

    setSaving(true);
    try {
      // Save first
      await handleSave();

      // Then submit for review
      if (id && id !== "new") {
        await api.post(`/coach-content/articles/${id}/submit-review`);
        showSnackbar("Article submitted for review", "success");
        navigate("/coach/content");
      }
    } catch (error) {
      console.error("Failed to submit for review:", error);
      showSnackbar("Failed to submit for review", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSchedule = async () => {
    if (!publishDate) {
      showSnackbar("Please select a publish date", "error");
      return;
    }

    setSaving(true);
    try {
      await api.post(`/coach-content/articles/${id}/schedule`, {
        publishDate,
        options: {
          notifySubscribers: true,
          socialShare: false,
        },
      });
      showSnackbar("Article scheduled successfully", "success");
      setScheduleDialog(false);
      navigate("/coach/content");
    } catch (error) {
      console.error("Failed to schedule article:", error);
      showSnackbar("Failed to schedule article", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleEditorChange = (content: string) => {
    setContent((prev) => ({
      ...prev,
      content: {
        ...prev.content,
        body: content,
      },
    }));

    // Update word count
    const text = content.replace(/<[^>]*>/g, "");
    setWordCount(text.split(/\s+/).filter((word) => word.length > 0).length);
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const showSnackbar = (message: string, severity: any) => {
    setSnackbar({ open: true, message, severity });
  };

  const getValidationIcon = (type: ValidationMessage["type"]) => {
    switch (type) {
      case "error":
        return <WarningIcon color="error" />;
      case "warning":
        return <WarningIcon color="warning" />;
      case "info":
        return <InfoIcon color="info" />;
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        {/* Header */}
        <Box
          sx={{
            mb: 3,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h4">
            {id && id !== "new" ? "Edit Article" : "Create New Article"}
          </Typography>
          <Box>
            <Button
              variant="outlined"
              startIcon={<PreviewIcon />}
              onClick={() => setPreviewOpen(true)}
              sx={{ mr: 2 }}
            >
              Preview
            </Button>
            <Button
              variant="outlined"
              startIcon={<SaveIcon />}
              onClick={() => handleSave(false)}
              disabled={saving}
              sx={{ mr: 2 }}
            >
              Save Draft
            </Button>
            <Button
              variant="contained"
              startIcon={<SendIcon />}
              onClick={handleSubmitForReview}
              disabled={
                saving || validationMessages.some((m) => m.type === "error")
              }
            >
              Submit for Review
            </Button>
          </Box>
        </Box>

        <Grid container spacing={3}>
          {/* Main Content Area */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Tabs
                  value={currentTab}
                  onChange={(_e, v) => setCurrentTab(v)}
                  sx={{ mb: 3 }}
                >
                  <Tab label="Content" />
                  <Tab label="SEO" />
                </Tabs>

                {currentTab === 0 && (
                  <Box>
                    <TextField
                      fullWidth
                      label="Title"
                      value={content.title}
                      onChange={(e) => {
                        setContent((prev) => ({
                          ...prev,
                          title: e.target.value,
                          slug: generateSlug(e.target.value),
                        }));
                      }}
                      sx={{ mb: 2 }}
                      required
                      error={!content.title}
                      helperText={!content.title ? "Title is required" : ""}
                    />

                    <TextField
                      fullWidth
                      label="Summary"
                      value={content.summary}
                      onChange={(e) =>
                        setContent((prev) => ({
                          ...prev,
                          summary: e.target.value,
                        }))
                      }
                      multiline
                      rows={3}
                      sx={{ mb: 3 }}
                      helperText="Brief description that appears in article listings"
                    />

                    <Box
                      sx={{
                        mb: 2,
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <Typography variant="subtitle2">
                        Content Editor
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {wordCount} words | {Math.ceil(wordCount / 200)} min
                        read
                      </Typography>
                    </Box>

                    <Editor
                      apiKey={process.env.REACT_APP_TINYMCE_API_KEY}
                      onInit={(evt, editor) => (editorRef.current = editor)}
                      value={content.content.body}
                      onEditorChange={handleEditorChange}
                      init={{
                        height: 500,
                        menubar: true,
                        plugins: [
                          "advlist",
                          "autolink",
                          "lists",
                          "link",
                          "image",
                          "charmap",
                          "preview",
                          "anchor",
                          "searchreplace",
                          "visualblocks",
                          "code",
                          "fullscreen",
                          "insertdatetime",
                          "media",
                          "table",
                          "code",
                          "help",
                          "wordcount",
                          "codesample",
                          "emoticons",
                          "autosave",
                        ],
                        toolbar:
                          "undo redo | blocks | " +
                          "bold italic underline strikethrough | alignleft aligncenter " +
                          "alignright alignjustify | bullist numlist outdent indent | " +
                          "link image media | code codesample | removeformat | help",
                        content_style:
                          "body { font-family:Helvetica,Arial,sans-serif; font-size:14px }",
                        automatic_uploads: true,
                        file_picker_types: "image",
                        autosave_interval: "30s",
                        autosave_retention: "30m",
                      }}
                    />

                    <Box sx={{ mt: 3 }}>
                      <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel>Category</InputLabel>
                        <Select
                          value={content.categoryId || ""}
                          onChange={(e) =>
                            setContent((prev) => ({
                              ...prev,
                              categoryId: e.target.value as number,
                            }))
                          }
                          label="Category"
                        >
                          <MenuItem value="">None</MenuItem>
                          {categories.map((cat) => (
                            <MenuItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      <TextField
                        fullWidth
                        label="Tags"
                        placeholder="Add tags separated by commas"
                        value={content.tags.join(", ")}
                        onChange={(e) => {
                          const tags = e.target.value
                            .split(",")
                            .map((tag) => tag.trim())
                            .filter((tag) => tag.length > 0);
                          setContent((prev) => ({ ...prev, tags }));
                        }}
                        helperText="Separate tags with commas"
                      />
                    </Box>
                  </Box>
                )}

                {currentTab === 1 && (
                  <Box>
                    <SEOHelper
                      title={content.title}
                      description={content.summary}
                      content={content.content.body}
                      onUpdate={(seoData) => {
                        setContent((prev) => ({
                          ...prev,
                          seoTitle: seoData.title || content.title,
                          seoDescription:
                            seoData.description || content.summary,
                          seoKeywords: seoData.keywords || [],
                        }));
                      }}
                    />
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Sidebar */}
          <Grid item xs={12} md={4}>
            {/* Validation Messages */}
            {validationMessages.length > 0 && (
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Content Checklist
                  </Typography>
                  <List dense>
                    {validationMessages.map((message, index) => (
                      <ListItem key={index}>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          {getValidationIcon(message.type)}
                        </ListItemIcon>
                        <ListItemText
                          primary={message.message}
                          primaryTypographyProps={{ variant: "body2" }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            )}

            {/* Settings */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Settings
                </Typography>

                <FormControlLabel
                  control={
                    <Switch
                      checked={autoSaveEnabled}
                      onChange={(e) => setAutoSaveEnabled(e.target.checked)}
                    />
                  }
                  label="Auto-save enabled"
                />

                {id && id !== "new" && (
                  <Box sx={{ mt: 2 }}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<ScheduleIcon />}
                      onClick={() => setScheduleDialog(true)}
                    >
                      Schedule Publishing
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Preview Dialog */}
        <Dialog
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Content Preview</DialogTitle>
          <DialogContent>
            <ContentPreview content={content} />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPreviewOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Schedule Dialog */}
        <Dialog
          open={scheduleDialog}
          onClose={() => setScheduleDialog(false)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>Schedule Publishing</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <DateTimePicker
                label="Publish Date & Time"
                value={publishDate}
                onChange={setPublishDate}
                slotProps={{
                  textField: {
                    fullWidth: true,
                  },
                }}
                minDateTime={new Date()}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setScheduleDialog(false)}>Cancel</Button>
            <Button
              onClick={handleSchedule}
              variant="contained"
              disabled={!publishDate}
            >
              Schedule
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        >
          <Alert
            severity={snackbar.severity}
            onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  );
};

export default CoachContentEditor;
