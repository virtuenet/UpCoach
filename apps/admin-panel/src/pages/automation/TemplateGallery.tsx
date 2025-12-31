import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Rating,
  Avatar,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Divider,
  Badge,
  Tooltip,
  CircularProgress,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Star as StarIcon,
  TrendingUp as TrendingIcon,
  Whatshot as HotIcon,
  Add as AddIcon,
  Close as CloseIcon,
  PlayArrow as PreviewIcon,
  GetApp as InstallIcon,
  ChatBubble as ChatIcon,
  Check as CheckIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';

/**
 * Template Gallery
 *
 * React component for browsing and installing automation templates.
 *
 * Features:
 * - Category navigation (15 categories)
 * - Search and filter functionality
 * - Template cards with previews
 * - Template details modal
 * - Customization wizard
 * - Variable configuration forms
 * - Preview before creation
 * - One-click template installation
 * - Template ratings and reviews
 * - Popular/Trending templates
 * - Template usage statistics
 * - AI assistant integration
 * - Material-UI design
 */

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  tags: string[];
  icon: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTimeToSetup: number;
  popularity: number;
  rating: number;
  ratingCount: number;
  usageCount: number;
  featured: boolean;
  premium: boolean;
  author: {
    type: 'upcoach' | 'community';
    name: string;
  };
  variables: TemplateVariable[];
  previewImage?: string;
  videoTutorialUrl?: string;
}

interface TemplateVariable {
  key: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'email' | 'url' | 'select';
  description: string;
  required: boolean;
  defaultValue?: any;
  options?: { label: string; value: any }[];
}

const CATEGORIES = [
  { id: 'all', label: 'All Templates', icon: '📚', count: 200 },
  { id: 'onboarding', label: 'Onboarding', icon: '👋', count: 20 },
  { id: 'engagement', label: 'Engagement', icon: '🎉', count: 25 },
  { id: 'coaching', label: 'Coaching', icon: '💼', count: 30 },
  { id: 'goals', label: 'Goal Tracking', icon: '🎯', count: 25 },
  { id: 'habits', label: 'Habit Building', icon: '✅', count: 20 },
  { id: 'team', label: 'Team Collaboration', icon: '👥', count: 10 },
  { id: 'analytics', label: 'Analytics', icon: '📊', count: 15 },
  { id: 'integrations', label: 'Integrations', icon: '🔗', count: 15 },
  { id: 'revenue', label: 'Revenue', icon: '💰', count: 20 },
  { id: 'scheduling', label: 'Scheduling', icon: '📅', count: 15 },
  { id: 'communication', label: 'Communication', icon: '📧', count: 30 },
  { id: 'marketing', label: 'Marketing', icon: '📣', count: 20 },
  { id: 'support', label: 'Support', icon: '🎧', count: 15 },
  { id: 'productivity', label: 'Productivity', icon: '⚡', count: 15 },
  { id: 'wellness', label: 'Wellness', icon: '🧘', count: 10 },
];

const DIFFICULTY_COLORS = {
  beginner: '#4caf50',
  intermediate: '#ff9800',
  advanced: '#f44336',
};

