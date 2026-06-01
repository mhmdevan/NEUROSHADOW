# NEUROSHADOW Architecture

## Current Architecture

NEUROSHADOW is a Next.js App Router application with a client-heavy dashboard and server-side API routes. It is designed to be impressive during live judging while remaining technically explainable.

```text
Browser UI
  React components
  Framer Motion
  SVG/CSS visualizations
        |
        v
Next.js API Routes
  /api/auth/*
  /api/user/overview
  /api/user/export
  /api/user/session
  /api/user/all-data
  /api/health
  /api/metrics
  /api/alerts
  /api/logs
  /api/mouse-analysis
  /api/eye-analysis
  /api/voice-analysis
  /api/baseline/*
  /api/session-review
  /api/actions/recommend
  /api/actions/feedback
  /api/actions/follow-up
  /api/trends/weekly
  /api/monitoring/errors
  /api/report
  /api/feedback
        |
        v
Data Layer
  Prisma ORM
  SQLite local demo fallback
  PostgreSQL-ready production configuration
```

## Frontend Layer

The frontend lives in `src/app/page.tsx` and reusable components under `src/components`.

Key frontend responsibilities:

- Live metric display and smooth simulation updates.
- Premium glassmorphism dashboard layout.
- Lightweight animated neural signal field in `NeuralField`.
- SVG cognitive brain map with lobes, activity regions, scan line, and legend.
- Real browser mouse-analysis collector in `LiveInputMonitor`, using in-memory pointer samples and aggregate feature extraction.
- Real opt-in eye-frame analysis in `LiveInputMonitor`, using `getUserMedia`, a hidden local canvas, and aggregate-only feature extraction.
- Quick actions, toasts, report modal, feedback form, user guide, and about section.
- Privacy controls for active sensors, data export, current-session deletion, all-data deletion, and a plain-language privacy explainer.
- Weekly trends panel in the History section with aggregate seven-day reflection and simple signal-quality chart.
- Language provider and dictionaries for English/Persian localization, including RTL layout mode for Persian.
- Reduced motion and theme intensity settings.
- Presentation mode for judge demos.

## Backend API Layer

All backend endpoints are implemented as Next.js route handlers under `src/app/api`.

- `GET /api/health` reports service status and database/mock mode.
- `GET /api/health` also includes a bounded API error summary for quick deployment checks.
- `GET /api/monitoring/errors` returns the same API error summary for signed-in users.
- `GET /api/metrics` returns simulated cognitive metrics and attempts to persist snapshots.
- `GET /api/alerts` returns explainable AI alerts.
- `GET /api/logs` returns AI engine log events.
- `POST /api/mouse-analysis` accepts aggregate mouse indicators and stores them for the current user when Prisma is connected.
- `POST /api/eye-analysis` accepts aggregate camera-frame eye indicators and stores them for the current user when Prisma is connected.
- `POST /api/voice-analysis` accepts aggregate microphone voice indicators and stores them for the current user when Prisma is connected.
- `POST /api/baseline/start` records the start of a personal baseline flow.
- `POST /api/baseline/complete` stores a user-scoped baseline from self-check-in answers, current metrics, and latest available mouse/eye/voice aggregates.
- `GET /api/baseline/current` returns the latest baseline for the signed-in user.
- `GET /api/session-review` returns recent user-owned reviews.
- `POST /api/session-review` generates and stores a simple user-owned session review.
- `POST /api/actions/recommend` generates and stores one explainable non-medical action recommendation for the signed-in user.
- `POST /api/actions/feedback` stores accept, dismiss, not-useful, helpful, or not-sure feedback for a user-owned recommendation.
- `GET /api/actions/follow-up` returns the next due accepted action and action outcome statistics for the signed-in user.
- `POST /api/actions/follow-up` stores whether the action helped plus current focus and energy follow-up scores.
- `GET /api/trends/weekly` returns average focus, average stability, session count, most common alert pattern, most useful action, and signal-quality trend for the signed-in user.
- `POST /api/report` generates a non-medical report from metrics.
- `POST /api/feedback` validates and stores feedback or returns clear errors.
- `POST /api/auth/register` and `POST /api/auth/login` create authenticated user sessions.
- `GET /api/auth/csrf` refreshes the readable CSRF cookie for already signed-in browser sessions.
- `POST /api/auth/logout` clears a session.
- `GET /api/auth/me` and `GET /api/user/overview` power protected user-specific pages.
- `GET /api/user/export` exports only the signed-in user's own sessions, aggregate signals, reports, feedback, and audit logs.
- `DELETE /api/user/session` removes the signed-in user's current session.
- `DELETE /api/user/all-data` removes the signed-in user's account-owned records and clears their session cookie.
- Authenticated mutations pass through `enforceMutationSecurity`, which combines in-memory rate limiting with a double-submit CSRF token check.

