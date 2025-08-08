import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Tab,
  Tabs,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Snackbar,
  CircularProgress,
} from "@mui/material";
import {
  Save as SaveIcon,
  Publish as PublishIcon,
  Preview as PreviewIcon,
  Image as ImageIcon,
  AttachFile as AttachFileIcon,
  FormatBold as BoldIcon,
  FormatItalic as ItalicIcon,
  FormatUnderlined as UnderlineIcon,
  FormatListBulleted as ListIcon,
  FormatListNumbered as NumberedListIcon,
  Code as CodeIcon,
  Link as LinkIcon,
  FormatQuote as QuoteIcon,
  Title as HeadingIcon,
  Schedule as ScheduleIcon,
  Analytics as AnalyticsIcon,
} from "@mui/icons-material";
import { useParams, useNavigate } from "react-router-dom";
import { Editor } from "@tinymce/tinymce-react";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import api from "../../services/api";
import MediaLibrary from "../../components/cms/MediaLibrary";
import SEOAnalyzer from "../../components/cms/SEOAnalyzer";
import ContentPreview from "../../components/cms/ContentPreview";

interface ContentData {
  title: string;
  slug: string;
  summary: string;
  content: {
    format: "html" | "markdown";
    body: string;
  };
  categoryId: number | null;
  featuredImage: string;
  status: "draft" | "review" | "published" | "archived";
  visibility: "public" | "members" | "premium";
  publishDate: Date | null;
  tags: string[];
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string[];
  allowComments: boolean;
  isFeatured: boolean;
  metadata: any;
}

interface Category {
  id: number;
  name: string;
  slug: string;
}

