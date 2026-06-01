# NEUROSHADOW

**AI Cognitive Collapse Prediction Dashboard**

NEUROSHADOW is a competition-ready educational research dashboard that simulates real-time cognitive monitoring and predicts possible performance decline before a critical drop happens. It includes a premium animated frontend, a lightweight CSS/SVG neural visualization layer, real Next.js backend API routes, Prisma data models, first-party auth, aggregate browser mouse, camera-frame eye, and microphone voice analysis, report generation, feedback validation, documentation, and a clear path toward real AI + signal-processing integration.

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
- Full bilingual UI with English and Persian language switching, localized labels, localized report output, and RTL-aware layout styling.
- Real user authentication with registration, login, logout, HttpOnly session cookies, and password hashing.
- Protected dashboard route plus a dedicated user panel with user-scoped sessions, metric snapshots, reports, feedback counts, and recent reports.
- Live simulated metrics: focus, cognitive load, fatigue, stress, stability, collapse risk, and signal quality.
- Real browser mouse analysis that converts pointer movement, clicks, and wheel activity into aggregate behavioral indicators such as actions per minute, distance, velocity, idle time, jitter, direction changes, stability, and confidence.
- Real opt-in camera-frame eye analysis that processes a small eye-region frame locally and stores only aggregate indicators such as tracking quality, gaze stability, blink proxy, lighting quality, motion variance, focus consistency, and confidence.
- Real opt-in microphone voice analysis that uses the Web Audio API locally and stores only aggregate indicators such as volume level, voice stability, speech activity, silence ratio, clarity score, noise level, tone variability, and confidence.
- Real per-user baseline flow with a 1-5 self-check-in, latest available mouse/eye/voice aggregate capture, baseline quality score, stale/missing/low-quality states, and current-vs-baseline comparison.
- User-scoped session review generation that summarizes strongest change, best focus window, weakest window, signal quality, and one non-medical next action.
- Explainable action recommendation engine that suggests one small non-medical productivity action at a time, stores accept/dismiss/not-useful feedback, and keeps rules easy to inspect.
- Follow-up feedback loop that asks whether an accepted action helped, captures current focus and energy, and shows which actions are helping most often for that user.
- Weekly trends reflection that summarizes average focus, average stability, sessions completed, most common alert pattern, most useful action, and signal quality trend.
- Privacy controls for enabling/disabling mouse, eye, voice, and simulated cognitive streams from the dashboard.
- User data export, current-session deletion, and all-data deletion controls for signed-in users.
- Smooth frontend simulation loop updating every 2-3 seconds.
- Reusable React components for metric cards, alerts, timeline, brain map, report modal, user guide, and feedback.
- Backend API routes for health, metrics, alerts, logs, mouse analysis, eye analysis, voice analysis, baseline storage, session review, action recommendation, action follow-up, weekly trends, report generation, and feedback.
- Prisma ORM data models for sessions, snapshots, mouse signal snapshots, eye signal snapshots, voice signal snapshots, baseline profiles, session reviews, recommended actions, alerts, reports, feedback, and audit logs.
- SQLite emergency demo fallback so the project can run locally without PostgreSQL.
- PostgreSQL-ready architecture for production deployment.
- Input validation and sanitization for feedback and generated report content.
- User guide, about section, roadmap, security notes, and presentation script.
- Documentation set: README, PRESENTATION, ARCHITECTURE, TEST_PLAN, SCIENTIFIC_SOURCES, and SECURITY.

## Architecture

```text
Next.js App Router
  src/app/page.tsx                  Auth-aware entry redirect
  src/components/*                  Reusable UI components
  src/app/api/*/route.ts            Backend API routes
  src/app/login                     Login page
  src/app/register                  Registration page
  src/app/dashboard                 Protected dashboard
  src/app/panel                     Protected user panel
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
NEUROSHADOW_SECURE_COOKIES="true"
NEUROSHADOW_COOKIE_SAMESITE="lax"
```

The default `prisma/schema.prisma` uses SQLite so judges can run the project quickly. Production deployments can use the PostgreSQL-ready schema template:

