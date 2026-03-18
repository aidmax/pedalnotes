<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/logo-dark.png" />
    <source media="(prefers-color-scheme: light)" srcset="assets/logo.png" />
    <img src="assets/logo.png" alt="PedalNotes" width="400" />
  </picture>
</p>

<p align="center">
  A free, privacy-first training journal for cyclists.
</p>

---

Log structured workout reflections, track subjective feedback, and generate portable markdown reports.

**Your body is the most important sensor.**

<p align="center">
  <a href="https://youtu.be/rsJLUJeag1c">
    <img src="https://img.youtube.com/vi/rsJLUJeag1c/maxresdefault.jpg" alt="PedalNotes Demo" width="600" />
  </a>
  <br />
  <em>Watch the demo</em>
</p>

## Why PedalNotes?

Modern cycling drowns athletes in data — power meters, heart rate monitors, HRV sensors, training platforms. The numbers pile up, but the signal gets lost. Research consistently shows that subjective self-assessment (RPE, perceived fatigue, mood) is one of the most valuable and underused tools in endurance training:

- **Subjective feedback catches what devices miss.** A high RPE with low power output may signal illness or accumulated fatigue — before any metric flags it. ([Tailwind Coaching](https://tailwind-coaching.com/2017/11/09/importance-of-rpe-cycling-training/))
- **Session-RPE is validated and reliable** for training load monitoring across endurance sports. ([Frontiers in Neuroscience](https://www.frontiersin.org/journals/neuroscience/articles/10.3389/fnins.2017.00612/full))
- **Data overload leads to analysis paralysis.** Athletes need to know what to look at and what to ignore. ([High North Performance](https://www.highnorth.co.uk/articles/self-coaching-cycling-skills))
- **Metrics shift your mindset.** As former WorldTour pro Michael Barry writes, measurable data can turn every ride into a race — blurring awareness of everything else. ([Canadian Cycling Magazine](https://cyclingmagazine.ca/sections/training-guide/michael-barry-on-why-cyclists-must-look-beyond-the-metrics/))

PedalNotes gives you a structured place to write down what matters most: how you felt, what went well, and what you'd change next time.

## Features

- Structured workout form with cycling-specific metrics (RPE, NP, TSS, HRV, RHR)
- TrainerRoad-specific fields (RPE, Fatigue Detection System)
- Fueling tracking (pre / during / post workout)
- Real-time markdown preview
- Copy to clipboard or download reports
- Works offline, runs entirely in the browser
- Zero cost to host on AWS Free Tier

## How It Works

1. Do a workout
2. Open PedalNotes and fill in only the fields that matter to you right now — basics like duration and distance are already tracked by Strava or your bike computer. Empty fields are simply omitted from the output
3. Copy or download the markdown report
4. Store it in your second brain (Obsidian, Notion, plain files)

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
- Maintained target power
- Good fueling strategy

WCBI
- Start earlier to avoid heat
```

**Abbreviations:** G=Goal, R=RPE, F=Feel, Ci=Carb Intake (Pre/During/Post), NP=Normalized Power, TSS=Training Stress Score, Hr=Heart Rate, HRV=Heart Rate Variability, RHR=Resting Heart Rate, TR-RPE=TrainerRoad RPE, TR-LGT=TrainerRoad Light, WWW=What Went Well, WCBI=What Can Be Improved

## Philosophy

- **No backend** — zero servers, zero databases, zero ongoing costs
- **Your data stays yours** — everything lives in your browser's localStorage
- **Portable format** — markdown works everywhere, forever
- **Self-hostable** — deploy to any static hosting (S3, Netlify, your own server)

## Quick Start

```bash
npm install
npm run dev        # localhost:5173
```

## Deployment

Build static files and host anywhere. AWS S3 Free Tier is more than enough for this app — it costs nothing to run.

```bash
npm run build      # Output to dist/
npm run deploy     # Upload to S3 (requires AWS credentials)
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed AWS S3 setup instructions.

## Tech Stack

- React 18 + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- React Hook Form + Zod validation
- Zero runtime dependencies on external services

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
