# NEUROSHADOW Presentation

## 3-Minute Presentation Script

Hello, this project is **NEUROSHADOW**, an AI Cognitive Collapse Prediction Dashboard.

The idea is simple: in high-pressure digital work, performance can decline before people notice it. NEUROSHADOW demonstrates how a future research system could monitor behavioral and cognitive indicators, detect early instability patterns, and explain why the system is raising an alert.

This is not a medical device and it is not a diagnosis tool. The dashboard clearly states that all data is simulated and that it does not provide medical diagnosis, treatment, or health recommendations.

On the main screen, we can see live metrics for focus level, cognitive load, mental fatigue, stress probability, cognitive stability, collapse risk, and signal quality. These values update every few seconds with smooth simulated movement, so the dashboard feels like a real monitoring system without relying on paid APIs or private data.

The project now also includes real browser-side signals: mouse analysis, opt-in eye-frame analysis, and opt-in voice analysis. When I move, click, or scroll in the dashboard, the app calculates aggregate mouse indicators such as actions per minute, distance, velocity, idle time, jitter, direction changes, stability, and confidence. If I start eye analysis and grant camera permission, the browser locally processes a small eye-region frame proxy and calculates tracking quality, gaze stability, blink proxy, lighting quality, motion variance, focus consistency, and confidence. If I start voice analysis and grant microphone permission, the browser locally calculates volume level, voice stability, speech activity, silence ratio, clarity score, noise level, tone variability, and confidence. Raw pointer coordinates, camera frames, and microphone audio are not sent to the server; only aggregate values are stored for the signed-in user.

The AI alert panel shows explainable alerts such as cognitive stability dropping, attention drift, stress spike, and performance prediction. The performance gauge estimates a possible decline window, and the brain map gives a visual representation of cognitive activity zones. The timeline shows how all six core indicators are changing over time.

This is also a full engineering project, not just a frontend. It has real registration and login, protected dashboard and user panel pages, HttpOnly session cookies, password hashing, and user-scoped data. The Next.js API routes cover authentication, health checks, metrics, alerts, logs, mouse analysis, eye analysis, voice analysis, personal baseline storage, weekly trends, report generation, user overview, and feedback submission. It uses Prisma ORM with models for users, auth sessions, research sessions, metric snapshots, mouse signal snapshots, eye signal snapshots, voice signal snapshots, baseline profiles, alerts, reports, feedback, and audit logs. It runs locally with SQLite emergency demo mode, and the architecture is ready for PostgreSQL in production.

The user can run a personal baseline scan, answer a short self-check-in, see a baseline quality score, compare current metrics against their own baseline, ask the action engine for one small non-medical productivity recommendation, accept or dismiss that recommendation, answer a follow-up about whether it helped, inspect a seven-day weekly trend reflection, generate an AI report, download the report as a text file, inspect AI engine logs, read the user guide, review the about and roadmap sections, submit validated feedback, disable individual sensor streams, export their own data, delete the current session, and delete their account-owned data.

The upgraded version also includes a lightweight animated neural signal field, Framer Motion interaction polish, quick actions for judge demos, toast notifications, a visible secure demo session indicator, and a complete documentation set.

The future roadmap is to replace simulated data with opt-in sensor streams, add signal processing, train transparent AI models on consented research datasets, and build privacy-preserving research workflows.

NEUROSHADOW is innovative because it combines a polished AI dashboard, explainable simulated prediction, responsible ethical framing, backend routes, data modeling, and a realistic path from demo to real research system.

## 1-Minute Short Pitch

NEUROSHADOW is an educational AI dashboard that simulates real-time cognitive monitoring and predicts possible performance decline before a critical drop. It visualizes focus, workload, fatigue, stress, stability, collapse risk, and signal quality with live charts, alerts, a brain map, and an AI report generator.

The project is not a medical diagnosis system. It uses simulated data only and clearly states that limitation.

Technically, it is built with Next.js App Router, TypeScript, React components, backend API routes, Prisma ORM, first-party authentication, aggregate browser mouse analysis, opt-in local eye-frame analysis, opt-in local voice analysis, an explainable action recommendation engine, weekly trend reflection, and a SQLite emergency fallback with PostgreSQL-ready architecture. It includes user guide, about section, feedback validation, security notes, documentation, and a roadmap toward real AI and signal processing.

## Technical Explanation