```bash
pnpm prisma:generate:postgres
pnpm prisma:migrate:postgres
```

## Prisma Commands

```bash
pnpm prisma:generate
pnpm prisma:generate:postgres
pnpm prisma:migrate
pnpm prisma:migrate:postgres
pnpm prisma:studio
pnpm db:seed
pnpm lint
pnpm test
pnpm build
```

## API Routes

### Auth And User Routes

- `POST /api/auth/register` creates a user, hashes the password, creates an HttpOnly session cookie, and returns the safe user profile.
- `POST /api/auth/login` verifies credentials and creates an authenticated session.
- `GET /api/auth/csrf` ensures an existing signed-in browser session has the readable CSRF cookie used by client mutations.
- `POST /api/auth/logout` clears the server session and browser cookie.
- `GET /api/auth/me` returns the signed-in user.
- `GET /api/user/overview` returns only the signed-in user's counts and recent reports.
- `GET /api/user/export` returns a signed-in user's own sessions, aggregate signals, reports, feedback, and audit logs as JSON.
- `DELETE /api/user/session` deletes the signed-in user's current session records.
- `DELETE /api/user/all-data` deletes the signed-in user's account-owned records and clears the browser session.
- Authenticated mutation routes use a readable CSRF cookie plus `x-neuroshadow-csrf` header. The browser client sends this automatically through `secureFetch`.
- Mutation and sensitive export endpoints include an in-memory rate limit suitable for the single-process competition/demo runtime.

### `GET /api/health`

Returns service status, timestamp, and database mode:

```json
{
  "status": "ok",
  "service": "NEUROSHADOW API",
  "timestamp": "2026-05-24T00:00:00.000Z",
  "database": "connected",
  "apiErrors": {
    "recentCount": 0,
    "latest": null
  }
}
```

### `GET /api/monitoring/errors`

Returns the latest in-memory API error summary for a signed-in user. This is a lightweight production-readiness signal, not a replacement for external observability.

### `GET /api/metrics`

Returns simulated current cognitive metrics.

### `GET /api/alerts`

Returns active AI alerts.

### `GET /api/logs`

Returns AI engine logs.

### `POST /api/report`

Generates a report with summary, risk interpretation, key indicators, non-medical action, and disclaimer. If a user is signed in, the report is attached to that user's research session.

### `POST /api/mouse-analysis`

Accepts aggregate mouse indicators created in the browser and stores them for the signed-in user when the database is connected. In database mode this route requires an authenticated session; in mock mode it can accept the payload without persistence. Raw pointer coordinates are not sent to the server.

```json
{
  "actionsPerMinute": 88,
  "distancePx": 1420,
  "averageVelocity": 315,
  "idleMs": 240,
  "jitterScore": 19,
  "directionChanges": 6,
  "stabilityScore": 82,
  "confidence": 74,
  "sampleCount": 38,
  "clickCount": 2,
  "wheelCount": 1
}
```

### `POST /api/eye-analysis`

Accepts aggregate eye-frame indicators created locally in the browser after the user starts camera analysis. In database mode this route requires an authenticated session; in mock mode it can accept the payload without persistence. Camera frames are not sent to the server.

```json
{
  "trackingQuality": 82,
  "gazeStability": 76,
  "blinkProxy": 12,
  "lightingQuality": 88,
  "motionVariance": 16,
  "focusConsistency": 79,
  "confidence": 84,
  "frameCount": 24,
  "averageLuminance": 126,
  "contrastLevel": 34
}
```

### `POST /api/voice-analysis`

Accepts aggregate microphone indicators created locally in the browser after the user starts voice analysis. In database mode this route requires an authenticated session; in mock mode it can accept the payload without persistence. Raw microphone audio is not sent to the server.

```json
{
  "volumeLevel": 54,
  "voiceStability": 81,
  "speechActivity": 76,
  "silenceRatio": 24,
  "clarityScore": 83,
  "noiseLevel": 18,
  "toneVariability": 21,
  "confidence": 79,
  "sampleCount": 28,
  "averageRms": 71,
  "spectralCentroid": 840
}
```

