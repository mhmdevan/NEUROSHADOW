# NEUROSHADOW Test Plan

## Automated Checks

Run:

```bash
pnpm install
pnpm prisma:generate
pnpm test
pnpm lint
pnpm build
```

Expected result: all commands complete without errors.

For authenticated mutation curl tests, capture both cookies from login/register and send the CSRF token:

```bash
CSRF_TOKEN=$(awk '$6=="neuroshadow_csrf"{print $7}' cookies.txt)
```

Then include `-H "x-neuroshadow-csrf: $CSRF_TOKEN"` on authenticated `POST`, `PUT`, `PATCH`, and `DELETE` requests.

## Dashboard Load Test

1. Run `pnpm dev`.
2. Open `http://localhost:3030`.
3. Confirm unauthenticated users are redirected to `/login`.
4. Register or log in.
5. Confirm the dashboard loads without a blank screen.
6. Confirm the hero, lightweight neural field, metric cards, alerts, logs, timeline, brain map, guide, about, and feedback sections render.

Expected result: the interface is usable and visually polished.

## Authentication Test

1. Open `/register`.
2. Submit an invalid email or short password.
3. Confirm validation errors appear.
4. Register with a valid name, email, and password.
5. Confirm the app redirects to `/dashboard`.
6. Open `/api/auth/me` with the browser session.
7. Log out and confirm `/api/auth/me` returns `401`.
8. Log in again with the same credentials.

Expected result: authentication works with HttpOnly cookies and protected routes.

## Production Hardening Test

1. Register or log in and confirm the browser receives both `neuroshadow_session` and `neuroshadow_csrf` cookies.
2. Trigger an authenticated mutation from the UI and confirm it succeeds.
3. Repeat the same mutation with curl using the session cookie but without `x-neuroshadow-csrf`.
4. Confirm the API returns `403` with a friendly security-token message.
5. Send many requests to the same mutation endpoint and confirm the route eventually returns `429`.
6. Open `/api/health` and confirm it includes `apiErrors`.
7. Open `/api/monitoring/errors` while signed in and confirm it returns the bounded in-memory error summary.

Expected result: authenticated mutations are CSRF-protected, noisy mutation traffic is rate limited, and API errors are visible without external services.

## User Panel And Data Separation Test

1. Register user A.
2. Generate metrics and an AI report.
3. Open `/panel`.
4. Confirm report and metric counts appear for user A.
5. Log out and register user B.
6. Open `/panel`.

Expected result: user B does not see user A's report counts or report list.

## Metrics Update Test

1. Watch the metric cards for at least 10 seconds.
2. Confirm values update every few seconds.
3. Confirm values drift smoothly and remain in defined ranges.

Expected result: no ugly random jumps or frozen UI.

## Real Mouse Analysis Test

1. Open the signed-in dashboard.
2. Move the mouse or trackpad across the dashboard for 10-15 seconds.
3. Click once and scroll once.
4. Confirm the `Mouse Movement` card changes from pending to a confidence value.
5. Confirm the real mouse-analysis panel updates actions/min, distance, velocity, idle time, jitter, direction changes, stability, confidence, and sample count.
6. Confirm `/api/mouse-analysis` accepts authenticated aggregate JSON and does not require raw `x` or `y` coordinates.
7. Open `/panel` and confirm the mouse-signal count increases when database mode is active.

Expected result: mouse indicators are calculated from real browser activity, stored as user-scoped aggregate snapshots, and raw coordinates are not persisted.

## Real Eye Analysis Test

1. Open the signed-in dashboard.
2. Go to `Live Monitor`.
3. Click `Start Eye Analysis`.
4. Grant camera permission if the browser and device allow it.
5. Confirm the eye-analysis panel updates tracking quality, gaze stability, blink proxy, lighting, motion variance, focus consistency, confidence, and frame count.
6. If the test environment has no camera or denies permission, confirm a clear camera-unavailable message appears with no console crash.
7. Confirm `/api/eye-analysis` accepts authenticated aggregate JSON and does not require image frames.
8. Open `/panel` and confirm the eye-signal count increases when database mode is active.

Expected result: eye indicators are calculated from local browser camera frames when permission is available, stored as user-scoped aggregate snapshots, and camera frames are not persisted.

## Real Voice Analysis Test

1. Open the signed-in dashboard.
2. Go to `Live Monitor`.
3. Click `Start Voice Analysis`.
4. Grant microphone permission if the browser and device allow it.
5. Speak normally for a few seconds.
6. Confirm the voice-analysis panel updates volume level, voice stability, speech activity, silence ratio, clarity score, noise level, tone variability, and sample count.
7. If the test environment has no microphone or denies permission, confirm a clear microphone-unavailable message appears with no console crash.
8. Confirm `/api/voice-analysis` accepts authenticated aggregate JSON and does not require audio files, waveform data, or transcripts.
9. Open `/panel` and confirm the voice-signal count increases when database mode is active.