- Frontend: Next.js App Router page with reusable TypeScript React components.
- Visual layer: lightweight CSS/SVG neural field, SVG brain map, Framer Motion, and premium responsive CSS.
- Simulation: Browser loop fetches metrics from `/api/metrics` and smooths updates locally.
- Real mouse analysis: browser pointer events are converted into aggregate features and sent to `/api/mouse-analysis`.
- Real eye analysis: opt-in browser camera frames are processed locally and aggregate features are sent to `/api/eye-analysis`.
- Real voice analysis: opt-in browser microphone samples are processed locally and aggregate features are sent to `/api/voice-analysis`.
- Personal baseline: `/api/baseline/start`, `/api/baseline/complete`, and `/api/baseline/current` store a user-scoped baseline with self-check-in answers, current metrics, quality score, and latest available sensor aggregates.
- Action engine: `/api/actions/recommend` compares current metrics with baseline and recent aggregate sensor snapshots, then stores one explainable non-medical recommendation; `/api/actions/feedback` stores the user's initial response.
- Follow-up loop: `/api/actions/follow-up` finds due accepted actions, stores helped/not-helped/not-sure outcomes, and returns helpful-rate statistics.
- Weekly trends: `/api/trends/weekly` summarizes seven days of user-owned sessions, metric snapshots, alert-like patterns, useful action outcomes, and signal quality trend points.
- Privacy controls: dashboard toggles stop mouse, eye, voice, and simulated cognitive streams; `/api/user/export`, `/api/user/session`, and `/api/user/all-data` provide user-scoped export and deletion.
- Backend: Next.js route handlers return health, metrics, alerts, logs, reports, mouse-analysis, eye-analysis, voice-analysis, baseline, action recommendation, action follow-up, and feedback responses.
- Auth: registration and login use password hashing, server-side session records, and HttpOnly cookies.
- Data layer: Prisma models represent users, auth sessions, research sessions, metric snapshots, mouse signal snapshots, eye signal snapshots, voice signal snapshots, baseline profiles, recommended actions, alerts, reports, feedback, and audit logs.
- User panel: `/panel` displays only the signed-in user's counts and recent reports.
- Fallback: If Prisma cannot connect, API routes and UI continue in mock demo mode.
- Security: Feedback validation, text sanitization, no unsafe HTML injection, and rate-limit placeholder.
- Documentation: README explains setup, API routes, database mode, security, roadmap, and judging flow.
- Testing: Vitest covers report generation and validation logic; manual QA verifies UI, APIs, fallback mode, and responsive layout.

## Judge Questions

### Where does data come from?

Most cognitive indicators use simulated data generated by the app. The mouse-analysis module uses real browser interaction events but stores only aggregate indicators, not raw coordinates. The eye-analysis module uses opt-in local camera-frame processing and stores only aggregate indicators, not images or video. The voice-analysis module uses opt-in local microphone processing and stores only aggregate indicators, not audio or transcripts. The personal baseline combines a short self-check-in with current metrics and the latest available aggregate sensor values. This keeps the demo safe, repeatable, and privacy-friendly.

### Is it medical diagnosis?

No. NEUROSHADOW is not a medical diagnosis, treatment, or health recommendation system. It is an educational and research demonstration using simulated data.

### What is the backend?

The backend is implemented with Next.js API routes inside the App Router. It includes auth, user overview, health, metrics, alerts, logs, mouse analysis, eye analysis, voice analysis, baseline, action recommendation, action feedback, action follow-up, weekly trends, report generation, and feedback endpoints.

### What is the database used for?

The Prisma schema models users, auth sessions, sessions, metric snapshots, mouse signal snapshots, eye signal snapshots, voice signal snapshots, baseline profiles, recommended actions, alerts, generated reports, feedback, and audit logs. User-owned records are separated with relations. In local demo mode it can use SQLite; in production the architecture is ready for PostgreSQL.

### How will AI be integrated later?

Future versions can use opt-in behavioral signals, signal processing, feature extraction, and trained models. The app would add model cards, evaluation metrics, confidence scoring, and privacy controls before any real deployment.

### How is security handled?

The current demo validates auth, feedback, mouse aggregate payloads, eye aggregate payloads, voice aggregate payloads, export, and delete operations with backend logic, hashes passwords with `scrypt`, uses HttpOnly session cookies, sanitizes text, avoids dangerous HTML injection, displays a secure demo token, and stores no real medical data. Raw mouse coordinates, camera frames, and microphone audio are not persisted. Users can disable streams and export or delete user-owned records. A production version would add rate limiting, CSRF protection, encryption, consent flows, and retention policies.

### What makes this project innovative?

It combines a serious AI monitoring interface with explainable prediction, a personal baseline, real aggregate browser signals, a small action recommendation and follow-up loop, weekly reflection over user-owned history, responsible non-medical framing, real backend routes, Prisma data modeling, report generation, feedback collection, and a credible roadmap from simulated prototype to research-grade platform.

## Final Disclaimer

NEUROSHADOW is an educational and research demonstration. It uses simulated data and does not provide medical diagnosis, treatment, or health recommendations.
