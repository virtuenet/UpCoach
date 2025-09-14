import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

import { ReactNode } from 'react';

// Polyfill TextEncoder/TextDecoder for Jest
global.TextEncoder = TextEncoder as any;
global.TextDecoder = TextDecoder as any;

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      pathname: '/',
      query: {},
      asPath: '/',
    };
  },
  usePathname() {
    return '/';
  },
  useSearchParams() {
    return new URLSearchParams();
  },
}));

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: { src: string; alt?: string; width?: number; height?: number }) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt || ''} />;
  },
}));

// Mock Clerk
jest.mock('@clerk/nextjs', () => ({
  useUser: () => ({ user: null }),
  useAuth: () => ({ isSignedIn: false }),
  SignInButton: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SignUpButton: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SignedIn: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SignedOut: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  UserButton: () => <div>User Button</div>,
  ClerkProvider: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  disconnect: jest.fn(),
  observe: jest.fn(),
  unobserve: jest.fn(),
  takeRecords: jest.fn(),
  root: null,
  rootMargin: '',
  thresholds: [],
}));

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect(): void {}
  observe(): void {}
  unobserve(): void {}
}; // Removed 'as any'

// Mock window.gtag
(global as any).gtag = jest.fn();

// Suppress console errors in tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].includes('Warning: ReactDOM.render')) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