Expected result: voice indicators are calculated from local browser microphone samples when permission is available, stored as user-scoped aggregate snapshots, and raw microphone audio is not persisted.

## Personal Baseline Test

1. Open the signed-in dashboard.
2. Go to `Baseline`.
3. Adjust the four self-check-in sliders: focus, energy, task difficulty, and distraction level.
4. Click `Save personal baseline`.
5. Confirm the panel shows a quality score, stored timestamp, missing/active/low-quality state, and current-vs-baseline comparison.
6. If mouse, eye, or voice aggregates have been created, confirm the baseline sensor strip shows the latest available aggregate values.
7. Open `/panel` and confirm the baseline count increases when database mode is active.

Expected result: a baseline is stored for only the signed-in user, and the UI can explain whether the baseline is missing, active, stale, or low quality.

## Action Recommendation Test

1. Open the signed-in dashboard.
2. Go to the action recommendation panel.
3. Click `Recommend Action`.
4. Confirm a single action appears with a title, reason, priority, follow-up window, and non-medical disclaimer.
5. Click `Accept`, `Not sure`, `Not useful`, and `Dismiss` in separate runs.
6. Open `/panel` and confirm the action count increases when database mode is active.

Expected result: recommendations are user-scoped, explainable, bilingual, non-medical, and feedback is stored without exposing another user's data.

## Action Follow-Up Test

1. Open the signed-in dashboard.
2. Generate an action and click `Accept`.
3. Wait until the action's follow-up window is due, or during QA move its stored `followUpAt` timestamp into the past.
4. Click `Check follow-ups`.
5. Confirm the follow-up form asks whether the action helped.
6. Set current focus and energy from 1 to 5.
7. Submit `Yes`, `No`, or `Not sure`.
8. Confirm the outcome stats update with helpful rate, answered count, average focus, and top helpful action.

Expected result: the follow-up is stored only for the signed-in user's action and is not shown again after submission.

## Privacy Controls Test

1. Open the signed-in dashboard.
2. Go to `Settings`.
3. Toggle mouse analysis off and confirm the mouse panel shows a disabled state and stops updating aggregate mouse samples.
4. Toggle eye analysis off while camera analysis is active and confirm camera tracks stop and the panel returns to disabled.
5. Toggle voice analysis off while microphone analysis is active and confirm the microphone tracks and Web Audio context stop.
6. Toggle simulated cognitive metrics off and confirm metric polling pauses without crashing the dashboard.
7. Confirm the topbar active-sensor indicators update for enabled and disabled streams.
8. Open the privacy explainer and confirm it states that raw pointer coordinates, camera frames, and microphone audio are not persisted.

Expected result: sensor controls are visible, reversible, bilingual, and stop the corresponding collection path.

## Data Export And Delete Test

1. Sign in and generate at least one report or aggregate signal.
2. Click `Export my data`.
3. Confirm a JSON file downloads and contains only the signed-in user's sessions, aggregate signal snapshots, reports, feedback, and audit logs.
4. Click `Delete current session` once and confirm the button asks for confirmation.
5. Click the confirmation button and confirm the current session is deleted without deleting the account.
6. Use a disposable test account for `Delete all my data`.
7. Click `Delete all my data` once and confirm the button asks for confirmation.
8. Click the confirmation button and confirm the account session is cleared and the user is returned to registration.

Expected result: export/delete controls work for authenticated users, are scoped to the current user, and show clear success or error messages.

## Weekly Trends Test

1. Sign in and let the dashboard collect several metric snapshots.
2. Generate or accept at least one action, then save a follow-up outcome when available.
3. Go to `History`.
4. Confirm the weekly trends panel shows average focus, average stability, sessions completed, most common alert, most useful action, and signal quality trend.
5. Click `Refresh trends`.
6. Switch to Persian and confirm the panel remains readable in RTL.

Expected result: the panel loads, handles empty/error states, reads only user-owned data, and remains useful in mock mode.

## Report Generation Test

1. Click `Generate AI Report`.
2. Confirm the modal opens.
3. Confirm timestamp, risk level, metrics, summary, recommendation, and disclaimer appear.
4. Click `Download .txt`.

Expected result: the file downloads with report content and disclaimer.

## Language And RTL Test

1. Click the language switch in the top bar.
2. Confirm the UI changes to Persian.
3. Confirm the document uses `lang="fa"` and `dir="rtl"`.
4. Confirm the sidebar moves to the right, cards stay aligned, and no horizontal overflow appears.
5. Generate a report and confirm the modal content is Persian.

Expected result: English and Persian modes are both usable, readable, and visually polished.

## Feedback Submission Test

Invalid cases:

