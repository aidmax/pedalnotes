# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Privacy-focused static React web application for generating structured workout reflection reports with cycling and training metrics. Deployed as static files to AWS S3 with no backend server - all data persists in browser localStorage.

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
├── pages/home.tsx       # Main workout form (primary component)
├── components/ui/       # shadcn/ui components
├── lib/localStorage.ts  # LocalStorageWorkouts data class
└── test/                # Vitest tests
shared/
└── schema-static.ts     # Zod validation schema (active schema)
scripts/                 # AWS S3 deployment automation
```

### Key Files
- `client/src/pages/home.tsx` - Main form component with markdown generation
- `shared/schema-static.ts` - Zod schema defining workout data structure
- `client/src/lib/localStorage.ts` - Singleton class for localStorage CRUD operations

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