const TemplateGallery: React.FC = () => {
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'popularity' | 'rating' | 'recent'>('popularity');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [customizationOpen, setCustomizationOpen] = useState(false);
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [variableValues, setVariableValues] = useState<Record<string, any>>({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/automation/templates');
      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error('Failed to load templates:', error);
      setSnackbar({ open: true, message: 'Failed to load templates', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = useMemo(() => {
    let filtered = templates;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((t) => t.category === selectedCategory);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query) ||
          t.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    if (difficultyFilter !== 'all') {
      filtered = filtered.filter((t) => t.difficulty === difficultyFilter);
    }

    if (showFeaturedOnly) {
      filtered = filtered.filter((t) => t.featured);
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'popularity':
          return b.popularity - a.popularity;
        case 'rating':
          return b.rating - a.rating;
        case 'recent':
          return b.usageCount - a.usageCount;
        default:
          return 0;
      }
    });

    return filtered;
  }, [templates, selectedCategory, searchQuery, difficultyFilter, showFeaturedOnly, sortBy]);

  const handleTemplateClick = (template: WorkflowTemplate) => {
    setSelectedTemplate(template);
    setDetailsOpen(true);
  };

  const handleStartCustomization = () => {
    setDetailsOpen(false);
    setCustomizationOpen(true);
    setActiveStep(0);

    const initialValues: Record<string, any> = {};
    selectedTemplate?.variables.forEach((variable) => {
      initialValues[variable.key] = variable.defaultValue || '';
    });
    setVariableValues(initialValues);
  };

  const handleVariableChange = (key: string, value: any) => {
    setVariableValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleInstallTemplate = async () => {
    if (!selectedTemplate) return;

    try {
      const response = await fetch('/api/automation/templates/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          variableValues,
        }),
      });

      if (response.ok) {
        setSnackbar({ open: true, message: 'Template installed successfully!', severity: 'success' });
        setCustomizationOpen(false);
        setSelectedTemplate(null);
      } else {
        throw new Error('Installation failed');
      }
    } catch (error) {
      console.error('Failed to install template:', error);
      setSnackbar({ open: true, message: 'Failed to install template', severity: 'error' });
    }
  };

  const renderTemplateCard = (template: WorkflowTemplate) => (
    <Grid item xs={12} sm={6} md={4} key={template.id}>
      <Card
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          cursor: 'pointer',
          transition: 'transform 0.2s, box-shadow 0.2s',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: 6,
          },
        }}
        onClick={() => handleTemplateClick(template)}
      >
        <CardContent sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
              {template.icon}
            </Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6" component="div" gutterBottom>
                {template.name}
                {template.featured && (
                  <Chip
                    icon={<StarIcon />}
                    label="Featured"
                    size="small"
                    color="warning"
                    sx={{ ml: 1 }}
                  />
                )}
              </Typography>
            </Box>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 60 }}>
            {template.description}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
            <Rating value={template.rating} precision={0.1} size="small" readOnly />
            <Typography variant="caption" color="text.secondary">
              ({template.ratingCount})
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
            {template.tags.slice(0, 3).map((tag) => (
              <Chip key={tag} label={tag} size="small" variant="outlined" />
            ))}
          </Box>

          <Divider sx={{ my: 1 }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Chip
              label={template.difficulty}
              size="small"
              sx={{
                bgcolor: DIFFICULTY_COLORS[template.difficulty],
                color: 'white',
              }}
            />
            <Typography variant="caption" color="text.secondary">
              {template.estimatedTimeToSetup} min setup
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {template.usageCount.toLocaleString()} uses
            </Typography>
            {template.premium && (
              <Chip label="Premium" size="small" color="primary" />
            )}
          </Box>
        </CardContent>

        <CardActions>
          <Button size="small" startIcon={<PreviewIcon />}>
            Preview
          </Button>
          <Button size="small" color="primary" startIcon={<InstallIcon />}>
            Install
          </Button>
        </CardActions>
      </Card>
    </Grid>
  );

  const renderDetailsDialog = () => (
    <Dialog
      open={detailsOpen}
      onClose={() => setDetailsOpen(false)}
      maxWidth="md"
      fullWidth
    >
      {selectedTemplate && (
        <>
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2, width: 56, height: 56 }}>
                  <Typography variant="h4">{selectedTemplate.icon}</Typography>
                </Avatar>
                <Box>
                  <Typography variant="h5">{selectedTemplate.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    by {selectedTemplate.author.name}
                  </Typography>
                </Box>
              </Box>
              <IconButton onClick={() => setDetailsOpen(false)}>
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>

          <DialogContent dividers>
            <Box sx={{ mb: 3 }}>
              <Typography variant="body1" paragraph>
                {selectedTemplate.description}
              </Typography>

              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Box>
                  <Rating value={selectedTemplate.rating} precision={0.1} readOnly />
                  <Typography variant="caption" color="text.secondary">
                    {selectedTemplate.ratingCount} ratings
                  </Typography>
                </Box>
                <Divider orientation="vertical" flexItem />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Difficulty
                  </Typography>
                  <Chip
                    label={selectedTemplate.difficulty}
                    size="small"
                    sx={{
                      bgcolor: DIFFICULTY_COLORS[selectedTemplate.difficulty],
                      color: 'white',
                      ml: 1,
                    }}
                  />
                </Box>
                <Divider orientation="vertical" flexItem />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Setup Time
                  </Typography>
                  <Typography variant="body2">
                    {selectedTemplate.estimatedTimeToSetup} minutes
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Tags
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {selectedTemplate.tags.map((tag) => (
                    <Chip key={tag} label={tag} size="small" />
                  ))}
                </Box>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  What This Template Does
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="body2">
                    This template automates the process described above with pre-configured
                    triggers, actions, and conditions. Simply customize the variables to match
                    your needs and activate the workflow.
                  </Typography>
                </Paper>
              </Box>

              {selectedTemplate.variables.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Required Configuration ({selectedTemplate.variables.length} variables)
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    {selectedTemplate.variables.slice(0, 3).map((variable) => (
                      <Box key={variable.key} sx={{ mb: 1 }}>
                        <Typography variant="body2" fontWeight="bold">
                          {variable.label}
                          {variable.required && (
                            <Chip label="Required" size="small" color="error" sx={{ ml: 1 }} />
                          )}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {variable.description}
                        </Typography>
                      </Box>
                    ))}
                    {selectedTemplate.variables.length > 3 && (
                      <Typography variant="caption" color="text.secondary">
                        + {selectedTemplate.variables.length - 3} more variables
                      </Typography>
                    )}
                  </Paper>
                </Box>
              )}

              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Paper variant="outlined" sx={{ p: 2, flex: 1, textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">
                    {selectedTemplate.usageCount.toLocaleString()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Total Uses
                  </Typography>
                </Paper>
                <Paper variant="outlined" sx={{ p: 2, flex: 1, textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">
                    {selectedTemplate.popularity}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Popularity Score
                  </Typography>
                </Paper>
              </Box>
            </Box>
          </DialogContent>

          <DialogActions>
            <Button onClick={() => setDetailsOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleStartCustomization}
            >
              Customize & Install
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );

  const renderCustomizationDialog = () => (
    <Dialog
      open={customizationOpen}
      onClose={() => setCustomizationOpen(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        Customize Template: {selectedTemplate?.name}
        <IconButton
          onClick={() => setCustomizationOpen(false)}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          <Step>
            <StepLabel>Configure Variables</StepLabel>
          </Step>
          <Step>
            <StepLabel>Review Settings</StepLabel>
          </Step>
          <Step>
            <StepLabel>Preview & Install</StepLabel>
          </Step>
        </Stepper>

        {activeStep === 0 && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Configure the following variables for your workflow:
            </Typography>
            {selectedTemplate?.variables.map((variable) => (
              <Box key={variable.key} sx={{ mb: 3 }}>
                {variable.type === 'select' ? (
                  <FormControl fullWidth required={variable.required}>
                    <InputLabel>{variable.label}</InputLabel>
                    <Select
                      value={variableValues[variable.key] || ''}
                      onChange={(e) => handleVariableChange(variable.key, e.target.value)}
                      label={variable.label}
                    >
                      {variable.options?.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                ) : variable.type === 'boolean' ? (
                  <FormControl component="fieldset">
                    <Typography variant="body2" gutterBottom>
                      {variable.label}
                    </Typography>
                    <Box>
                      <Button
                        variant={variableValues[variable.key] === true ? 'contained' : 'outlined'}
                        onClick={() => handleVariableChange(variable.key, true)}
                        sx={{ mr: 1 }}
                      >
                        Yes
                      </Button>
                      <Button
                        variant={variableValues[variable.key] === false ? 'contained' : 'outlined'}
                        onClick={() => handleVariableChange(variable.key, false)}
                      >
                        No
                      </Button>
                    </Box>
                  </FormControl>
                ) : (
                  <TextField
                    fullWidth
                    required={variable.required}
                    label={variable.label}
                    type={variable.type === 'number' ? 'number' : 'text'}
                    value={variableValues[variable.key] || ''}
                    onChange={(e) => handleVariableChange(variable.key, e.target.value)}
                    helperText={variable.description}
                    placeholder={variable.defaultValue?.toString()}
                  />
                )}
              </Box>
            ))}
          </Box>
        )}

        {activeStep === 1 && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Review your configuration:
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
              {selectedTemplate?.variables.map((variable) => (
                <Box key={variable.key} sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    {variable.label}
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {variableValues[variable.key]?.toString() || 'Not set'}
                  </Typography>
                </Box>
              ))}
            </Paper>
          </Box>
        )}

        {activeStep === 2 && (
          <Box>
            <Alert severity="success" sx={{ mb: 2 }}>
              Your workflow is ready to be installed!
            </Alert>
            <Typography variant="subtitle2" gutterBottom>
              Preview:
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Typography variant="body2">
                <strong>Workflow Name:</strong> {selectedTemplate?.name}
              </Typography>
              <Typography variant="body2">
                <strong>Category:</strong> {selectedTemplate?.category}
              </Typography>
              <Typography variant="body2">
                <strong>Estimated Setup Time:</strong> {selectedTemplate?.estimatedTimeToSetup} minutes
              </Typography>
            </Paper>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={() => setCustomizationOpen(false)}>Cancel</Button>
        {activeStep > 0 && (
          <Button onClick={() => setActiveStep((prev) => prev - 1)}>Back</Button>
        )}
        {activeStep < 2 ? (
          <Button
            variant="contained"
            onClick={() => setActiveStep((prev) => prev + 1)}
          >
            Next
          </Button>
        ) : (
          <Button
            variant="contained"
            color="primary"
            startIcon={<CheckIcon />}
            onClick={handleInstallTemplate}
          >
            Install Workflow
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );

  const renderAIChatDialog = () => (
    <Dialog
      open={aiChatOpen}
      onClose={() => setAiChatOpen(false)}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        AI Workflow Assistant
        <IconButton
          onClick={() => setAiChatOpen(false)}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ minHeight: 400 }}>
          <Typography variant="body2" color="text.secondary" paragraph>
            Ask me anything about creating workflows, finding templates, or optimizing your
            automations!
          </Typography>
          <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
            <Typography variant="body2">
              <strong>Try asking:</strong>
            </Typography>
            <Typography variant="body2" component="ul">
              <li>"How can I automate client onboarding?"</li>
              <li>"Show me templates for goal tracking"</li>
              <li>"Help me optimize my welcome email sequence"</li>
            </Typography>
          </Paper>
          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder="Type your question here..."
            variant="outlined"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setAiChatOpen(false)}>Close</Button>
        <Button variant="contained" color="primary">
          Send
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" gutterBottom>
          Template Gallery
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Browse 200+ pre-built automation templates to streamline your coaching workflows
        </Typography>
      </Box>

      <Box sx={{ mb: 4, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField
          placeholder="Search templates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ flexGrow: 1, minWidth: 300 }}
        />

        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Sort By</InputLabel>
          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            label="Sort By"
          >
            <MenuItem value="popularity">Popularity</MenuItem>
            <MenuItem value="rating">Rating</MenuItem>
            <MenuItem value="recent">Most Used</MenuItem>
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Difficulty</InputLabel>
          <Select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            label="Difficulty"
          >
            <MenuItem value="all">All Levels</MenuItem>
            <MenuItem value="beginner">Beginner</MenuItem>
            <MenuItem value="intermediate">Intermediate</MenuItem>
            <MenuItem value="advanced">Advanced</MenuItem>
          </Select>
        </FormControl>

        <Button
          variant={showFeaturedOnly ? 'contained' : 'outlined'}
          startIcon={<StarIcon />}
          onClick={() => setShowFeaturedOnly(!showFeaturedOnly)}
        >
          Featured
        </Button>

        <Button
          variant="outlined"
          startIcon={<ChatIcon />}
          onClick={() => setAiChatOpen(true)}
        >
          AI Assistant
        </Button>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Categories
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {CATEGORIES.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? 'contained' : 'text'}
                  onClick={() => setSelectedCategory(category.id)}
                  sx={{
                    justifyContent: 'space-between',
                    textAlign: 'left',
                  }}
                  fullWidth
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ marginRight: 8 }}>{category.icon}</span>
                    {category.label}
                  </Box>
                  <Badge badgeContent={category.count} color="primary" />
                </Button>
              ))}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={9}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : filteredTemplates.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                No templates found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Try adjusting your filters or search query
              </Typography>
            </Paper>
          ) : (
            <>
              <Typography variant="h6" gutterBottom>
                {filteredTemplates.length} Templates
              </Typography>
              <Grid container spacing={3}>
                {filteredTemplates.map((template) => renderTemplateCard(template))}
              </Grid>
            </>
          )}
        </Grid>
      </Grid>

      {renderDetailsDialog()}
      {renderCustomizationDialog()}
      {renderAIChatDialog()}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default TemplateGallery;
