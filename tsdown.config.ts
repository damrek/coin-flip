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
  // No sourcemap in the build that CI deploys: it was 3.2 MB, five times the
  // bundle itself, and only useful while debugging. `npm run dev` turns it on
  // again with an explicit `--sourcemap` flag.

  // three is a runtime dependency, but an IIFE on a static host has no module
  // loader: it must be inside the bundle, not left as an external global.
  noExternal: ['three', /^three\//],
});