## Data Layer

The app uses Prisma models for:

- `Session`
- `User`
- `AuthSession`
- `MetricSnapshot`
- `MouseSignalSnapshot`
- `EyeSignalSnapshot`
- `VoiceSignalSnapshot`
- `BaselineProfile`
- `SessionReview`
- `RecommendedAction`
- `Alert`
- `Report`
- `Feedback`
- `AuditLog`

This makes the project more than a static frontend: it has a defendable data model for authentication, user-specific persistence, auditing, reporting, and research session history.

## Real Mouse-Analysis Pipeline

The current implementation includes real aggregate browser mouse activity as one of the live behavioral streams.

```text
Browser pointer events
  pointermove / pointerdown / wheel
        |
        v
In-memory samples
  last 15 seconds only
        |
        v
Feature extraction
  actions/min, distance, velocity, idle time, jitter,
  direction changes, stability score, confidence
        |
        v
POST /api/mouse-analysis
  aggregate values only
        |
        v
Prisma MouseSignalSnapshot
  user-scoped storage when database mode is active
```

Raw pointer coordinates are not persisted and are not sent to the server. They remain in browser memory only long enough to calculate aggregate indicators for the dashboard.

The Phase 5 privacy toggle stops new mouse-event capture and resets local mouse aggregate state immediately.

## Real Eye-Analysis Pipeline

The app also includes an opt-in browser camera stream for eye-frame analysis.

```text
User clicks Start Eye Analysis
        |
        v
Browser getUserMedia camera stream
        |
        v
Hidden local canvas
  small upper-center eye-region crop
        |
        v
Feature extraction
  tracking quality, gaze stability, blink proxy,
  lighting quality, motion variance, focus consistency,
  confidence
        |
        v
POST /api/eye-analysis
  aggregate values only
        |
        v
Prisma EyeSignalSnapshot
  user-scoped storage when database mode is active
```

Camera frames are not persisted and are not sent to the server. The browser keeps only short-window aggregate frame statistics for analysis.

The Phase 5 privacy toggle stops camera tracks and clears local eye aggregate state when disabled.

## Real Voice-Analysis Pipeline

The app also includes an opt-in browser microphone stream for voice-signal aggregation.

```text
User clicks Start Voice Analysis
        |
        v
Browser getUserMedia microphone stream
        |
        v
Web Audio API analyser node
        |
        v
Feature extraction
  volume level, voice stability, speech activity,
  silence ratio, clarity score, noise level,
  tone variability, confidence
        |
        v
POST /api/voice-analysis
  aggregate values only
        |
        v
Prisma VoiceSignalSnapshot
  user-scoped storage when database mode is active
```

Microphone audio is not persisted, transcribed, or sent to the server. The browser keeps only short-window aggregate audio statistics for analysis.

The Phase 5 privacy toggle closes the Web Audio context, stops microphone tracks, and clears local voice aggregate state when disabled.

## Baseline Pipeline

Phase 2 adds a real per-user baseline layer. It keeps the implementation practical: the user completes a short 1-5 self-check-in, the dashboard sends the current aggregate cognitive metrics, and the API attaches the latest available mouse, eye, and voice aggregate records for that user.

```text
Self-check-in + current dashboard metrics
        |
        v
POST /api/baseline/start
  audit event
        |
        v
POST /api/baseline/complete
  baseline quality score, status, summary
        |
        v
Latest MouseSignalSnapshot / EyeSignalSnapshot / VoiceSignalSnapshot
  aggregate values only, when available
        |
        v
Prisma BaselineProfile
  user-scoped personal reference
```

The UI shows missing, active, stale, and low-quality baseline states. Current focus, stability, load, and risk are displayed relative to the user's own stored baseline instead of relying only on generic thresholds.

## Session Review Pipeline

Phase 1 adds a simple review layer that turns recent dashboard history into a useful personal summary.

