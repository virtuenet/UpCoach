import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import RichTextEditor from './RichTextEditor';

// Mock TipTap dependencies
jest.mock('@tiptap/react', () => ({
  useEditor: jest.fn(),
  EditorContent: ({ editor }: { editor: any }) => (
    <div data-testid="editor-content" contentEditable>
      {editor?.getHTML() || ''}
    </div>
  ),
}));

jest.mock('@tiptap/starter-kit', () => ({
  StarterKit: jest.fn(),
}));

const mockEditor = {
  getHTML: jest.fn(() => '<p>Test content</p>'),
  setContent: jest.fn(),
  commands: {
    setContent: jest.fn(),
    toggleBold: jest.fn(),
    toggleItalic: jest.fn(),
    toggleUnderline: jest.fn(),
    insertContent: jest.fn(),
  },
  isActive: jest.fn((format: string) => false),
  can: jest.fn(() => ({ toggleBold: jest.fn(() => true) })),
};

const { useEditor } = require('@tiptap/react');

describe('RichTextEditor', () => {
  let queryClient: QueryClient;
  const user = userEvent.setup();
  const mockOnChange = jest.fn();

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    useEditor.mockReturnValue(mockEditor);
    jest.clearAllMocks();
  });

  const renderEditor = (props = {}) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <RichTextEditor
          value="<p>Initial content</p>"
          onChange={mockOnChange}
          {...props}
        />
      </QueryClientProvider>
    );
  };

  describe('Component Rendering', () => {
    it('renders the rich text editor', () => {
      renderEditor();
      expect(screen.getByTestId('editor-content')).toBeInTheDocument();
    });

    it('renders with initial content', () => {
      renderEditor({ value: '<p>Test initial content</p>' });
      expect(mockEditor.setContent).toHaveBeenCalledWith('<p>Test initial content</p>');
    });

    it('renders toolbar buttons', () => {
      renderEditor();
      expect(screen.getByRole('button', { name: /bold/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /italic/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /underline/i })).toBeInTheDocument();
    });

    it('renders disabled state correctly', () => {
      renderEditor({ disabled: true });
      const toolbar = screen.getByTestId('editor-toolbar');
      expect(toolbar).toHaveClass('opacity-50');

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toBeDisabled();
      });
    });
  });

  describe('Text Formatting', () => {
    it('toggles bold formatting', async () => {
      renderEditor();
      const boldButton = screen.getByRole('button', { name: /bold/i });

      await user.click(boldButton);
      expect(mockEditor.commands.toggleBold).toHaveBeenCalled();
    });

    it('toggles italic formatting', async () => {
      renderEditor();
      const italicButton = screen.getByRole('button', { name: /italic/i });

      await user.click(italicButton);
      expect(mockEditor.commands.toggleItalic).toHaveBeenCalled();
    });

    it('shows active formatting state', () => {
      mockEditor.isActive.mockImplementation((format: string) => format === 'bold');
      renderEditor();

      const boldButton = screen.getByRole('button', { name: /bold/i });
      expect(boldButton).toHaveClass('bg-blue-100');
    });

    it('disables formatting when not available', () => {
      mockEditor.can.mockReturnValue({ toggleBold: () => false });
      renderEditor();

      const boldButton = screen.getByRole('button', { name: /bold/i });
      expect(boldButton).toBeDisabled();
    });
  });

  describe('Content Management', () => {
    it('calls onChange when content changes', () => {
      const onUpdate = jest.fn();
      useEditor.mockReturnValue({
        ...mockEditor,
        on: jest.fn((event, callback) => {
          if (event === 'update') {
            onUpdate.mockImplementation(callback);
          }
        }),
      });

      renderEditor();

      // Simulate content update
      onUpdate({ editor: mockEditor });
      expect(mockOnChange).toHaveBeenCalledWith('<p>Test content</p>');
    });

    it('handles empty content correctly', () => {
      mockEditor.getHTML.mockReturnValue('');
      renderEditor();

      const onUpdate = jest.fn();
      useEditor.mockReturnValue({
        ...mockEditor,
        on: jest.fn((event, callback) => {
          if (event === 'update') {
            onUpdate.mockImplementation(callback);
          }
        }),
      });

      onUpdate({ editor: mockEditor });
      expect(mockOnChange).toHaveBeenCalledWith('');
    });

    it('validates minimum content length', async () => {
      const mockOnValidation = jest.fn();
      renderEditor({
        minLength: 10,
        onValidationChange: mockOnValidation
      });

      mockEditor.getHTML.mockReturnValue('<p>Short</p>');
      const onUpdate = jest.fn();
      useEditor.mockReturnValue({
        ...mockEditor,
        on: jest.fn((event, callback) => {
          if (event === 'update') {
            onUpdate.mockImplementation(callback);
          }
        }),
      });

      onUpdate({ editor: mockEditor });
      expect(mockOnValidation).toHaveBeenCalledWith(false);
    });
  });

  describe('Image Handling', () => {
    it('opens image upload dialog', async () => {
      renderEditor();
      const imageButton = screen.getByRole('button', { name: /image/i });

      await user.click(imageButton);
      expect(screen.getByTestId('image-upload-dialog')).toBeInTheDocument();
    });

    it('inserts image with valid URL', async () => {
      renderEditor();
      const imageButton = screen.getByRole('button', { name: /image/i });

      await user.click(imageButton);

      const urlInput = screen.getByLabelText(/image url/i);
      await user.type(urlInput, 'https://example.com/image.jpg');

      const insertButton = screen.getByRole('button', { name: /insert/i });
      await user.click(insertButton);

      expect(mockEditor.commands.insertContent).toHaveBeenCalledWith({
        type: 'image',
        attrs: { src: 'https://example.com/image.jpg' },
      });
    });

    it('validates image URL format', async () => {
      renderEditor();
      const imageButton = screen.getByRole('button', { name: /image/i });

      await user.click(imageButton);

      const urlInput = screen.getByLabelText(/image url/i);
      await user.type(urlInput, 'invalid-url');

      const insertButton = screen.getByRole('button', { name: /insert/i });
      await user.click(insertButton);

      expect(screen.getByText(/please enter a valid url/i)).toBeInTheDocument();
      expect(mockEditor.commands.insertContent).not.toHaveBeenCalled();
    });
  });

  describe('Link Management', () => {
    it('creates link with selection', async () => {
      renderEditor();
      const linkButton = screen.getByRole('button', { name: /link/i });

      await user.click(linkButton);

      const urlInput = screen.getByLabelText(/link url/i);
      await user.type(urlInput, 'https://example.com');

      const applyButton = screen.getByRole('button', { name: /apply/i });
      await user.click(applyButton);

      expect(mockEditor.commands.insertContent).toHaveBeenCalled();
    });

    it('removes existing link', async () => {
      mockEditor.isActive.mockImplementation((format: string) => format === 'link');
      renderEditor();

      const linkButton = screen.getByRole('button', { name: /unlink/i });
      await user.click(linkButton);

      expect(mockEditor.commands.unsetLink).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      renderEditor();

      const boldButton = screen.getByRole('button', { name: /bold/i });
      expect(boldButton).toHaveAttribute('aria-label');

      const editor = screen.getByTestId('editor-content');
      expect(editor).toHaveAttribute('role', 'textbox');
    });

    it('supports keyboard navigation', async () => {
      renderEditor();

      const boldButton = screen.getByRole('button', { name: /bold/i });
      boldButton.focus();

      await user.keyboard('{Enter}');
      expect(mockEditor.commands.toggleBold).toHaveBeenCalled();
    });

    it('announces formatting changes to screen readers', async () => {
      mockEditor.isActive.mockImplementation((format: string) => format === 'bold');
      renderEditor();

      const announcement = screen.getByLabelText(/bold formatting applied/i);
      expect(announcement).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles editor initialization failure', () => {
      useEditor.mockReturnValue(null);
      renderEditor();

      expect(screen.getByText(/editor failed to load/i)).toBeInTheDocument();
    });

    it('handles content sanitization', () => {
      const maliciousContent = '<script>alert("xss")</script><p>Safe content</p>';
      renderEditor({ value: maliciousContent });

      expect(mockEditor.setContent).toHaveBeenCalledWith('<p>Safe content</p>');
    });

    it('recovers from editor crashes', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockEditor.getHTML.mockImplementation(() => {
        throw new Error('Editor crash');
      });

      renderEditor();

      await waitFor(() => {
        expect(screen.getByText(/editor encountered an error/i)).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Performance', () => {
    it('debounces content changes', async () => {
      jest.useFakeTimers();
      renderEditor();

      const onUpdate = jest.fn();
      useEditor.mockReturnValue({
        ...mockEditor,
        on: jest.fn((event, callback) => {
          if (event === 'update') {
            onUpdate.mockImplementation(callback);
          }
        }),
      });

      // Trigger multiple rapid updates
      onUpdate({ editor: mockEditor });
      onUpdate({ editor: mockEditor });
      onUpdate({ editor: mockEditor });

      expect(mockOnChange).not.toHaveBeenCalled();

      jest.advanceTimersByTime(300);
      expect(mockOnChange).toHaveBeenCalledTimes(1);

      jest.useRealTimers();
    });

    it('memoizes toolbar buttons', () => {
      const { rerender } = renderEditor();
      const boldButton = screen.getByRole('button', { name: /bold/i });
      const buttonInstance = boldButton;

      rerender(
        <QueryClientProvider client={queryClient}>
          <RichTextEditor
            value="<p>Updated content</p>"
            onChange={mockOnChange}
          />
        </QueryClientProvider>
      );

      const updatedBoldButton = screen.getByRole('button', { name: /bold/i });
      expect(updatedBoldButton).toBe(buttonInstance);
    });
  });
});