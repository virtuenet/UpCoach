declare module 'vitest' {
  export const describe: typeof import('vitest').describe;
  export const it: typeof import('vitest').it;
  export const expect: typeof import('vitest').expect;
}