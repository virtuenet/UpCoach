declare module 'jest-axe' {
  import { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers';

  interface AxeResults {
    violations: Array<{
      id: string;
      impact: string;
      description: string;
      help: string;
      helpUrl: string;
      tags: string[];
      nodes: Array<{
        target: string[];
        html: string;
        impact: string;
        any: any[];
        all: any[];
        none: any[];
      }>;
    }>;
  }

  interface AxeConfig {
    rules?: Record<string, { enabled: boolean }>;
    tags?: string[];
    include?: string[][];
    exclude?: string[][];
  }

  export function axe(html: Element | string, config?: AxeConfig): Promise<AxeResults>;
  export function toHaveNoViolations(received: AxeResults): jest.CustomMatcherResult;
  export function configureAxe(config: AxeConfig): (html: Element | string) => Promise<AxeResults>;
}

declare namespace jest {
  interface Matchers<R> {
    toHaveNoViolations(): R;
  }
}