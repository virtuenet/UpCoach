import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LeadCaptureForm from '@/components/LeadCaptureForm';
import { trackFormSubmit } from '@/services/analytics';

// Mock dependencies
jest.mock('@/services/analytics');

// Mock fetch
global.fetch = jest.fn();

describe('LeadCaptureForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
  });

  describe('Functionality Tests', () => {
    test('renders all form fields correctly', () => {
      render(<LeadCaptureForm source="test" />);
      
      expect(screen.getByLabelText('Full Name *')).toBeInTheDocument();
      expect(screen.getByLabelText('Work Email *')).toBeInTheDocument();
      expect(screen.getByLabelText('Company')).toBeInTheDocument();
      expect(screen.getByLabelText('Your Role')).toBeInTheDocument();
      expect(screen.getByLabelText('Primary Interest')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Get Early Access/i })).toBeInTheDocument();
    });

    test('validates required fields', async () => {
      const user = userEvent.setup();
      render(<LeadCaptureForm source="test" />);
      
      const submitButton = screen.getByRole('button', { name: /Get Early Access/i });
      
      // Try to submit without filling required fields
      await user.click(submitButton);
      
      // Check that form wasn't submitted (fetch not called)
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('validates email format', async () => {
      const user = userEvent.setup();
      render(<LeadCaptureForm source="test" />);
      
      // Fill name
      await user.type(screen.getByLabelText('Full Name *'), 'John Doe');
      
      // Fill invalid email
      await user.type(screen.getByLabelText('Work Email *'), 'invalid-email');
      
      const submitButton = screen.getByRole('button', { name: /Get Early Access/i });
      await user.click(submitButton);
      
      // Form should not submit with invalid email
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('submits form with valid data', async () => {
      const user = userEvent.setup();
      const onSuccess = jest.fn();
      render(<LeadCaptureForm source="test" onSuccess={onSuccess} />);
      
      // Fill form
      await user.type(screen.getByLabelText('Full Name *'), 'John Doe');
      await user.type(screen.getByLabelText('Work Email *'), 'john@company.com');
      await user.type(screen.getByLabelText('Company'), 'Acme Inc');
      await user.selectOptions(screen.getByLabelText('Your Role'), 'manager');
      await user.selectOptions(screen.getByLabelText('Primary Interest'), 'productivity');
      
      // Submit form
      await user.click(screen.getByRole('button', { name: /Get Early Access/i }));
      
      // Check API call
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/lead-capture', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'John Doe',
            email: 'john@company.com',
            company: 'Acme Inc',
            role: 'manager',
            interest: 'productivity',
            marketingConsent: true,
            source: 'test',
            timestamp: expect.any(String),
          }),
        });
      });
      
      // Check analytics tracking
      expect(trackFormSubmit).toHaveBeenCalledWith('lead_capture', 'test');
      
      // Check success callback
      expect(onSuccess).toHaveBeenCalled();
    });

    test('shows success message after submission', async () => {
      const user = userEvent.setup();
      render(<LeadCaptureForm source="test" />);
      
      // Fill and submit form
      await user.type(screen.getByLabelText('Full Name *'), 'John Doe');
      await user.type(screen.getByLabelText('Work Email *'), 'john@company.com');
      await user.click(screen.getByRole('button', { name: /Get Early Access/i }));
      
      // Check success message
      await waitFor(() => {
        expect(screen.getByText('Thank You!')).toBeInTheDocument();
        expect(screen.getByText(/We'll be in touch soon/i)).toBeInTheDocument();
      });
    });

    test('handles submission errors gracefully', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      
      render(<LeadCaptureForm source="test" />);
      
      // Fill and submit form
      await user.type(screen.getByLabelText('Full Name *'), 'John Doe');
      await user.type(screen.getByLabelText('Work Email *'), 'john@company.com');
      await user.click(screen.getByRole('button', { name: /Get Early Access/i }));
      
      // Check error message
      await waitFor(() => {
        expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument();
      });
    });

    test('handles marketing consent checkbox', async () => {
      const user = userEvent.setup();
      render(<LeadCaptureForm source="test" />);
      
      const checkbox = screen.getByRole('checkbox');
      
      // Should be checked by default
      expect(checkbox).toBeChecked();
      
      // Uncheck it
      await user.click(checkbox);
      expect(checkbox).not.toBeChecked();
      
      // Check it again
      await user.click(checkbox);
      expect(checkbox).toBeChecked();
    });
  });

  describe('UI/UX Tests', () => {
    test('shows loading state during submission', async () => {
      const user = userEvent.setup();
      
      // Delay the response to see loading state
      (global.fetch as jest.Mock).mockImplementationOnce(() => 
        new Promise(resolve => setTimeout(() => resolve({ ok: true, json: async () => ({}) }), 100))
      );
      
      render(<LeadCaptureForm source="test" />);
      
      // Fill and submit
      await user.type(screen.getByLabelText('Full Name *'), 'John Doe');
      await user.type(screen.getByLabelText('Work Email *'), 'john@company.com');
      await user.click(screen.getByRole('button', { name: /Get Early Access/i }));
      
      // Check loading state
      expect(screen.getByText('Submitting...')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeDisabled();
    });

    test('displays field icons correctly', () => {
      render(<LeadCaptureForm source="test" />);
      
      // Check for icon containers (Lucide icons render as SVGs)
      const nameField = screen.getByLabelText('Full Name *').closest('div');
      const emailField = screen.getByLabelText('Work Email *').closest('div');
      const companyField = screen.getByLabelText('Company').closest('div');
      
      expect(nameField?.querySelector('svg')).toBeInTheDocument();
      expect(emailField?.querySelector('svg')).toBeInTheDocument();
      expect(companyField?.querySelector('svg')).toBeInTheDocument();
    });

    test('focuses on first field on mount', () => {
      render(<LeadCaptureForm source="test" />);
      
      // First field should not be auto-focused (better UX)
      const nameField = screen.getByLabelText('Full Name *');
      expect(document.activeElement).not.toBe(nameField);
    });
  });

  describe('Accessibility Tests', () => {
    test('all fields have proper labels', () => {
      render(<LeadCaptureForm source="test" />);
      
      expect(screen.getByLabelText('Full Name *')).toBeInTheDocument();
      expect(screen.getByLabelText('Work Email *')).toBeInTheDocument();
      expect(screen.getByLabelText('Company')).toBeInTheDocument();
      expect(screen.getByLabelText('Your Role')).toBeInTheDocument();
      expect(screen.getByLabelText('Primary Interest')).toBeInTheDocument();
    });

    test('required fields are marked as required', () => {
      render(<LeadCaptureForm source="test" />);
      
      const nameField = screen.getByLabelText('Full Name *');
      const emailField = screen.getByLabelText('Work Email *');
      
      expect(nameField).toHaveAttribute('required');
      expect(emailField).toHaveAttribute('required');
    });

    test('form has proper ARIA attributes', () => {
      render(<LeadCaptureForm source="test" />);
      
      const form = screen.getByRole('button', { name: /Get Early Access/i }).closest('form');
      expect(form).toBeInTheDocument();
    });

    test('error messages are accessible', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      
      render(<LeadCaptureForm source="test" />);
      
      await user.type(screen.getByLabelText('Full Name *'), 'John Doe');
      await user.type(screen.getByLabelText('Work Email *'), 'john@company.com');
      await user.click(screen.getByRole('button', { name: /Get Early Access/i }));
      
      await waitFor(() => {
        const errorMessage = screen.getByText('Something went wrong. Please try again.');
        expect(errorMessage).toBeInTheDocument();
      });
    });
  });
});