### `POST /api/baseline/start`

Marks the beginning of a user-owned baseline flow and writes an audit event when Prisma is connected.

### `POST /api/baseline/complete`

Creates a personal baseline from current aggregate metrics and a short self-check-in. If the user has recent stored mouse, eye, or voice aggregates, the latest available values are attached to the baseline profile.

```json
{
  "focusSelfReport": 4,
  "energySelfReport": 3,
  "taskDifficulty": 3,
  "distractionLevel": 2,
  "metrics": {
    "focus": 78,
    "cognitiveLoad": 56,
    "fatigue": 39,
    "stress": 31,
    "stability": 82,
    "collapseRisk": 17,
    "signalQuality": 94,
    "timestamp": "2026-05-31T12:00:00.000Z"
  },
  "language": "en"
}
```

### `GET /api/baseline/current`

Returns the latest baseline profile for the signed-in user, or `null` when no baseline has been saved yet.

### `GET /api/session-review`

Returns the latest user-owned session reviews for the signed-in user. In mock mode it returns an empty list.

### `POST /api/session-review`

Generates and stores a simple session review from current metrics and recent history. The review includes summary, strongest signal change, best focus window, weakest window, signal quality, and one non-medical action.

```json
{
  "metrics": {
    "focus": 78,
    "cognitiveLoad": 56,
    "fatigue": 39,
    "stress": 31,
    "stability": 82,
    "collapseRisk": 17,
    "signalQuality": 94,
    "timestamp": "2026-05-30T12:00:00.000Z"
  },
  "history": [],
  "language": "en",
  "baselineComplete": true
}
```

### `POST /api/actions/recommend`

Generates one explainable, non-medical productivity recommendation from current metrics, the latest personal baseline, and available aggregate mouse/eye/voice signal snapshots. In database mode it requires an authenticated user and stores the recommendation as user-owned data.

```json
{
  "metrics": {
    "focus": 58,
    "cognitiveLoad": 78,
    "fatigue": 62,
    "stress": 48,
    "stability": 54,
    "collapseRisk": 36,
    "signalQuality": 91,
    "timestamp": "2026-05-31T12:00:00.000Z"
  },
  "language": "en"
}
```

### `POST /api/actions/feedback`

Stores the user's response to a recommended action. Supported statuses are `accepted`, `dismissed`, `not_useful`, `helpful`, `not_sure`.

```json
{
  "actionId": "clw_action_id",
  "status": "accepted",
  "focusAfter": 4,
  "energyAfter": 3
}
```

### `GET /api/actions/follow-up`

Returns the next due follow-up for the signed-in user and a summary of answered action outcomes.

```json
{
  "ok": true,
  "mode": "database",
  "dueAction": null,
  "stats": {
    "totalAnswered": 3,
    "helpfulRate": 67,
    "topActionTitle": "Take a 5 minute cognitive break"
  }
}
```

### `POST /api/actions/follow-up`

Stores the follow-up outcome for an accepted action. The request captures whether the action helped plus current focus and energy self-ratings.

```json
{
  "actionId": "clw_action_id",
  "outcome": "helpful",
  "focusAfter": 4,
  "energyAfter": 3,
  "language": "en"
}
```

### `GET /api/trends/weekly`

Returns a signed-in user's seven-day trend reflection. In database mode it reads user-owned sessions, metric snapshots, and action outcomes. In mock mode it returns safe simulated weekly data.

```json
{
  "ok": true,
  "mode": "database",
  "trends": {
    "averageFocusScore": 72,
    "averageStabilityScore": 76,
    "sessionsCompleted": 4,
    "mostCommonAlertType": {
      "type": "load",
      "label": "High cognitive load",
      "count": 6
    },
    "mostUsefulAction": {
      "title": "Reduce multitasking for 10 minutes",
      "count": 2
    }
  }
}
```

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

## Language Support

