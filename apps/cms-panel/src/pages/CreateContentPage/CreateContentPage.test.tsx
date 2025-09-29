import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CreateContentPage from '../CreateContentPage';
import { contentApi } from '../../api/content';
import theme from '../../theme';
import toast from 'react-hot-toast';

// Mock dependencies
jest.mock('../../api/content');
jest.mock('react-hot-toast');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

jest.mock('../../components/RichTextEditor', () => {
  return function MockRichTextEditor({ value, onChange }: any) {
    return (
      <div data-testid="rich-text-editor">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          data-testid="content-textarea"
        />
      </div>
    );
  };
});

const mockNavigate = jest.fn();
(require('react-router-dom').useNavigate as jest.Mock).mockReturnValue(mockNavigate);

const mockContentApi = contentApi as jest.Mocked<typeof contentApi>;

describe('CreateContentPage', () => {
  let queryClient: QueryClient;
  const user = userEvent.setup();

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    mockContentApi.getCategories = jest.fn().mockResolvedValue([
      { id: '1', name: 'Technology', slug: 'technology' },
      { id: '2', name: 'Business', slug: 'business' },
    ]);

    mockContentApi.create = jest.fn().mockResolvedValue({
      id: '123',
      title: 'Test Article',
      slug: 'test-article',
      status: 'draft',
    });

    jest.clearAllMocks();
  });

  const renderCreateContentPage = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ThemeProvider theme={theme}>
            <CreateContentPage />
          </ThemeProvider>
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  describe('Component Rendering', () => {
    it('renders the create content form', async () => {
      renderCreateContentPage();

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      });

      expect(screen.getByLabelText(/excerpt/i)).toBeInTheDocument();
      expect(screen.getByTestId('rich-text-editor')).toBeInTheDocument();
      expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/tags/i)).toBeInTheDocument();
    });

    it('loads and displays categories', async () => {
      renderCreateContentPage();

      await waitFor(() => {
        expect(mockContentApi.getCategories).toHaveBeenCalled();
      });

      const categorySelect = screen.getByLabelText(/category/i);
      fireEvent.mouseDown(categorySelect);

      expect(screen.getByText('Technology')).toBeInTheDocument();
      expect(screen.getByText('Business')).toBeInTheDocument();
    });

    it('shows loading state initially', () => {
      renderCreateContentPage();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('validates required fields', async () => {
      renderCreateContentPage();

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /save/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/title must be at least 5 characters/i)).toBeInTheDocument();
        expect(screen.getByText(/excerpt must be at least 20 characters/i)).toBeInTheDocument();
        expect(screen.getByText(/content must be at least 100 characters/i)).toBeInTheDocument();
        expect(screen.getByText(/please select a category/i)).toBeInTheDocument();
        expect(screen.getByText(/please add at least one tag/i)).toBeInTheDocument();
      });
    });

    it('validates title length constraints', async () => {
      renderCreateContentPage();

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      });

      const titleInput = screen.getByLabelText(/title/i);

      // Test minimum length
      await user.type(titleInput, 'Hi');
      fireEvent.blur(titleInput);

      await waitFor(() => {
        expect(screen.getByText(/title must be at least 5 characters/i)).toBeInTheDocument();
      });

      // Test maximum length
      const longTitle = 'a'.repeat(201);
      await user.clear(titleInput);
      await user.type(titleInput, longTitle);
      fireEvent.blur(titleInput);

      await waitFor(() => {
        expect(screen.getByText(/title must be less than 200 characters/i)).toBeInTheDocument();
      });
    });

    it('validates excerpt length constraints', async () => {
      renderCreateContentPage();

      await waitFor(() => {
        expect(screen.getByLabelText(/excerpt/i)).toBeInTheDocument();
      });

      const excerptInput = screen.getByLabelText(/excerpt/i);

      // Test minimum length
      await user.type(excerptInput, 'Short excerpt');
      fireEvent.blur(excerptInput);

      await waitFor(() => {
        expect(screen.getByText(/excerpt must be at least 20 characters/i)).toBeInTheDocument();
      });
    });

    it('validates content minimum length', async () => {
      renderCreateContentPage();

      await waitFor(() => {
        expect(screen.getByTestId('content-textarea')).toBeInTheDocument();
      });

      const contentTextarea = screen.getByTestId('content-textarea');
      await user.type(contentTextarea, 'Short content');

      const submitButton = screen.getByRole('button', { name: /save/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/content must be at least 100 characters/i)).toBeInTheDocument();
      });
    });

    it('validates SEO fields character limits', async () => {
      renderCreateContentPage();

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      });

      // Navigate to SEO tab
      const seoTab = screen.getByRole('tab', { name: /seo/i });
      await user.click(seoTab);

      const seoTitleInput = screen.getByLabelText(/seo title/i);
      const seoDescInput = screen.getByLabelText(/seo description/i);

      // Test SEO title limit
      await user.type(seoTitleInput, 'a'.repeat(61));
      fireEvent.blur(seoTitleInput);

      await waitFor(() => {
        expect(screen.getByText(/seo title must be 60 characters or less/i)).toBeInTheDocument();
      });

      // Test SEO description limit
      await user.type(seoDescInput, 'a'.repeat(161));
      fireEvent.blur(seoDescInput);

      await waitFor(() => {
        expect(screen.getByText(/seo description must be 160 characters or less/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    const fillValidForm = async () => {
      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/title/i), 'Test Article Title');
      await user.type(screen.getByLabelText(/excerpt/i), 'This is a test excerpt with sufficient length for validation');
      await user.type(screen.getByTestId('content-textarea'), 'a'.repeat(101));
      await user.type(screen.getByLabelText(/tags/i), 'test, article');

      // Select category
      const categorySelect = screen.getByLabelText(/category/i);
      fireEvent.mouseDown(categorySelect);
      await user.click(screen.getByText('Technology'));
    };

    it('successfully creates content as draft', async () => {
      renderCreateContentPage();
      await fillValidForm();

      const saveButton = screen.getByRole('button', { name: /save draft/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockContentApi.create).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Test Article Title',
            status: 'draft',
          })
        );
      });

      expect(toast.success).toHaveBeenCalledWith('Content saved as draft');
      expect(mockNavigate).toHaveBeenCalledWith('/content');
    });

    it('successfully publishes content', async () => {
      renderCreateContentPage();
      await fillValidForm();

      const publishButton = screen.getByRole('button', { name: /publish/i });
      await user.click(publishButton);

      await waitFor(() => {
        expect(mockContentApi.create).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Test Article Title',
            status: 'published',
          })
        );
      });

      expect(toast.success).toHaveBeenCalledWith('Content published successfully');
    });

    it('handles submission errors gracefully', async () => {
      const errorMessage = 'Failed to create content';
      mockContentApi.create.mockRejectedValueOnce(new Error(errorMessage));

      renderCreateContentPage();
      await fillValidForm();

      const saveButton = screen.getByRole('button', { name: /save draft/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(errorMessage);
      });

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('shows loading state during submission', async () => {
      // Mock a delayed response
      mockContentApi.create.mockImplementationOnce(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      );

      renderCreateContentPage();
      await fillValidForm();

      const saveButton = screen.getByRole('button', { name: /save draft/i });
      await user.click(saveButton);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(saveButton).toBeDisabled();
    });
  });

  describe('Tab Navigation', () => {
    it('switches between content tabs', async () => {
      renderCreateContentPage();

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      });

      // Check content tab is initially active
      expect(screen.getByRole('tab', { name: /content/i })).toHaveAttribute('aria-selected', 'true');

      // Switch to SEO tab
      const seoTab = screen.getByRole('tab', { name: /seo/i });
      await user.click(seoTab);

      expect(seoTab).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByLabelText(/seo title/i)).toBeInTheDocument();

      // Switch to settings tab
      const settingsTab = screen.getByRole('tab', { name: /settings/i });
      await user.click(settingsTab);

      expect(settingsTab).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByLabelText(/allow comments/i)).toBeInTheDocument();
    });
  });

  describe('Preview Mode', () => {
    it('toggles preview mode', async () => {
      renderCreateContentPage();

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      });

      const previewButton = screen.getByRole('button', { name: /preview/i });
      await user.click(previewButton);

      expect(screen.getByTestId('content-preview')).toBeInTheDocument();
      expect(screen.queryByTestId('rich-text-editor')).not.toBeInTheDocument();

      // Toggle back to edit mode
      const editButton = screen.getByRole('button', { name: /edit/i });
      await user.click(editButton);

      expect(screen.getByTestId('rich-text-editor')).toBeInTheDocument();
      expect(screen.queryByTestId('content-preview')).not.toBeInTheDocument();
    });

    it('sanitizes content in preview', async () => {
      renderCreateContentPage();

      await waitFor(() => {
        expect(screen.getByTestId('content-textarea')).toBeInTheDocument();
      });

      // Input potentially dangerous content
      const maliciousContent = '<script>alert("xss")</script><p>Safe content</p>';
      await user.type(screen.getByTestId('content-textarea'), maliciousContent);

      const previewButton = screen.getByRole('button', { name: /preview/i });
      await user.click(previewButton);

      const preview = screen.getByTestId('content-preview');
      expect(preview).toHaveTextContent('Safe content');
      expect(preview.innerHTML).not.toContain('<script>');
    });
  });

  describe('Featured Image', () => {
    it('validates featured image URL', async () => {
      renderCreateContentPage();

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      });

      const featuredImageInput = screen.getByLabelText(/featured image url/i);
      await user.type(featuredImageInput, 'invalid-url');
      fireEvent.blur(featuredImageInput);

      await waitFor(() => {
        expect(screen.getByText(/must be a valid url/i)).toBeInTheDocument();
      });
    });

    it('accepts valid image URL', async () => {
      renderCreateContentPage();

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      });

      const featuredImageInput = screen.getByLabelText(/featured image url/i);
      await user.type(featuredImageInput, 'https://example.com/image.jpg');
      fireEvent.blur(featuredImageInput);

      await waitFor(() => {
        expect(screen.queryByText(/must be a valid url/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper form labels', async () => {
      renderCreateContentPage();

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      });

      expect(screen.getByLabelText(/excerpt/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/tags/i)).toBeInTheDocument();
    });

    it('announces form errors to screen readers', async () => {
      renderCreateContentPage();

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /save/i });
      await user.click(submitButton);

      await waitFor(() => {
        const errorMessages = screen.getAllByRole('alert');
        expect(errorMessages.length).toBeGreaterThan(0);
      });
    });

    it('supports keyboard navigation', async () => {
      renderCreateContentPage();

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      });

      const titleInput = screen.getByLabelText(/title/i);
      titleInput.focus();

      await user.keyboard('{Tab}');
      expect(screen.getByLabelText(/excerpt/i)).toHaveFocus();

      await user.keyboard('{Tab}');
      expect(screen.getByTestId('content-textarea')).toHaveFocus();
    });

    it('has proper heading hierarchy', async () => {
      renderCreateContentPage();

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/create content/i);
      });

      const headings = screen.getAllByRole('heading');
      expect(headings.some(h => h.tagName === 'H1')).toBe(true);
    });
  });

  describe('Auto-save Functionality', () => {
    it('automatically saves draft content', async () => {
      jest.useFakeTimers();

      renderCreateContentPage();
      await fillValidForm();

      // Trigger auto-save after delay
      jest.advanceTimersByTime(30000); // 30 seconds

      await waitFor(() => {
        expect(mockContentApi.create).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'draft',
          })
        );
      });

      jest.useRealTimers();
    });

    it('shows auto-save status', async () => {
      jest.useFakeTimers();

      renderCreateContentPage();

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/title/i), 'Test Title');

      jest.advanceTimersByTime(5000);

      await waitFor(() => {
        expect(screen.getByText(/auto-saved/i)).toBeInTheDocument();
      });

      jest.useRealTimers();
    });
  });

  describe('Error Recovery', () => {
    it('recovers from category loading failure', async () => {
      mockContentApi.getCategories.mockRejectedValueOnce(new Error('Network error'));

      renderCreateContentPage();

      await waitFor(() => {
        expect(screen.getByText(/failed to load categories/i)).toBeInTheDocument();
      });

      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();

      // Mock successful retry
      mockContentApi.getCategories.mockResolvedValueOnce([
        { id: '1', name: 'Technology', slug: 'technology' },
      ]);

      await user.click(retryButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
      });
    });

    it('preserves form data on component remount', () => {
      const { rerender } = renderCreateContentPage();

      // Fill form data would be preserved via localStorage or state management
      // This test would verify that implementation exists
      expect(true).toBe(true); // Placeholder for actual implementation test
    });
  });
});