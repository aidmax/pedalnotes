# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PedalNotes — a privacy-focused static React web application for cyclists to log structured workout reflections and generate markdown training reports. Deployed as static files to AWS S3 with no backend server - all data persists in browser localStorage.

## Commands

### Development
```bash
npm run dev              # Start Vite dev server (localhost:5173)
npm run check            # TypeScript type checking
```

### Build & Deploy
```bash
npm run build            # Production build to dist/
npm run preview          # Preview production build locally
npm run deploy           # Build + upload to S3 with cache headers
npm run deploy-with-cloudfront  # Deploy + invalidate CloudFront cache
```

### Testing
```bash
npm test                 # Vitest watch mode
npm run test:run         # Single run (CI mode)
npm run test:coverage    # Generate coverage reports
npm run test:ui          # Interactive Vitest dashboard
npx vitest client/src/test/schema.test.ts           # Run specific file
npx vitest -t "should validate a complete workout"  # Run test by name
```

## Architecture

### Tech Stack
- React 18 + TypeScript + Vite
- Tailwind CSS + shadcn/ui (Radix primitives)
- React Hook Form + Zod validation
- Wouter for client-side routing
- Vitest + React Testing Library

### Directory Structure
```
client/src/
├── pages/home.tsx                    # Main workout form (primary component)
├── components/ui/                    # shadcn/ui components
├── hooks/
│   ├── use-form-persistence.ts       # Auto-save/restore form draft to localStorage
│   ├── use-theme.ts                  # Dark/light theme toggle
│   └── use-toast.ts                  # Toast notification system
└── test/                             # Vitest tests
shared/
└── schema-static.ts                  # Zod validation schema (active schema)
client/public/
├── pwa-192x192.png                   # PWA icon 192px
├── pwa-512x512.png                   # PWA icon 512px (also used as maskable)
└── apple-touch-icon.png              # Apple touch icon 180px
scripts/                              # AWS S3 deployment automation
```

### Key Files
- `client/src/pages/home.tsx` - Main form component with markdown generation
- `shared/schema-static.ts` - Zod schema defining workout data structure
- `client/src/hooks/use-form-persistence.ts` - Debounced form draft auto-save/restore
- `client/src/hooks/use-section-state.ts` - Persisted open/closed state for collapsible form sections
- `client/src/components/ui/collapsible-section.tsx` - Reusable `<details>`-based collapsible section component

### PWA Setup
- `vite-plugin-pwa` generates the service worker (Workbox) and injects manifest link automatically
- Manifest config is in `vite.config.ts` → VitePWA plugin options
- `scope` and `start_url` are derived from Vite's `base` setting (respects `VITE_BASE_PATH`)
- Service worker uses `registerType: 'autoUpdate'` — no manual registration code needed
- Draft localStorage key: `"pedalnotes-draft"` (single draft, last-write-wins)

### Form Persistence
- `useFormPersistence(form, { key, debounceMs })` auto-saves on every change (500ms debounce)
- On mount, if a draft exists it calls `form.reset(parsed)` and sets `wasRestored = true`
- Corrupt/unparseable drafts are silently discarded (`console.error` logged)
- `QuotaExceededError` on write is caught; form still works without persistence
- `clearDraft()` removes the localStorage key and resets `wasRestored`

### Section State Persistence
- `useSectionState({ key, defaults })` manages open/closed state for each form section
- localStorage key: `"pedalnotes-sections"`; stored as `{ version: 1, data: Record<SectionId, boolean> }`
- On mount: reads stored state, merges defaults for any missing keys, drops unknown keys
- Version mismatch or malformed data falls back to defaults and overwrites stored value
- Default expansion: Core Metrics=open, Reflection=open, Rest Day=open, Activity=open; Fueling/Performance/Recovery=collapsed
- `toggleSection(id)`, `setSection(id, open)`, `resetSections()` — writes persist immediately (no debounce)
- `QuotaExceededError` on write is caught; section states still work in memory
- Section states are independent from form draft; clearing the form does not reset section states
- Section IDs: `core-metrics`, `fueling`, `performance-metrics`, `recovery-metrics`, `reflection`, `rest-day`, `activity`
- Visible sections depend on `entryType` — `expandAllOrCollapseAll` only affects currently visible sections

### Entry Types
Three entry types supported via `entryType` field (default: `cycling`):
- **`cycling`** — full cycling workout form (Core Metrics, Fueling, Performance, Recovery, Reflection)
- **`rest`** — rest day logging (Recovery Metrics + Rest Day sections only); auto-expands Recovery Metrics on switch
- **`other`** — non-cycling activities like MFR/yoga/strength (Activity section only)

`goal`, `rpe`, `feel` are only required when `entryType === "cycling"` (enforced by `superRefine`). Switching entry types does not reset other fields — hidden fields retain their values but don't appear in markdown output.

Old drafts (pre-entryType) are migrated to `cycling` on restore in `use-form-persistence.ts`.

### Data Flow
1. User fills form → React Hook Form manages state
2. Zod schema validates input
3. LocalStorageWorkouts persists to browser storage
4. Markdown generated with DD.MM.YYYY date format and abbreviations (G, R, F, NP, TSS, rMSSD, etc.)

## Conventions

### Path Aliases
- `@/` → `client/src/`
- `@shared/` → `shared/`

### Workout Schema Fields
Always required: `entryType` (`cycling`/`rest`/`other`), `workoutDate`
Cycling-required (via `superRefine`): `goal`, `rpe` (1-10), `feel` (W/P/N/G/S)
Cycling-optional: `choIntakePre`, `choIntake`, `choIntakePost`, `normalizedPower`, `tss`, `avgHeartRate`, `hrv`, `rMSSD`, `rhr`, `trainerRoadRpe`, `trainerRoadLgt`, `whatWentWell`, `whatCouldBeImproved`, `description`
Rest-only: `weight` (positive number, kg), `restNotes` (free-form, rendered as bullets). Rest entries also reuse `hrv`/`rMSSD`/`rhr`/`trainerRoadLgt`.
Other-only: `activityGoal` (e.g. "MFR", "Yoga"), `activityNotes` (free-form, rendered as bullets).

### Markdown Abbreviations
G=Goal (cycling) or Activity (other), R=RPE, F=Feel, Ci-Pre=Carbohydrate Intake Pre-Workout, Ci=Carbohydrate Intake During Ride, Ci-Post=Carbohydrate Intake Post-Workout, NP=Normalized Power, TSS=Training Stress Score, Hr=Heart Rate, HRV=Heart Rate Variability, rMSSD=HRV Recovery Metric, RHR=Resting Heart Rate, TR-RPE=TrainerRoad RPE, TR-LGT=TrainerRoad Light, W=Weight (rest)

### Markdown Output Per Entry Type
- **cycling**: `G` / `R` / `F` + optional metrics + WWW/WCBI/Planned blocks (current format, unchanged)
- **rest**: `Rest Day` marker + present-only recovery metrics and `W` + bulleted `restNotes`
- **other**: optional `G: <activity>` + bulleted `activityNotes`; no metrics

## Environment Variables (Deployment Only)
```
AWS_REGION, AWS_BUCKET, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
AWS_CLOUDFRONT_DISTRIBUTION_ID (optional)
```
