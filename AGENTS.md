# AGENTS.md

Guidance for autonomous coding agents working in this repository.

## 1) Project Overview

- App type: Privacy-focused static React web app (no backend runtime).
- Purpose: Generate structured workout reflection markdown reports.
- Data storage: Browser `localStorage` only.
- Build output: Static files in `dist/`.
- Main stack: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Zod, React Hook Form, Vitest.

## 2) Working Rules for Agents

- Preserve the static architecture; do not introduce server dependencies for core features.
- Favor minimal, targeted changes over broad refactors.
- Follow existing file-local style (some files use semicolons, some do not).
- Use TypeScript strict mode-compatible code.
- Keep path aliases consistent: `@/*` and `@shared/*`.
- Do not commit secrets or environment values.

## 3) Build, Check, Test, Deploy Commands

### Development

- Install deps: `npm install`
- Start dev server: `npm run dev` (Vite, default localhost:5173)
- Type check: `npm run check`

### Build and preview

- Production build: `npm run build`
- Preview build: `npm run preview`

### Tests

- Watch mode: `npm test`
- CI-style single run: `npm run test:run`
- Watch mode (explicit): `npm run test:watch`
- Coverage: `npm run test:coverage`
- UI runner: `npm run test:ui`

### Run a single test (important)

- Single file: `npx vitest client/src/test/schema.test.ts`
- Single file with run mode: `npx vitest run client/src/test/schema.test.ts`
- By test name pattern: `npx vitest -t "should validate a complete valid workout"`
- By name in run mode: `npx vitest run -t "validate feel enum values"`
- Combine file + test name: `npx vitest run client/src/test/schema.test.ts -t "RPE range"`

### Deployment scripts

- Deploy to S3: `npm run deploy`
- Deploy + CloudFront invalidation: `npm run deploy-with-cloudfront`
- Upload only: `npm run upload-s3`
- Upload no cache: `npm run upload-s3-no-cache`
- Invalidate CloudFront: `npm run invalidate-cloudfront`
- Setup bucket: `npm run setup-s3-bucket`
- Configure website mode: `npm run configure-s3-website`

## 4) Lint/Formatting Reality

- There is no configured ESLint script in `package.json`.
- There is no Prettier config in this repository.
- Primary automated quality gates are:
  - `npm run check` (TypeScript)
  - `npm run test:run` / `npm run test:coverage` (Vitest)
- If asked to "lint", run type checks and tests unless a lint setup is added later.

## 5) CI Expectations

GitHub Actions (`.github/workflows/test.yml`) currently runs:

- `npm ci`
- `npm run check`
- `npm run test:run`
- `npm run test:coverage`

Agents should run at least `npm run check` and `npm run test:run` before finalizing non-trivial changes.

## 6) Codebase Map

- Main page/form: `client/src/pages/home.tsx`
- App shell/routing: `client/src/App.tsx`
- Shared validation schema: `shared/schema-static.ts` (active)
- Local persistence helper: `client/src/lib/localStorage.ts`
- UI primitives: `client/src/components/ui/*`
- Tests: `client/src/test/*`

## 7) Import and Module Conventions

- Prefer alias imports for app code:
  - `@/` for `client/src/*`
  - `@shared/` for `shared/*`
- Group imports in practical order:
  1) external packages
  2) shared/app aliases
  3) same-folder relatives (if any)
- Use `type` imports where appropriate (already used in several files).
- Avoid deep relative paths when an alias keeps imports clearer.

## 8) TypeScript and Types

- `strict` mode is enabled; avoid `any`.
- Model workout payloads from Zod schema types (`InsertWorkout`, `Workout`).
- Keep schema and UI in sync when adding/removing fields.
- Prefer explicit function return types for exported utilities.
- Validate shape changes through schema tests.

## 9) Naming Conventions

- React components: `PascalCase` (`Home`, `NotFound`, `Button`).
- Utility functions/variables: `camelCase` (`formatBulletPoints`, `handleDownload`).
- Constants arrays/maps: `camelCase` with descriptive nouns (`rpeOptions`, `lgtOptions`).
- Schema/type exports: descriptive `PascalCase` types (`InsertWorkout`).
- Test files: `*.test.ts` / `*.test.tsx` near `client/src/test`.

## 10) React and UI Practices

- Functional components + hooks only.
- Forms use React Hook Form + Zod resolver.
- Keep controlled form defaults aligned with schema optionality.
- Reuse existing shadcn/ui components before adding new primitives.
- Keep UI accessible: labels, semantic controls, and keyboard-safe interactions.

## 11) Formatting and Style

- Match surrounding style in each file (quotes/semicolons differ across files).
- Prefer small, readable functions over dense inline logic.
- Avoid unnecessary comments; add comments only for non-obvious intent.
- Keep markdown output formatting stable (date and abbreviations are user-facing contract).
- Do not introduce unrelated formatting churn in touched files.

## 12) Error Handling and Logging

- Use `try/catch` around browser APIs that can fail (`localStorage`, clipboard, JSON parsing).
- Surface user-facing failures with UI feedback (`toast`) where relevant.
- Log useful context with `console.error` for local debugging.
- Throw when callers need to react; return fallbacks only when safe (`[]`, `null`, `false`).
- Do not swallow errors silently.

## 13) Data and Domain Rules

- Required workout fields: `workoutDate`, `goal`, `rpe`, `feel`.
- Preserve markdown abbreviations contract (`G`, `R`, `F`, `NP`, `TSS`, `TR-RPE`, etc.).
- Keep date output in `DD.MM.YYYY` format.
- Do not break localStorage compatibility without migration handling.

## 14) Testing Guidance

- Add/adjust tests for behavior changes in schema, formatting, or user flows.
- Prefer focused assertions over broad snapshots.
- For schema changes, update `client/src/test/schema.test.ts`.
- For UI behavior, use Testing Library patterns already present in `client/src/test/components/*`.

## 15) Cursor/Copilot Rule Files

- No `.cursor/rules/` directory found.
- No `.cursorrules` file found.
- No `.github/copilot-instructions.md` file found.
- If any of these files are added later, treat them as higher-priority agent instructions and merge them into this guide.

## 16) Safe Change Workflow

- Read relevant files first; infer existing patterns before editing.
- Make the smallest change that fully solves the task.
- Run `npm run check` and targeted tests (or full `npm run test:run` when needed).
- Summarize changed files and verification steps in final output.