- Empty name.
- Empty message.
- Invalid email if an email is provided.
- Rating outside 1-5 via API.

Valid case:

- Name: `Judge`
- Email: `judge@example.com`
- Rating: `5`
- Message: meaningful feedback over 10 characters.

Expected result: invalid submissions show clear errors; valid submissions show success.

## API Health Test

Run:

```bash
curl http://localhost:3030/api/health
```

Expected result: JSON with `status`, `service`, `timestamp`, and `database`.

## API Metrics Test

Run:

```bash
curl http://localhost:3030/api/metrics
```

Expected result: realistic metric JSON with focus, cognitive load, fatigue, stress, stability, collapse risk, signal quality, and timestamp.

## API User Export Test

Run with a signed-in cookie:

```bash
curl -b cookies.txt http://localhost:3030/api/user/export
```

Expected result: JSON with `ok: true`, export timestamp, disclaimer, safe user profile, and user-owned data. Without a signed-in cookie the route returns `401`.

## API Delete Current Session Test

Run with a signed-in cookie:

```bash
curl -X DELETE -b cookies.txt http://localhost:3030/api/user/session \
  -H "x-neuroshadow-csrf: $CSRF_TOKEN"
```

Expected result: JSON with `ok: true` and the count of current session records deleted. Without a signed-in cookie the route returns `401`.

## API Delete All Data Test

Run only with a disposable signed-in account:

```bash
curl -X DELETE -b cookies.txt http://localhost:3030/api/user/all-data \
  -H "x-neuroshadow-csrf: $CSRF_TOKEN"
```

Expected result: JSON with `ok: true`, the user-owned records are removed, and subsequent authenticated requests with the same cookie return `401`.

## API Mouse Analysis Test

Run:

```bash
curl -X POST http://localhost:3030/api/mouse-analysis \
  -H "Content-Type: application/json" \
  -H "Cookie: neuroshadow_session=YOUR_SIGNED_IN_SESSION_COOKIE" \
  -H "x-neuroshadow-csrf: YOUR_CSRF_COOKIE_VALUE" \
  -d '{"actionsPerMinute":88,"distancePx":1420,"averageVelocity":315,"idleMs":240,"jitterScore":19,"directionChanges":6,"stabilityScore":82,"confidence":74,"sampleCount":38,"clickCount":2,"wheelCount":1}'
```

Expected result: JSON confirms the aggregate was accepted. In database mode, authenticated requests return `stored: true`; unauthenticated requests return `401`; in mock mode it returns `stored: false` with a clear mock-mode message.

## API Eye Analysis Test

Run:

```bash
curl -X POST http://localhost:3030/api/eye-analysis \
  -H "Content-Type: application/json" \
  -H "Cookie: neuroshadow_session=YOUR_SIGNED_IN_SESSION_COOKIE" \
  -H "x-neuroshadow-csrf: YOUR_CSRF_COOKIE_VALUE" \
  -d '{"trackingQuality":82,"gazeStability":76,"blinkProxy":12,"lightingQuality":88,"motionVariance":16,"focusConsistency":79,"confidence":84,"frameCount":24,"averageLuminance":126,"contrastLevel":34}'
```

Expected result: JSON confirms the aggregate was accepted. In database mode, authenticated requests return `stored: true`; unauthenticated requests return `401`; in mock mode it returns `stored: false` with a clear mock-mode message.

## API Session Review Test

Run:

```bash
curl -X POST http://localhost:3030/api/session-review \
  -H "Content-Type: application/json" \
  -H "Cookie: neuroshadow_session=YOUR_SIGNED_IN_SESSION_COOKIE" \
  -H "x-neuroshadow-csrf: YOUR_CSRF_COOKIE_VALUE" \
  -d '{"metrics":{"focus":78,"cognitiveLoad":56,"fatigue":39,"stress":31,"stability":82,"collapseRisk":17,"signalQuality":94,"timestamp":"2026-05-30T12:00:00.000Z"},"history":[],"language":"en","baselineComplete":true}'
```

Expected result: JSON returns a generated review with summary, strongest signal, best window, weakest window, signal quality, and non-medical action. Authenticated database mode should return `stored: true`.

## API Baseline Test

Run:

```bash
curl -X POST http://localhost:3030/api/baseline/complete \
  -H "Content-Type: application/json" \
  -H "Cookie: neuroshadow_session=YOUR_SIGNED_IN_SESSION_COOKIE" \
  -H "x-neuroshadow-csrf: YOUR_CSRF_COOKIE_VALUE" \
  -d '{"focusSelfReport":4,"energySelfReport":3,"taskDifficulty":3,"distractionLevel":2,"metrics":{"focus":78,"cognitiveLoad":56,"fatigue":39,"stress":31,"stability":82,"collapseRisk":17,"signalQuality":94,"timestamp":"2026-05-31T12:00:00.000Z"},"language":"en"}'
```

