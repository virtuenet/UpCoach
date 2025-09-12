import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/components/index.ts',
    'src/hooks/index.ts',
    'src/utils/index.ts',
    'src/services/index.ts',
  ],
  format: ['cjs', 'esm'],
  dts: true, // Re-enable TypeScript declarations for proper imports
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom'],
  treeshake: true,
});
