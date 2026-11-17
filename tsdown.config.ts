import { defineConfig } from 'tsdown';

// Single-file IIFE bundle for static hosting: index.html will load dist/
// directly with a <script> tag, so there is no module loader at runtime.
// `globalName` exposes the bundle as `window.coinflip` (required for IIFE).
export default defineConfig({
  entry: ['src/main.ts'],
  outDir: 'dist',
  format: ['iife'],
  globalName: 'coinflip',
  platform: 'browser',
  minify: true,
  sourcemap: true,
  // three is a runtime dependency, but an IIFE on a static host has no module
  // loader: it must be inside the bundle, not left as an external global.
  noExternal: ['three', /^three\//],
});
