# NEUROSHADOW Security Notes

## Current Security Practices

- Feedback input is validated on the backend with Zod.
- Text fields are sanitized before storage or display.
- React renders user content as text, not dangerous HTML.
- API responses use no-store caching and `X-Content-Type-Options: nosniff`.
- User registration and login use server-side validation.
- Passwords are hashed with Node.js `scrypt`; raw passwords are never stored.
- Auth sessions are stored server-side as token hashes and delivered to the browser as HttpOnly cookies.
- Authenticated mutations require a readable `neuroshadow_csrf` cookie that matches the `x-neuroshadow-csrf` request header.
- Signed-in dashboard and panel screens call `/api/auth/csrf` on load so existing sessions can receive the readable CSRF cookie after an upgrade.
- Mutating endpoints and sensitive user-data exports use simple in-memory rate limits for the single-process demo runtime.
- Cookie security is environment-aware through `NEUROSHADOW_SECURE_COOKIES` and `NEUROSHADOW_COOKIE_SAMESITE`.
- API errors are recorded in a bounded in-memory monitor and surfaced through `/api/health` and `/api/monitoring/errors`.
- The dashboard and user panel are protected by server-side auth checks.
- User-owned sessions, mouse signal snapshots, eye signal snapshots, voice signal snapshots, baseline profiles, recommended actions, reports, feedback, and audit logs are separated by Prisma relations.
- Mouse analysis stores aggregate indicators only. Raw pointer coordinates are kept in browser memory for short-window analysis and are never submitted to the API.
- Eye analysis is opt-in through browser camera permission. Camera frames are processed locally in a hidden canvas and are never submitted to the API.
- Voice analysis is opt-in through browser microphone permission. Audio samples are processed locally with the Web Audio API and are never submitted to the API.
- Dashboard privacy toggles let a signed-in user stop mouse, eye, voice, or simulated cognitive streams from the UI.
- Data export returns only the signed-in user's own records.
- Current-session deletion and all-data deletion endpoints are scoped to the authenticated user.
- The UI displays a demo secure session token to make session state visible during judging.
- No real medical, biometric, or sensitive health data is collected.
- No paid external API keys are required.

## Input Validation

The feedback API checks:

- Name length.
- Optional email format if provided.
- Message length.
- Rating range from 1 to 5.

Invalid submissions return clear JSON errors.

The mouse-analysis API checks:

- Numeric bounds for actions per minute, distance, velocity, idle time, jitter, direction changes, stability, confidence, samples, clicks, and wheel events.
- Optional session identifier length.
- JSON body shape before any database write.

Invalid aggregate payloads return clear JSON errors.

The eye-analysis API checks:

- Numeric bounds for tracking quality, gaze stability, blink proxy, lighting quality, motion variance, focus consistency, confidence, frame count, luminance, and contrast.
- Optional session identifier length.
- JSON body shape before any database write.

Invalid aggregate payloads return clear JSON errors.

The voice-analysis API checks:

- Numeric bounds for volume level, voice stability, speech activity, silence ratio, clarity, noise, tone variability, confidence, samples, average RMS, and spectral centroid.
- Optional session identifier length.
- JSON body shape before any database write.

Invalid aggregate payloads return clear JSON errors.

The baseline API checks:

- Self-check-in values are integers from 1 to 5.
- Current cognitive metrics are bounded from 0 to 100.
- Optional session identifier length.
- JSON body shape before any database write.
- Latest available mouse, eye, and voice aggregates are copied from existing user-owned records only.

Invalid baseline payloads return clear JSON errors.

The action recommendation API checks:

- Current cognitive metrics are bounded from 0 to 100.
- Optional session identifier length.
- Language values are limited to English or Persian.
- Latest baseline and sensor aggregates are read only from records owned by the signed-in user.
- The generated text is sanitized before storage.

The action feedback API checks:

- Action id length.
- Status values are limited to accepted, dismissed, not useful, helpful, or not sure.
- Optional focus and energy follow-up values are integers from 1 to 5.
- Database updates are scoped to the signed-in user's action id.

Invalid action payloads return clear JSON errors.

The action follow-up API checks:

- Action ids are required.
- Outcome values are limited to helpful, not useful, or not sure.
- Focus and energy follow-up values are required integers from 1 to 5.
- Only accepted actions owned by the signed-in user can be completed.
- Outcome summaries are calculated only from the signed-in user's action records.

Invalid follow-up payloads return clear JSON errors.

The weekly trends API checks:

- A valid authenticated session is required in database mode.
- Sessions, metric snapshots, and action outcomes are queried only through the signed-in user's id.
- Mock mode returns simulated trends without persistence if Prisma is unavailable.
- The response is aggregate-only and does not expose raw sensor data.

The privacy and data-control APIs check:

- A valid authenticated session is required before export or deletion.
- Export queries are filtered by the signed-in user's id.
- Current-session deletion is filtered by both user id and current session id.
- All-data deletion removes the current user's account-owned records and clears the HttpOnly session cookie.
- Mock mode returns clear no-persistence messages instead of crashing.

## Safe Rendering

The app does not use `dangerouslySetInnerHTML`. Generated reports and API previews are rendered as text in modal panels.

## Authentication And Demo Token

The secure token in the sidebar is still a visual research-session token, not the login secret. Real authentication uses the HttpOnly `neuroshadow_session` cookie and a hashed `AuthSession` record in the database.

## Future Authentication Hardening

A production system should add:

- Role-based access.
- Study/team permissions.
- Distributed rate limiting backed by Redis or the deployment platform.
- Centralized monitoring and alerting beyond the current in-memory API error summary.
- Audit review tools.
- Stronger delete/export audit retention policies.

## Future Encryption

A production research system should add:

- TLS everywhere.
- Database encryption at rest.
- Secrets management.
- Field-level encryption for sensitive study data.
- Short retention windows.
- Export/delete controls.

## Medical Data Warning

NEUROSHADOW is an educational simulation. It now includes real browser mouse-behavior aggregation, opt-in local camera-frame eye aggregation, and opt-in local microphone aggregation, but this is not medical or biometric diagnosis data. A real cognitive monitoring platform would require consent, privacy review, clinical validation where relevant, and strict governance before handling any sensitive health or biometric data.
