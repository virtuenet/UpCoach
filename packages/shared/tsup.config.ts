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
  dts: false, // Disabled DTS generation due to tsconfig issues
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom'],
  treeshake: true,
});
