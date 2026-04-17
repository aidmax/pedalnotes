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
- Default expansion: Core Metrics=open, Reflection=open; Fueling/Performance/Recovery=collapsed
- `toggleSection(id)`, `setSection(id, open)`, `resetSections()` — writes persist immediately (no debounce)
- `QuotaExceededError` on write is caught; section states still work in memory
- Section states are independent from form draft; clearing the form does not reset section states

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
Required: `workoutDate`, `goal`, `rpe` (1-10), `feel` (W/P/N/G/S)
Optional: `choIntakePre`, `choIntake`, `choIntakePost`, `normalizedPower`, `tss`, `avgHeartRate`, `hrv`, `rMSSD`, `rhr`, `trainerRoadRpe`, `trainerRoadLgt`, `whatWentWell`, `whatCouldBeImproved`, `description`

### Markdown Abbreviations
G=Goal, R=RPE, F=Feel, Ci-Pre=Carbohydrate Intake Pre-Workout, Ci=Carbohydrate Intake During Ride, Ci-Post=Carbohydrate Intake Post-Workout, NP=Normalized Power, TSS=Training Stress Score, Hr=Heart Rate, HRV=Heart Rate Variability, RHR=Resting Heart Rate, TR-RPE=TrainerRoad RPE, TR-LGT=TrainerRoad Light

## Environment Variables (Deployment Only)
```
AWS_REGION, AWS_BUCKET, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
AWS_CLOUDFRONT_DISTRIBUTION_ID (optional)
```
