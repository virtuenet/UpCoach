import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NewsletterForm from "../NewsletterForm";

// Mock fetch
global.fetch = jest.fn();

// Mock analytics
jest.mock("@/services/analytics", () => ({
  trackNewsletterSignup: jest.fn(),
}));

// Mock experiments
jest.mock("@/services/experiments", () => ({
  useExperiment: () => ({
    variant: 'control',
    trackConversion: jest.fn(),
  }),
}));

describe("NewsletterForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
  });

  describe("Inline Variant", () => {
    it("renders inline form correctly", () => {
      render(<NewsletterForm variant="inline" />);

      expect(
        screen.getByPlaceholderText("Enter your email"),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /subscribe/i }),
      ).toBeInTheDocument();
    });

    it("validates email format", async () => {
      render(<NewsletterForm variant="inline" />);

      const input = screen.getByPlaceholderText("Enter your email");
      const button = screen.getByRole("button", { name: /subscribe/i });

      // Test invalid email
      await userEvent.type(input, "invalid-email");
      await userEvent.click(button);

      expect(
        screen.getByText(/please enter a valid email/i),
      ).toBeInTheDocument();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("submits valid email successfully", async () => {
      const onSuccess = jest.fn();
      render(<NewsletterForm variant="inline" onSuccess={onSuccess} />);

      const input = screen.getByPlaceholderText("Enter your email");
      const button = screen.getByRole("button", { name: /subscribe/i });

      await userEvent.type(input, "test@example.com");
      await userEvent.click(button);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith("/api/newsletter", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "test@example.com" }),
        });
      });

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith("test@example.com");
      });

      expect(
        screen.getByRole("button", { name: /subscribed/i }),
      ).toBeInTheDocument();
    });

    it("handles API errors gracefully", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: "Server error" }),
      });

      render(<NewsletterForm variant="inline" />);

      const input = screen.getByPlaceholderText("Enter your email");
      await userEvent.type(input, "test@example.com");
      await userEvent.click(screen.getByRole("button", { name: /subscribe/i }));

      await waitFor(() => {
        expect(screen.getByText(/server error/i)).toBeInTheDocument();
      });
    });
  });

  describe("Hero Variant", () => {
    it("renders hero variant with enhanced styling", () => {
      render(<NewsletterForm variant="hero" />);

      expect(
        screen.getByText(/get weekly productivity tips/i),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/join 25,000\+ professionals/i),
      ).toBeInTheDocument();
      expect(screen.getByText(/no spam, ever/i)).toBeInTheDocument();
    });

    it("shows loading state during submission", async () => {
      render(<NewsletterForm variant="hero" />);

      const input = screen.getByPlaceholderText("Enter your email");
      await userEvent.type(input, "test@example.com");

      const button = screen.getByRole("button", { name: /subscribe/i });
      fireEvent.click(button);

      expect(screen.getByText(/subscribing/i)).toBeInTheDocument();
      expect(button).toBeDisabled();
    });
  });

  describe("Modal Variant", () => {
    it("renders modal variant correctly", () => {
      render(<NewsletterForm variant="modal" />);

      expect(screen.getByText(/stay updated/i)).toBeInTheDocument();
      expect(screen.getByText(/get the latest tips/i)).toBeInTheDocument();
    });

    it("disables form during success state", async () => {
      render(<NewsletterForm variant="modal" />);

      const input = screen.getByPlaceholderText("Enter your email");
      await userEvent.type(input, "test@example.com");
      await userEvent.click(screen.getByRole("button", { name: /subscribe/i }));

      await waitFor(() => {
        expect(
          screen.getByText(/message sent successfully/i),
        ).toBeInTheDocument();
        expect(input).toBeDisabled();
      });
    });
  });

  describe("Analytics Integration", () => {
    it("tracks newsletter signup on success", async () => {
      const { trackNewsletterSignup } = require("@/services/analytics");

      render(<NewsletterForm variant="hero" />);

      const input = screen.getByPlaceholderText("Enter your email");
      await userEvent.type(input, "test@example.com");
      await userEvent.click(screen.getByRole("button", { name: /subscribe/i }));

      await waitFor(() => {
        expect(trackNewsletterSignup).toHaveBeenCalledWith("hero");
      });
    });
  });

  describe("Network Error Handling", () => {
    it("handles network errors", async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error("Network error"),
      );

      render(<NewsletterForm />);

      const input = screen.getByPlaceholderText("Enter your email");
      await userEvent.type(input, "test@example.com");
      await userEvent.click(screen.getByRole("button", { name: /subscribe/i }));

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });
  });
});
