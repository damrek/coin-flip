import js from '@eslint/js';

// Plain flat config (option C): no TypeScript parser plugin. The newest
// installable typescript-eslint predates TypeScript 7 support, so for this
// repo type safety of src/*.ts comes from `tsc --noEmit` and formatting from
// prettier (singleQuote, trailingComma all, printWidth 100 — see
// .prettierrc.json; single quotes match the existing app.js/src style, width
// 100 fits the current ~90-column lines, trailing commas keep diffs clean).
// ESLint therefore covers the JavaScript files with the core recommended set
// (@eslint/js is an explicit dep: eslint 10 no longer re-exports it, and
// relying on transitive hoisting breaks the install).
// - legacy app.js is ignored: kept in repo as reference, no longer loaded.
// - dist/ is build output.
// - src/*.ts and tsdown.config.ts are type-checked by tsc, not parsed here.
export default [
  js.configs.recommended,
  { ignores: ['dist/**', 'app.js', 'src/**/*.ts', 'tsdown.config.ts'] },
];
