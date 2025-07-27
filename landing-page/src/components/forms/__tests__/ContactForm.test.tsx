import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ContactForm from '../ContactForm';

// Mock fetch
global.fetch = jest.fn();

// Mock analytics
jest.mock('@/services/analytics', () => ({
  trackContactForm: jest.fn(),
}));

describe('ContactForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ 
        success: true,
        data: { ticketId: 'CONTACT-12345' }
      }),
    });
  });

  describe('Default Variant', () => {
    it('renders all form fields', () => {
      render(<ContactForm />);
      
      expect(screen.getByPlaceholderText('Your name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Email address')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Your message')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument();
    });

    it('validates required fields', async () => {
      render(<ContactForm />);
      const user = userEvent.setup();
      
      // Try to submit empty form
      await user.click(screen.getByRole('button', { name: /send message/i }));
      
      expect(screen.getByText(/please enter your name/i)).toBeInTheDocument();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('validates email format', async () => {
      render(<ContactForm />);
      const user = userEvent.setup();
      
      await user.type(screen.getByPlaceholderText('Your name'), 'John Doe');
      await user.type(screen.getByPlaceholderText('Email address'), 'invalid-email');
      await user.type(screen.getByPlaceholderText('Your message'), 'Test message');
      
      await user.click(screen.getByRole('button', { name: /send message/i }));
      
      expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument();
    });

    it('validates message length', async () => {
      render(<ContactForm />);
      const user = userEvent.setup();
      
      await user.type(screen.getByPlaceholderText('Your name'), 'John Doe');
      await user.type(screen.getByPlaceholderText('Email address'), 'john@example.com');
      await user.type(screen.getByPlaceholderText('Your message'), 'Short');
      
      await user.click(screen.getByRole('button', { name: /send message/i }));
      
      expect(screen.getByText(/message must be at least 10 characters/i)).toBeInTheDocument();
    });

    it('submits form successfully', async () => {
      const onSuccess = jest.fn();
      render(<ContactForm onSuccess={onSuccess} />);
      const user = userEvent.setup();
      
      await user.type(screen.getByPlaceholderText('Your name'), 'John Doe');
      await user.type(screen.getByPlaceholderText('Email address'), 'john@example.com');
      await user.type(screen.getByPlaceholderText('Your message'), 'This is a test message');
      
      await user.click(screen.getByRole('button', { name: /send message/i }));
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'John Doe',
            email: 'john@example.com',
            company: '',
            message: 'This is a test message',
            source: 'contact-form',
          }),
        });
      });
      
      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith({
          name: 'John Doe',
          email: 'john@example.com',
          company: '',
          message: 'This is a test message',
          source: 'contact-form',
        });
      });
      
      expect(screen.getByText(/message sent successfully/i)).toBeInTheDocument();
    });
  });

  describe('Sidebar Variant', () => {
    it('renders sidebar layout correctly', () => {
      render(<ContactForm variant="sidebar" />);
      
      expect(screen.getByText(/get in touch/i)).toBeInTheDocument();
      expect(screen.getByText(/have questions\?/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send message/i })).toHaveClass('w-full');
    });

    it('shows field-specific errors inline', async () => {
      render(<ContactForm variant="sidebar" />);
      const user = userEvent.setup();
      
      // Focus and blur name field without typing
      await user.click(screen.getByPlaceholderText('Your name'));
      await user.click(screen.getByPlaceholderText('Email address'));
      
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    });
  });

  describe('Full Variant', () => {
    it('renders full layout with contact info', () => {
      render(<ContactForm variant="full" />);
      
      expect(screen.getByText(/let's build something amazing together/i)).toBeInTheDocument();
      expect(screen.getByText(/email us/i)).toBeInTheDocument();
      expect(screen.getByText(/hello@upcoach.ai/i)).toBeInTheDocument();
      expect(screen.getByText(/live chat/i)).toBeInTheDocument();
      expect(screen.getByText(/enterprise/i)).toBeInTheDocument();
    });

    it('includes company field with icon', () => {
      render(<ContactForm variant="full" />);
      
      expect(screen.getByLabelText(/company/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/name \*/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email \*/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/message \*/i)).toBeInTheDocument();
    });

    it('shows success message after submission', async () => {
      render(<ContactForm variant="full" />);
      const user = userEvent.setup();
      
      await user.type(screen.getByLabelText(/name \*/i), 'John Doe');
      await user.type(screen.getByLabelText(/email \*/i), 'john@example.com');
      await user.type(screen.getByLabelText(/company/i), 'Acme Corp');
      await user.type(screen.getByLabelText(/message \*/i), 'This is a test message from Acme Corp');
      
      await user.click(screen.getByRole('button', { name: /send message/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/thank you! we'll get back to you within 24 hours/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles API errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Rate limit exceeded' }),
      });
      
      render(<ContactForm />);
      const user = userEvent.setup();
      
      await user.type(screen.getByPlaceholderText('Your name'), 'John Doe');
      await user.type(screen.getByPlaceholderText('Email address'), 'john@example.com');
      await user.type(screen.getByPlaceholderText('Your message'), 'This is a test message');
      
      await user.click(screen.getByRole('button', { name: /send message/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/rate limit exceeded/i)).toBeInTheDocument();
      });
    });

    it('handles network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      
      render(<ContactForm />);
      const user = userEvent.setup();
      
      await user.type(screen.getByPlaceholderText('Your name'), 'John Doe');
      await user.type(screen.getByPlaceholderText('Email address'), 'john@example.com');
      await user.type(screen.getByPlaceholderText('Your message'), 'This is a test message');
      
      await user.click(screen.getByRole('button', { name: /send message/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form State Management', () => {
    it('disables form during submission', async () => {
      render(<ContactForm />);
      const user = userEvent.setup();
      
      await user.type(screen.getByPlaceholderText('Your name'), 'John Doe');
      await user.type(screen.getByPlaceholderText('Email address'), 'john@example.com');
      await user.type(screen.getByPlaceholderText('Your message'), 'This is a test message');
      
      const button = screen.getByRole('button', { name: /send message/i });
      await user.click(button);
      
      // Check loading state
      expect(screen.getByText(/sending/i)).toBeInTheDocument();
      expect(button).toBeDisabled();
      expect(screen.getByPlaceholderText('Your name')).toBeDisabled();
    });

    it('resets form after successful submission', async () => {
      render(<ContactForm />);
      const user = userEvent.setup();
      
      const nameInput = screen.getByPlaceholderText('Your name');
      const emailInput = screen.getByPlaceholderText('Email address');
      const messageInput = screen.getByPlaceholderText('Your message');
      
      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'john@example.com');
      await user.type(messageInput, 'This is a test message');
      
      await user.click(screen.getByRole('button', { name: /send message/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/message sent successfully/i)).toBeInTheDocument();
      });
      
      // Wait for form reset
      await waitFor(() => {
        expect(nameInput).toHaveValue('');
        expect(emailInput).toHaveValue('');
        expect(messageInput).toHaveValue('');
      }, { timeout: 4000 });
    });
  });

  describe('Analytics Integration', () => {
    it('tracks form submission', async () => {
      const { trackContactForm } = require('@/services/analytics');
      
      render(<ContactForm variant="sidebar" />);
      const user = userEvent.setup();
      
      await user.type(screen.getByPlaceholderText('Your name'), 'John Doe');
      await user.type(screen.getByPlaceholderText('Email address'), 'john@example.com');
      await user.type(screen.getByPlaceholderText('Your message'), 'This is a test message');
      
      await user.click(screen.getByRole('button', { name: /send message/i }));
      
      await waitFor(() => {
        expect(trackContactForm).toHaveBeenCalledWith('sidebar');
      });
    });
  });
});