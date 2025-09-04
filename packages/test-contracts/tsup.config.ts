import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: false, // Disable DTS generation to avoid project reference issues
  clean: true,
  sourcemap: true,
  external: ['axios'],
})