```text
Current metrics + recent history
        |
        v
Session review generator
  strongest change, best focus window,
  weakest window, signal quality,
  non-medical next action
        |
        v
POST /api/session-review
        |
        v
Prisma SessionReview
  user-scoped storage
```

This keeps the product useful without adding heavy machine learning or medical claims.

## Action Recommendation Pipeline

Phase 3 adds a simple action engine. It compares current metrics with the latest personal baseline and the latest available aggregate mouse, eye, and voice snapshots. It then returns one small non-medical action with a short reason.

```text
Current metrics + latest baseline + latest aggregate sensor snapshots
        |
        v
Rule-based action engine
  one action, short reason, priority,
  follow-up window, non-medical disclaimer
        |
        v
POST /api/actions/recommend
        |
        v
Prisma RecommendedAction
  user-scoped storage
        |
        v
POST /api/actions/feedback
  accepted / dismissed / not useful / not sure
```

## Action Follow-Up Pipeline

Phase 4 closes the loop after a user accepts an action. The dashboard checks for accepted actions whose `followUpAt` window is due, asks whether the action helped, captures current focus and energy ratings, and stores the outcome under the same user-owned `RecommendedAction` record.

```text
Accepted RecommendedAction
  status = accepted, followUpAt set
        |
        v
GET /api/actions/follow-up
  finds due accepted action for current user
        |
        v
Dashboard follow-up form
  helped / did not help / not sure
  focusAfter 1-5, energyAfter 1-5
        |
        v
POST /api/actions/follow-up
        |
        v
RecommendedAction outcome fields
  status, helpful, focusAfter,
  energyAfter, respondedAt
        |
        v
Outcome stats
  helpful rate, answered count,
  average focus, top helpful action
```

This keeps personalization transparent and rule-based before any future ML layer is introduced.

## Weekly Trends Pipeline

Phase 6 adds a seven-day reflection layer. It reads only current-user sessions, metric snapshots, and answered action outcomes, then returns a compact trend summary that is easy to explain during a demo.

```text
User-owned sessions + metric snapshots + action outcomes
        |
        v
GET /api/trends/weekly
        |
        v
Weekly trend generator
  average focus, average stability,
  sessions completed, common alert pattern,
  most useful action, signal-quality chart points
        |
        v
History section WeeklyTrends panel
```

The weekly alert pattern is derived from metric thresholds, not medical inference. Mock mode returns realistic sample data so the UI remains demo-safe without a database.

## Authentication Layer

NEUROSHADOW now uses first-party authentication without paid external services. Users can register, log in, and log out. Passwords are hashed with Node.js `scrypt`, session tokens are stored as hashes in Prisma, and the browser only receives an HttpOnly session cookie. The protected dashboard and user panel read the current user server-side before rendering.

User-owned records are separated through Prisma relations:

- `User -> Session -> MetricSnapshot`
- `User -> MouseSignalSnapshot`
- `User -> EyeSignalSnapshot`
- `User -> VoiceSignalSnapshot`
- `User -> BaselineProfile`
- `User -> SessionReview`
- `User -> RecommendedAction`
- `User -> Session -> Report`
- `User -> Feedback`
- `User -> AuditLog`

## Prisma / Database Layer

The default local schema uses SQLite so the project runs quickly in emergency demo mode. Production can use `prisma/schema.postgres.prisma` with `DATABASE_URL` set to a PostgreSQL connection string.

The project intentionally supports:

- Local SQLite for fast demos.
- PostgreSQL-ready schema for deployment through `pnpm prisma:generate:postgres` and `pnpm prisma:migrate:postgres`.
- Mock data fallback if database connectivity fails.

## Fallback Mock Mode

If Prisma cannot connect or `DATABASE_URL` is not configured, the API layer still returns simulated metrics, alerts, logs, and reports. The UI clearly shows:

```text
Demo mode active: using simulated cognitive data.
```

If persistence is working, the UI shows:

```text
Database mode active.
```

## Future AI Pipeline

A real AI version would add:

- Consent-based sensor collection.
- Keyboard, expanded mouse, richer eye-tracking, voice, wearable, or EEG-inspired streams.
- Signal preprocessing, smoothing, artifact rejection, and confidence scoring.
- Feature extraction for time-on-task, variability, drift, fatigue, and workload.
- Transparent ML models with model cards and evaluation reports.
- Privacy controls, authentication, encryption, and data retention policies.

NEUROSHADOW currently simulates this pipeline for education and competition demonstration.
