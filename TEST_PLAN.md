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

## Dashboard Load Test

1. Run `pnpm dev`.
2. Open `http://localhost:3030`.
3. Confirm the dashboard loads without a blank screen.
4. Confirm the hero, lightweight neural field, metric cards, alerts, logs, timeline, brain map, guide, about, and feedback sections render.

Expected result: the interface is usable and visually polished.

## Metrics Update Test

1. Watch the metric cards for at least 10 seconds.
2. Confirm values update every few seconds.
3. Confirm values drift smoothly and remain in defined ranges.

Expected result: no ugly random jumps or frozen UI.

## Report Generation Test

1. Click `Generate AI Report`.
2. Confirm the modal opens.
3. Confirm timestamp, risk level, metrics, summary, recommendation, and disclaimer appear.
4. Click `Download .txt`.

Expected result: the file downloads with report content and disclaimer.

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
