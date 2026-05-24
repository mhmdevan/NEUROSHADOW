# NEUROSHADOW

**AI Cognitive Collapse Prediction Dashboard**

NEUROSHADOW is a competition-ready educational research dashboard that simulates real-time cognitive monitoring and predicts possible performance decline before a critical drop happens. It includes a premium animated frontend, a lightweight CSS/SVG neural visualization layer, real Next.js backend API routes, Prisma data models, report generation, feedback validation, documentation, and a clear path toward real AI + signal-processing integration.

> NEUROSHADOW is an educational and research demonstration. It uses simulated data and does not provide medical diagnosis, treatment, or health recommendations.

## Problem Statement

High-pressure work can involve attention drift, fatigue, stress, and task overload. Real systems that monitor these signals must be explainable, privacy-aware, and careful not to make unsupported medical claims. NEUROSHADOW demonstrates what a responsible monitoring dashboard could look like before real sensors or clinical validation are introduced.

## Solution

The app simulates cognitive indicators, displays them in a live AI-style dashboard, creates explainable alerts, logs AI engine activity, generates a downloadable report, collects feedback, and documents the architecture needed to evolve into a real research platform.

## Features

- Responsive dark AI dashboard with sidebar navigation and top status bar.
- Premium glassmorphism interface with vivid cyan, violet, magenta, yellow, red, and emerald status colors.
- Lightweight CSS/SVG neural signal field designed to preserve the premium visual effect without a heavy rendering dependency.
- Framer Motion interactions, animated alerts, metric updates, toasts, and quick actions.
- Live simulated metrics: focus, cognitive load, fatigue, stress, stability, collapse risk, and signal quality.
- Smooth frontend simulation loop updating every 2-3 seconds.
- Reusable React components for metric cards, alerts, timeline, brain map, report modal, user guide, and feedback.
- Backend API routes for health, metrics, alerts, logs, report generation, and feedback.
- Prisma ORM data models for sessions, snapshots, alerts, reports, feedback, and audit logs.
- SQLite emergency demo fallback so the project can run locally without PostgreSQL.
- PostgreSQL-ready architecture for production deployment.
- Input validation and sanitization for feedback and generated report content.
- User guide, about section, roadmap, security notes, and presentation script.
- Documentation set: README, PRESENTATION, ARCHITECTURE, TEST_PLAN, SCIENTIFIC_SOURCES, and SECURITY.

## Architecture

```text
Next.js App Router
  src/app/page.tsx                  Dashboard orchestration
  src/components/*                  Reusable UI components
  src/app/api/*/route.ts            Backend API routes
  src/lib/*                         Mock data, Prisma, validation, reporting, security
  prisma/schema.prisma              Data model
```

The dashboard calls API routes from the browser. API routes generate simulated data and try to persist selected events through Prisma. If Prisma cannot connect, the app keeps running in mock mode and clearly shows:

```text
Demo mode active: using simulated cognitive data.
```

## Tech Stack

- Next.js with App Router
- TypeScript
- React components
- pnpm
- Prisma ORM
- SQLite local emergency demo fallback
- PostgreSQL-ready production architecture
- CSS/SVG dashboard visualization
- Lightweight animated neural field
- Framer Motion
- Zod
- Vitest and Testing Library
- No paid external API dependency

## Installation

```bash
cd NEUROSHADOW
pnpm install
cp .env.example .env
pnpm prisma:generate
pnpm prisma:migrate
pnpm dev
```

Open the dashboard:

```text
http://localhost:3030
```

## Environment Variables

Local emergency demo:

```env
DATABASE_URL="file:./dev.db"
NEXT_PUBLIC_APP_MODE="research-demo"
```

Production PostgreSQL example:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/neuroshadow?schema=public"
```

The default Prisma schema uses SQLite so judges can run the project quickly. For PostgreSQL production, change this line in `prisma/schema.prisma`:

```prisma
provider = "sqlite"
```

to:

```prisma
provider = "postgresql"
```

Then run:

```bash
pnpm prisma:generate
pnpm prisma:migrate
```

## Prisma Commands

```bash
pnpm prisma:generate
pnpm prisma:migrate
pnpm prisma:studio
pnpm db:seed
pnpm lint
pnpm test
pnpm build
```

## API Routes

### `GET /api/health`

Returns service status, timestamp, and database mode:

```json
{
  "status": "ok",
  "service": "NEUROSHADOW API",
  "timestamp": "2026-05-24T00:00:00.000Z",
  "database": "connected"
}
```

### `GET /api/metrics`

Returns simulated current cognitive metrics.

### `GET /api/alerts`

Returns active AI alerts.

### `GET /api/logs`

Returns AI engine logs.

### `POST /api/report`

Generates a report with summary, risk interpretation, key indicators, non-medical action, and disclaimer.

### `POST /api/feedback`

Accepts validated feedback:

```json
{
  "name": "Judge",
  "email": "judge@example.com",
  "message": "Strong project structure and presentation.",
  "rating": 5
}
```

## Demo Mode

NEUROSHADOW is intentionally demo-safe. If the database is missing, disconnected, or misconfigured, the app still loads and switches to mock mode. This makes it reliable for live judging, classroom demos, and offline rehearsals.

## Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) explains frontend, backend, data, Prisma, fallback, and future AI layers.
- [TEST_PLAN.md](./TEST_PLAN.md) gives manual and automated QA coverage.
- [SCIENTIFIC_SOURCES.md](./SCIENTIFIC_SOURCES.md) summarizes the research concepts behind the simulation.
- [SECURITY.md](./SECURITY.md) documents validation, safe rendering, demo token handling, and future security work.

## Security Notes

- Feedback is validated on the backend before acceptance.
- Text fields are sanitized to avoid dangerous HTML injection.
- React renders report and feedback text as text, not unsafe HTML.
- API responses disable caching and include `X-Content-Type-Options: nosniff`.
- A production rate limiter should be added at the feedback endpoint before public deployment.
- No paid external API keys are required.
- Real cognitive or biometric data would require explicit consent, retention limits, access controls, and privacy review.

## Future Roadmap

- Replace simulated metrics with opt-in real behavioral streams.
- Add signal processing for smoothing, artifact rejection, and confidence scoring.
- Train transparent AI models on consented research datasets.
- Add model cards, evaluation reports, and bias/privacy review.
- Add authenticated teams, study management, and report export history.
- Integrate PostgreSQL migrations in production CI/CD.

## How To Present To Judges

1. Open the dashboard and point out that the data is simulated and non-medical.
2. Show the live metric cards, brain map, prediction gauge, timeline, alerts, and logs.
3. Run the baseline scan.
4. Generate and download an AI report.
5. Submit feedback to demonstrate backend validation.
6. Open `/api/health`, `/api/metrics`, `/api/alerts`, and `/api/logs` to show real API routes.
7. Explain the Prisma schema and how SQLite demo mode can become PostgreSQL production mode.

## Disclaimer

NEUROSHADOW is an educational and research demonstration. It uses simulated data and does not provide medical diagnosis, treatment, or health recommendations.
