# Workout Reflection

A workout logging tool built on the principle of digital sovereignty. Generate structured training reports in markdown format - readable by both humans and machines (AI).

## Philosophy

**This application embodies these principles:**

- **No backend** - Zero servers, zero databases, zero ongoing costs
- **Your data stays yours** - Everything lives in your browser's localStorage
- **Portable format** - Markdown output works everywhere, forever
- **Self-hostable** - Deploy to any static hosting (S3, Netlify, your own server)

## Features

- Structured workout form with cycling-specific metrics
- Real-time markdown preview
- TrainerRoad specific metrics (RPE, Fatigue Detection System)
- Fueling tracking (pre/during/post workout)
- HRV and recovery metrics
- Copy to clipboard or download reports
- Works offline


## Flow

1. Do a workout
2. Use the tool to log it
3. Copy/save markdown file to your local disk
4. Use it for further analysis or in second brain tools like Obsidian, Notion, etc.

## Quick Start

```bash
npm install
npm run dev        # localhost:5173
```

## Data Format

Your workouts are stored as markdown with standardized abbreviations:

```markdown
---
## 27.01.2026

G: Endurance base building
R: 6
F: G
Ci-Pre: oatmeal, banana
Ci: 2 gels, sports drink
Ci-Post: protein shake
NP: 185
TSS: 65
Hr: 142

WWW
• Maintained target power
• Good fueling strategy

WCBI
• Start earlier to avoid heat
```

**Abbreviations:** G=Goal, R=RPE, F=Feel, Ci=Carb Intake, NP=Normalized Power, TSS=Training Stress Score, Hr=Heart Rate, HRV=Heart Rate Variability, RHR=Resting Heart Rate, TR-RPE=TrainerRoad RPE, TR-LGT=TrainerRoad Light, WWW=What Went Well, WCBI=What Can Be Improved

## Tech Stack

- React 18 + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- React Hook Form + Zod validation
- Zero runtime dependencies on external services

## Deployment

Build static files and host anywhere:

```bash
npm run build      # Output to dist/
npm run deploy     # Upload to S3 (requires AWS credentials)
```

## Project Structure

```
client/src/
├── pages/home.tsx       # Main workout form
├── components/ui/       # shadcn/ui components
└── test/                # Vitest tests
shared/
└── schema-static.ts     # Zod validation schema
scripts/                 # Deployment automation
```

## License

MIT
