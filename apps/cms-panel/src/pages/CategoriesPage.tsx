import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Grid,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Menu,
  MenuItem,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Folder as FolderIcon,
  Article as ArticleIcon,
} from '@mui/icons-material';

interface Category {
  id: string;
  name: string;
  description: string;
  slug: string;
  color: string;
  contentCount: number;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
}

interface CategoryFormData {
  name: string;
  description: string;
  color: string;
  parentId?: string;
}

const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    description: '',
    color: '#1976d2',
    parentId: undefined,
  });
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  // Mock data for development
  const mockCategories: Category[] = [
    {
      id: '1',
      name: 'Personal Development',
      description: 'Content focused on personal growth and self-improvement',
      slug: 'personal-development',
      color: '#1976d2',
      contentCount: 24,
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-20T15:30:00Z',
    },
    {
      id: '2',
      name: 'Career Coaching',
      description: 'Professional development and career advancement resources',
      slug: 'career-coaching',
      color: '#388e3c',
      contentCount: 18,
      createdAt: '2024-01-10T09:00:00Z',
      updatedAt: '2024-01-18T14:20:00Z',
    },
    {
      id: '3',
      name: 'Health & Wellness',
      description: 'Physical and mental health improvement content',
      slug: 'health-wellness',
      color: '#f57c00',
      contentCount: 31,
      createdAt: '2024-01-05T11:30:00Z',
      updatedAt: '2024-01-22T16:45:00Z',
    },
    {
      id: '4',
      name: 'Leadership',
      description: 'Leadership skills and management training',
      slug: 'leadership',
      color: '#7b1fa2',
      contentCount: 15,
      createdAt: '2024-01-12T13:15:00Z',
      updatedAt: '2024-01-19T12:30:00Z',
    },
  ];

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setCategories(mockCategories);
      setError(null);
    } catch (err) {
      setError('Failed to load categories');
      console.error('Error loading categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        description: category.description,
        color: category.color,
        parentId: category.parentId,
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        description: '',
        color: '#1976d2',
        parentId: undefined,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
      color: '#1976d2',
      parentId: undefined,
    });
  };

  const handleSaveCategory = async () => {
    try {
      if (!formData.name.trim()) {
        setError('Category name is required');
        return;
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      if (editingCategory) {
        // Update existing category
        setCategories(prev =>
          prev.map(cat =>
            cat.id === editingCategory.id
              ? {
                  ...cat,
                  ...formData,
                  slug: formData.name.toLowerCase().replace(/\s+/g, '-'),
                  updatedAt: new Date().toISOString(),
                }
              : cat
          )
        );
      } else {
        // Create new category
        const newCategory: Category = {
          id: Date.now().toString(),
          ...formData,
          slug: formData.name.toLowerCase().replace(/\s+/g, '-'),
          contentCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setCategories(prev => [...prev, newCategory]);
      }

      handleCloseDialog();
      setError(null);
    } catch (err) {
      setError('Failed to save category');
      console.error('Error saving category:', err);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!window.confirm('Are you sure you want to delete this category?')) {
      return;
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setCategories(prev => prev.filter(cat => cat.id !== categoryId));
      setError(null);
    } catch (err) {
      setError('Failed to delete category');
      console.error('Error deleting category:', err);
    }
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, category: Category) => {
    setAnchorEl(event.currentTarget);
    setSelectedCategory(category);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedCategory(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Content Categories
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Category
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {categories.map((category) => (
          <Grid item xs={12} sm={6} md={4} key={category.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <FolderIcon sx={{ color: category.color }} />
                    <Typography variant="h6" component="h3" noWrap>
                      {category.name}
                    </Typography>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuClick(e, category)}
                  >
                    <MoreVertIcon />
                  </IconButton>
                </Box>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2, minHeight: '40px' }}
                >
                  {category.description}
                </Typography>

                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <ArticleIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    {category.contentCount} articles
                  </Typography>
                </Box>

                <Chip
                  label={category.slug}
                  size="small"
                  variant="outlined"
                  sx={{ mb: 2 }}
                />

                <Typography variant="caption" color="text.secondary" display="block">
                  Updated: {formatDate(category.updatedAt)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}

        {categories.length === 0 && (
          <Grid item xs={12}>
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              minHeight="300px"
              textAlign="center"
            >
              <FolderIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No categories found
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                Create your first category to organize your content
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
              >
                Add Category
              </Button>
            </Box>
          </Grid>
        )}
      </Grid>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem
          onClick={() => {
            handleOpenDialog(selectedCategory!);
            handleMenuClose();
          }}
        >
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleDeleteCategory(selectedCategory!.id);
            handleMenuClose();
          }}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingCategory ? 'Edit Category' : 'Add New Category'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Category Name"
            fullWidth
            variant="outlined"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            sx={{ mb: 2 }}
          />
          <Box display="flex" alignItems="center" gap={2}>
            <TextField
              margin="dense"
              label="Color"
              type="color"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              sx={{ minWidth: '100px' }}
            />
            <Typography variant="body2" color="text.secondary">
              Choose a color for this category
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSaveCategory} variant="contained">
            {editingCategory ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CategoriesPage;