import { jsx as _jsx } from "react/jsx-runtime";
import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';
// Polyfill TextEncoder/TextDecoder for Jest
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
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
    default: (props) => {
        // eslint-disable-next-line @next/next/no-img-element
        return _jsx("img", { ...props, alt: props.alt || '' });
    },
}));
// Mock Clerk
jest.mock('@clerk/nextjs', () => ({
    useUser: () => ({ user: null }),
    useAuth: () => ({ isSignedIn: false }),
    SignInButton: ({ children }) => _jsx("div", { children: children }),
    SignUpButton: ({ children }) => _jsx("div", { children: children }),
    SignedIn: ({ children }) => _jsx("div", { children: children }),
    SignedOut: ({ children }) => _jsx("div", { children: children }),
    UserButton: () => _jsx("div", { children: "User Button" }),
    ClerkProvider: ({ children }) => _jsx("div", { children: children }),
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
    constructor() { }
    disconnect() { }
    observe() { }
    unobserve() { }
}; // Removed 'as any'
// Mock window.gtag
global.gtag = jest.fn();
// Suppress console errors in tests
const originalError = console.error;
beforeAll(() => {
    console.error = (...args) => {
        if (typeof args[0] === 'string' && args[0].includes('Warning: ReactDOM.render')) {
            return;
        }
        originalError.call(console, ...args);
    };
});
afterAll(() => {
    console.error = originalError;
});
//# sourceMappingURL=setup.js.map