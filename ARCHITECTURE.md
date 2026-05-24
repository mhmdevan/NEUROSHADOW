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
  /api/health
  /api/metrics
  /api/alerts
  /api/logs
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
- Quick actions, toasts, report modal, feedback form, user guide, and about section.
- Reduced motion and theme intensity settings.
- Presentation mode for judge demos.

## Backend API Layer

All backend endpoints are implemented as Next.js route handlers under `src/app/api`.

- `GET /api/health` reports service status and database/mock mode.
- `GET /api/metrics` returns simulated cognitive metrics and attempts to persist snapshots.
- `GET /api/alerts` returns explainable AI alerts.
- `GET /api/logs` returns AI engine log events.
- `POST /api/report` generates a non-medical report from metrics.
- `POST /api/feedback` validates and stores feedback or returns clear errors.

## Data Layer

The app uses Prisma models for:

- `Session`
- `MetricSnapshot`
- `Alert`
- `Report`
- `Feedback`
- `AuditLog`

This makes the project more than a static frontend: it has a defendable data model for future persistence, auditing, reporting, and research session history.

## Prisma / Database Layer

The default local schema uses SQLite so the project runs quickly in emergency demo mode. For production, change the Prisma datasource provider to PostgreSQL and set `DATABASE_URL` to a PostgreSQL connection string.

The project intentionally supports:

- Local SQLite for fast demos.
- PostgreSQL-ready schema for deployment.
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
- Keyboard, mouse, voice, eye-tracking, wearable, or EEG-inspired streams.
- Signal preprocessing, smoothing, artifact rejection, and confidence scoring.
- Feature extraction for time-on-task, variability, drift, fatigue, and workload.
- Transparent ML models with model cards and evaluation reports.
- Privacy controls, authentication, encryption, and data retention policies.

NEUROSHADOW currently simulates this pipeline for education and competition demonstration.
