/**
 * Test utility functions
 */

import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Custom render with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialRoute?: string;
  authState?: any;
  theme?: 'light' | 'dark';
}

export function renderWithProviders(
  ui: ReactElement,
  {
    initialRoute = '/',
    authState = null,
    theme = 'light',
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
      <MemoryRouter initialEntries={[initialRoute]}>
        <div data-theme={theme}>{children}</div>
      </MemoryRouter>
    );
  };

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}

// Wait for async operations
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock API response
export const mockApiResponse = (data: any, delay = 0) => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        ok: true,
        json: async () => data,
        text: async () => JSON.stringify(data),
        status: 200,
        headers: new Headers(),
      });
    }, delay);
  });
};

// Mock API error
export const mockApiError = (message = 'API Error', status = 500, delay = 0) => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        ok: false,
        json: async () => ({ error: message }),
        text: async () => message,
        status,
        headers: new Headers(),
      });
    }, delay);
  });
};

// Test IDs helper
export const testIds = {
  // Auth
  loginForm: 'login-form',
  loginEmail: 'login-email',
  loginPassword: 'login-password',
  loginSubmit: 'login-submit',

  // Navigation
  navbar: 'navbar',
  sidebar: 'sidebar',
  menuToggle: 'menu-toggle',

  // Dashboard
  dashboardStats: 'dashboard-stats',
  revenueChart: 'revenue-chart',
  userChart: 'user-chart',

  // Content
  contentList: 'content-list',
  contentItem: 'content-item',
  contentEditor: 'content-editor',

  // Modals
  modal: 'modal',
  modalClose: 'modal-close',
  modalConfirm: 'modal-confirm',
  modalCancel: 'modal-cancel',
};

// Assert element visible
export const assertVisible = (element: HTMLElement) => {
  expect(element).toBeInTheDocument();
  expect(element).toBeVisible();
};

// Assert element not visible
export const assertNotVisible = (element: HTMLElement | null) => {
  if (element) {
    expect(element).not.toBeVisible();
  } else {
    expect(element).toBeNull();
  }
};

// Get by test id helper
export const getByTestId = (container: HTMLElement, testId: string) => {
  return container.querySelector(`[data-testid="${testId}"]`);
};

// Fire event helpers
export { fireEvent, screen, waitFor as waitForElement } from '@testing-library/react';
export { userEvent } from '@testing-library/user-event';

// Performance testing helper
export const measurePerformance = async (fn: () => Promise<void>) => {
  const start = performance.now();
  await fn();
  const end = performance.now();
  return end - start;
};

// Accessibility testing helper
export const checkAccessibility = (container: HTMLElement) => {
  // Check for ARIA labels
  const buttons = container.querySelectorAll('button');
  buttons.forEach(button => {
    expect(button.getAttribute('aria-label') || button.textContent).toBeTruthy();
  });

  // Check for alt text on images
  const images = container.querySelectorAll('img');
  images.forEach(img => {
    expect(img.getAttribute('alt')).toBeTruthy();
  });

  // Check for form labels
  const inputs = container.querySelectorAll('input, textarea, select');
  inputs.forEach(input => {
    const id = input.getAttribute('id');
    if (id) {
      const label = container.querySelector(`label[for="${id}"]`);
      expect(label).toBeInTheDocument();
    }
  });
};

// Snapshot testing helper
export const createSnapshot = (component: ReactElement, name: string) => {
  const { container } = render(component);
  expect(container.firstChild).toMatchSnapshot(name);
};

// Form testing helpers
export const fillForm = async (container: HTMLElement, values: Record<string, string>) => {
  for (const [name, value] of Object.entries(values)) {
    const input = container.querySelector(`[name="${name}"]`) as HTMLInputElement;
    if (input) {
      input.value = value;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }
};

export const submitForm = (container: HTMLElement, formTestId?: string) => {
  const form = formTestId
    ? container.querySelector(`[data-testid="${formTestId}"]`)
    : container.querySelector('form');

  if (form) {
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  }
};