Then run:

```bash
curl http://localhost:3030/api/baseline/current \
  -H "Cookie: neuroshadow_session=YOUR_SIGNED_IN_SESSION_COOKIE"
```

Expected result: authenticated database mode returns `stored: true` on completion, then returns the latest user-owned baseline profile. Unauthenticated database requests return `401`; mock mode returns a generated baseline without persistence.

## API Action Recommendation Test

Run:

```bash
curl -X POST http://localhost:3030/api/actions/recommend \
  -H "Content-Type: application/json" \
  -H "Cookie: neuroshadow_session=YOUR_SIGNED_IN_SESSION_COOKIE" \
  -H "x-neuroshadow-csrf: YOUR_CSRF_COOKIE_VALUE" \
  -d '{"metrics":{"focus":58,"cognitiveLoad":78,"fatigue":62,"stress":48,"stability":54,"collapseRisk":36,"signalQuality":91,"timestamp":"2026-05-31T12:00:00.000Z"},"language":"en"}'
```

Expected result: JSON returns one action with `actionType`, `title`, `reason`, `priority`, `followUpAt`, and `disclaimer`. Authenticated database mode should return `stored: true`; mock mode should return `stored: false`.

## API Action Feedback Test

Run after receiving an action id:

```bash
curl -X POST http://localhost:3030/api/actions/feedback \
  -H "Content-Type: application/json" \
  -H "Cookie: neuroshadow_session=YOUR_SIGNED_IN_SESSION_COOKIE" \
  -H "x-neuroshadow-csrf: YOUR_CSRF_COOKIE_VALUE" \
  -d '{"actionId":"ACTION_ID","status":"accepted","focusAfter":4,"energyAfter":3}'
```

Expected result: JSON confirms the feedback was accepted. Invalid status values, out-of-range scores, missing action ids in database mode, or another user's action id should return a clear error.

## API Action Follow-Up Test

Run when an accepted action is due:

```bash
curl http://localhost:3030/api/actions/follow-up?language=en \
  -H "Cookie: neuroshadow_session=YOUR_SIGNED_IN_SESSION_COOKIE"
```

Then save the outcome:

```bash
curl -X POST http://localhost:3030/api/actions/follow-up \
  -H "Content-Type: application/json" \
  -H "Cookie: neuroshadow_session=YOUR_SIGNED_IN_SESSION_COOKIE" \
  -H "x-neuroshadow-csrf: YOUR_CSRF_COOKIE_VALUE" \
  -d '{"actionId":"ACTION_ID","outcome":"helpful","focusAfter":4,"energyAfter":3,"language":"en"}'
```

Expected result: `GET` returns a due action or `null` plus stats. `POST` accepts only accepted user-owned action ids, requires 1-5 focus and energy scores, and returns updated outcome stats.

## API Weekly Trends Test

Run with a signed-in cookie:

```bash
curl http://localhost:3030/api/trends/weekly?language=en \
  -H "Cookie: neuroshadow_session=YOUR_SIGNED_IN_SESSION_COOKIE"
```

Expected result: JSON includes `averageFocusScore`, `averageStabilityScore`, `sessionsCompleted`, `mostCommonAlertType`, `mostUsefulAction`, and a seven-point `signalQualityTrend`. Without authentication in database mode it returns `401`; without a database it returns mock weekly data.

## API Voice Analysis Test

Run:

```bash
curl -X POST http://localhost:3030/api/voice-analysis \
  -H "Content-Type: application/json" \
  -H "Cookie: neuroshadow_session=YOUR_SIGNED_IN_SESSION_COOKIE" \
  -H "x-neuroshadow-csrf: YOUR_CSRF_COOKIE_VALUE" \
  -d '{"volumeLevel":54,"voiceStability":81,"speechActivity":76,"silenceRatio":24,"clarityScore":83,"noiseLevel":18,"toneVariability":21,"confidence":79,"sampleCount":28,"averageRms":71,"spectralCentroid":840}'
```

Expected result: JSON confirms the aggregate was accepted. In database mode, authenticated requests return `stored: true`; unauthenticated requests return `401`; in mock mode it returns `stored: false` with a clear mock-mode message.

## Error Handling Test

1. Temporarily remove or rename `.env`.
2. Restart the app.
3. Open the dashboard.

Expected result: app still runs and shows demo/mock mode messaging.

## Responsive Layout Test

Check:

- Desktop width.
- Tablet width.
- Mobile width.

Expected result: cards stack cleanly, text stays readable, and no core panel is unusable.

## Visual Quality Test

Inspect:

- Spacing.
- Contrast.
- Text fit.
- Brain visualization quality.
- Neural field animation.
- Animation smoothness.
- Hover and action states.

Expected result: premium futuristic research dashboard, not a generic admin template.