The dashboard supports English and Persian. Use the language switch in the top bar to change the entire UI. Persian mode sets `lang="fa"`, `dir="rtl"`, translates the dashboard copy, report modal, feedback validation messages, guide/about sections, alerts, logs, and aligns the layout for RTL presentation.

## Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) explains frontend, backend, data, Prisma, fallback, and future AI layers.
- [TEST_PLAN.md](./TEST_PLAN.md) gives manual and automated QA coverage.
- [SCIENTIFIC_SOURCES.md](./SCIENTIFIC_SOURCES.md) summarizes the research concepts behind the simulation.
- [SECURITY.md](./SECURITY.md) documents validation, safe rendering, demo token handling, and future security work.

## Security Notes

- Passwords are hashed with Node.js `scrypt`; raw passwords are never stored.
- Auth uses server-side session records and HttpOnly cookies.
- Authenticated mutations use CSRF protection through the `neuroshadow_csrf` cookie and `x-neuroshadow-csrf` request header.
- Mutation and user-data endpoints include simple in-memory rate limiting for demo deployment safety.
- Cookie security can be controlled with `NEUROSHADOW_SECURE_COOKIES` and `NEUROSHADOW_COOKIE_SAMESITE`.
- Dashboard and user panel routes are protected.
- Metrics, mouse signal snapshots, eye signal snapshots, voice signal snapshots, reports, feedback, and audit records are scoped to the authenticated user where available.
- Mouse analysis stores aggregate indicators only; raw pointer coordinates stay in browser memory and are discarded.
- Eye analysis processes camera frames locally; raw frames and images are never submitted to the API.
- Voice analysis processes microphone samples locally; raw audio and transcripts are never submitted to the API.
- Feedback is validated on the backend before acceptance.
- Text fields are sanitized to avoid dangerous HTML injection.
- React renders report and feedback text as text, not unsafe HTML.
- API responses disable caching and include `X-Content-Type-Options: nosniff`.
- API error summaries are exposed through `/api/health` and authenticated `/api/monitoring/errors`.
- No paid external API keys are required.
- Real cognitive or biometric data would require explicit consent, retention limits, access controls, and privacy review.

## Future Roadmap

- Expand the real mouse/eye/voice analysis pipeline with opt-in keyboard, wearable, and richer computer-vision streams.
- Expand weekly trends into monthly reflection and longer-term personalization.
- Add signal processing for smoothing, artifact rejection, and confidence scoring.
- Train transparent AI models on consented research datasets.
- Add model cards, evaluation reports, and bias/privacy review.
- Add authenticated teams, study management, and report export history.
- Integrate PostgreSQL migrations in production CI/CD.

## How To Present To Judges

1. Open the dashboard and point out that the data is simulated and non-medical.
2. Show the live metric cards, brain map, prediction gauge, timeline, alerts, and logs.
3. Run the personal baseline scan and show the quality score plus current-vs-baseline comparison.
4. Generate an action recommendation, show the reason, then accept or mark it as not useful.
5. Show the follow-up panel and explain that accepted actions become due after their stored follow-up window.
6. Open the History section and point out the weekly trend reflection.
7. Generate and download an AI report.
8. Move the mouse over the dashboard and show the real mouse-analysis panel updating aggregate values.
9. Start eye analysis to show opt-in local camera processing, or show the clear camera-unavailable state in locked-down demo environments.
10. Start voice analysis to show opt-in microphone aggregation, or show the clear microphone-unavailable state in locked-down demo environments.
11. Submit feedback to demonstrate backend validation.
12. Open `/api/health`, `/api/metrics`, `/api/alerts`, `/api/logs`, `/api/mouse-analysis`, `/api/eye-analysis`, `/api/voice-analysis`, `/api/baseline/current`, `/api/actions/recommend`, `/api/actions/follow-up`, `/api/trends/weekly`, and `/api/user/overview` to show real API routes.
13. Explain the Prisma schema and how SQLite demo mode can become PostgreSQL production mode.

## Disclaimer

NEUROSHADOW is an educational and research demonstration. It uses simulated data and does not provide medical diagnosis, treatment, or health recommendations.