const ContentEditor: React.FC = () => {
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
    status: "draft",
    visibility: "public",
    publishDate: null,
    tags: [],
    seoTitle: "",
    seoDescription: "",
    seoKeywords: [],
    allowComments: true,
    isFeatured: false,
    metadata: {},
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentTab, setCurrentTab] = useState(0);
  const [mediaLibraryOpen, setMediaLibraryOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as any,
  });
  const [wordCount, setWordCount] = useState(0);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const autoSaveTimer = useRef<NodeJS.Timeout>();

  useEffect(() => {
    fetchInitialData();
  }, [id]);

  useEffect(() => {
    // Auto-save functionality
    if (autoSaveEnabled && content.title && content.content.body) {
      clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = setTimeout(() => {
        handleSave(true);
      }, 30000); // Auto-save every 30 seconds
    }

    return () => clearTimeout(autoSaveTimer.current);
  }, [content, autoSaveEnabled]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [categoriesRes] = await Promise.all([api.get("/cms/categories")]);
      setCategories(categoriesRes.data.data);

      if (id && id !== "new") {
        const articleRes = await api.get(`/cms/articles/${id}`);
        setContent(articleRes.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      showSnackbar("Failed to load content", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (isAutoSave = false) => {
    setSaving(true);
    try {
      const endpoint =
        id && id !== "new" ? `/cms/articles/${id}` : "/cms/articles";

      const method = id && id !== "new" ? "put" : "post";

      const response = await api[method](endpoint, content);

      if (!isAutoSave) {
        showSnackbar("Content saved successfully", "success");
      }

      // If creating new article, redirect to edit page
      if (!id || id === "new") {
        navigate(`/cms/content/${response.data.data.id}/edit`, {
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

  const handlePublish = async () => {
    if (!content.title || !content.content.body) {
      showSnackbar("Title and content are required", "error");
      return;
    }

    setSaving(true);
    try {
      // Save first
      await handleSave();

      // Then publish
      if (id && id !== "new") {
        await api.post(`/cms/articles/${id}/publish`);
        showSnackbar("Content published successfully", "success");
        navigate("/cms");
      }
    } catch (error) {
      console.error("Failed to publish content:", error);
      showSnackbar("Failed to publish content", "error");
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

  const handleMediaSelect = (media: any) => {
    if (mediaLibraryOpen === "featured") {
      setContent((prev) => ({ ...prev, featuredImage: media.url }));
    } else {
      // Insert into editor
      const imageHtml = `<img src="${media.url}" alt="${media.altText || ""}" />`;
      editorRef.current?.insertContent(imageHtml);
    }
    setMediaLibraryOpen(false);
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
            {id && id !== "new" ? "Edit Content" : "Create New Content"}
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
              startIcon={<PublishIcon />}
              onClick={handlePublish}
              disabled={saving}
            >
              Publish
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
                  onChange={(e, v) => setCurrentTab(v)}
                  sx={{ mb: 3 }}
                >
                  <Tab label="Content" />
                  <Tab label="SEO" />
                  <Tab label="Settings" />
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
                    />

                    <TextField
                      fullWidth
                      label="Slug"
                      value={content.slug}
                      onChange={(e) =>
                        setContent((prev) => ({
                          ...prev,
                          slug: e.target.value,
                        }))
                      }
                      sx={{ mb: 2 }}
                      helperText="URL-friendly version of the title"
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
                      helperText="Brief description of the content"
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
                        file_picker_callback: (cb) => {
                          setMediaLibraryOpen("editor");
                        },
                        autosave_interval: "30s",
                        autosave_retention: "30m",
                      }}
                    />
                  </Box>
                )}

                {currentTab === 1 && (
                  <Box>
                    <SEOAnalyzer
                      title={content.seoTitle || content.title}
                      description={content.seoDescription || content.summary}
                      content={content.content.body}
                      keywords={content.seoKeywords}
                      onUpdate={(seoData) => {
                        setContent((prev) => ({
                          ...prev,
                          seoTitle: seoData.title,
                          seoDescription: seoData.description,
                          seoKeywords: seoData.keywords,
                        }));
                      }}
                    />
                  </Box>
                )}

                {currentTab === 2 && (
                  <Box>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth sx={{ mb: 2 }}>
                          <InputLabel>Status</InputLabel>
                          <Select
                            value={content.status}
                            onChange={(e) =>
                              setContent((prev) => ({
                                ...prev,
                                status: e.target.value as any,
                              }))
                            }
                            label="Status"
                          >
                            <MenuItem value="draft">Draft</MenuItem>
                            <MenuItem value="review">Under Review</MenuItem>
                            <MenuItem value="published">Published</MenuItem>
                            <MenuItem value="archived">Archived</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth sx={{ mb: 2 }}>
                          <InputLabel>Visibility</InputLabel>
                          <Select
                            value={content.visibility}
                            onChange={(e) =>
                              setContent((prev) => ({
                                ...prev,
                                visibility: e.target.value as any,
                              }))
                            }
                            label="Visibility"
                          >
                            <MenuItem value="public">Public</MenuItem>
                            <MenuItem value="members">Members Only</MenuItem>
                            <MenuItem value="premium">Premium</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>

                      <Grid item xs={12}>
                        <DateTimePicker
                          label="Publish Date"
                          value={content.publishDate}
                          onChange={(date) =>
                            setContent((prev) => ({
                              ...prev,
                              publishDate: date,
                            }))
                          }
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              sx: { mb: 2 },
                            },
                          }}
                        />
                      </Grid>

                      <Grid item xs={12}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={content.allowComments}
                              onChange={(e) =>
                                setContent((prev) => ({
                                  ...prev,
                                  allowComments: e.target.checked,
                                }))
                              }
                            />
                          }
                          label="Allow Comments"
                        />
                      </Grid>

                      <Grid item xs={12}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={content.isFeatured}
                              onChange={(e) =>
                                setContent((prev) => ({
                                  ...prev,
                                  isFeatured: e.target.checked,
                                }))
                              }
                            />
                          }
                          label="Featured Content"
                        />
                      </Grid>

                      <Grid item xs={12}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={autoSaveEnabled}
                              onChange={(e) =>
                                setAutoSaveEnabled(e.target.checked)
                              }
                            />
                          }
                          label="Auto-save enabled"
                        />
                      </Grid>
                    </Grid>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Sidebar */}
          <Grid item xs={12} md={4}>
            {/* Category & Tags */}
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Organization
                </Typography>

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
              </CardContent>
            </Card>

            {/* Featured Image */}
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Featured Image
                </Typography>

                {content.featuredImage ? (
                  <Box sx={{ position: "relative", mb: 2 }}>
                    <img
                      src={content.featuredImage}
                      alt="Featured"
                      style={{ width: "100%", borderRadius: 4 }}
                    />
                    <IconButton
                      sx={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        bgcolor: "background.paper",
                      }}
                      onClick={() =>
                        setContent((prev) => ({ ...prev, featuredImage: "" }))
                      }
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      border: "2px dashed #ccc",
                      borderRadius: 1,
                      p: 3,
                      textAlign: "center",
                      cursor: "pointer",
                      mb: 2,
                    }}
                    onClick={() => setMediaLibraryOpen("featured")}
                  >
                    <ImageIcon
                      sx={{ fontSize: 48, color: "text.secondary", mb: 1 }}
                    />
                    <Typography color="text.secondary">
                      Click to select featured image
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            {id && id !== "new" && (
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Analytics
                  </Typography>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<AnalyticsIcon />}
                    onClick={() => navigate(`/cms/analytics/articles/${id}`)}
                  >
                    View Analytics
                  </Button>
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>

        {/* Media Library Dialog */}
        <Dialog
          open={!!mediaLibraryOpen}
          onClose={() => setMediaLibraryOpen(false)}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle>Select Media</DialogTitle>
          <DialogContent>
            <MediaLibrary onSelect={handleMediaSelect} />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setMediaLibraryOpen(false)}>Cancel</Button>
          </DialogActions>
        </Dialog>

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

export default ContentEditor;
