# Scientific Sources and Research Concepts

NEUROSHADOW is inspired by cognitive-science and human-performance research concepts, but the current app uses simulated data only.

> NEUROSHADOW is an educational and research demonstration. It uses simulated data and does not provide medical diagnosis, treatment, or health recommendations.

## Cognitive Load

Cognitive load theory describes limits of working memory and how task structure can affect learning and problem solving. The dashboard's `Cognitive Load` metric is a simulated workload pressure signal, not a direct measurement.

Reference:

- Sweller, J. `Cognitive Load During Problem Solving: Effects on Learning`, Cognitive Science, 1988. Public PDF mirrors include [Andy Matuschak's archive](https://andymatuschak.org/files/papers/Sweller%20-%201988%20-%20Cognitive%20load%20during%20problem%20solving.pdf).

## Attention Drift

Sustained attention research discusses vigilance decrement, mind-wandering, and time-on-task effects. NEUROSHADOW simulates attention drift through focus, stability, and alert events.

References:

- [Vigilance decrement and mind-wandering in sustained attention tasks](https://pmc.ncbi.nlm.nih.gov/articles/PMC10086236/)
- [Relationship of Event-Related Potentials to the Vigilance Decrement](https://pmc.ncbi.nlm.nih.gov/articles/PMC5845631/)
- [Examining the Role of Task Requirements in the Magnitude of the Vigilance Decrement](https://pmc.ncbi.nlm.nih.gov/articles/PMC6109784/)

## Fatigue Monitoring

Mental or cognitive fatigue is often studied through sustained task performance, reaction time, variability, subjective fatigue, and performance decline. NEUROSHADOW's fatigue metric is a synthetic trend indicator.

References:

- [Fatigue and Human Performance: An Updated Framework](https://pmc.ncbi.nlm.nih.gov/articles/PMC9807493/)
- [Shared Demands Between Cognitive and Physical Tasks May Drive Negative Effects of Fatigue](https://pmc.ncbi.nlm.nih.gov/articles/PMC7739779/)

## Stress Indicators

Stress detection research can involve physiological and behavioral markers. NEUROSHADOW uses a simulated stress probability value and does not infer real stress.

References:

- [Pain and Stress Detection Using Wearable Sensors and Devices: A Review](https://pmc.ncbi.nlm.nih.gov/articles/PMC7913347/)
- [Stress Markers for Mental States and Biotypes of Depression and Anxiety](https://pmc.ncbi.nlm.nih.gov/articles/PMC8076775/)

## Human Performance Decline

Human performance can vary with time on task, sleep, fatigue, workload, and attention. NEUROSHADOW's decline prediction gauge is a visual simulation of an early-warning concept, not a validated prediction model.

References:

- [Time-on-Task Effect During Sleep Deprivation in Healthy Young Adults](https://pmc.ncbi.nlm.nih.gov/articles/PMC5805243/)
- [Estimating endogenous changes in task performance from EEG](https://pmc.ncbi.nlm.nih.gov/articles/PMC4061490/)

## Behavioral Signal Monitoring

NEUROSHADOW now includes three real browser-side behavioral streams: aggregate mouse analysis, opt-in aggregate eye-frame analysis, and opt-in aggregate voice analysis. Mouse analysis observes pointer movement, clicks, and wheel events in the browser. Eye analysis uses local camera frames only after user permission, crops a small upper-center eye-region proxy, and calculates aggregate indicators such as tracking quality, gaze stability, blink proxy, lighting quality, motion variance, focus consistency, and confidence. Voice analysis uses local microphone samples only after user permission and calculates aggregate indicators such as volume level, voice stability, speech activity, silence ratio, clarity score, noise level, tone variability, and confidence.

This is still not a validated cognitive measurement. Mouse behavior can be influenced by device type, task design, motor habits, screen size, accessibility settings, and user context. Camera-frame eye proxies can be influenced by lighting, camera position, glasses, skin tone, camera quality, privacy settings, and browser support. Microphone aggregate features can be influenced by microphone quality, background noise, language, speaking style, room acoustics, privacy settings, and browser support. The current implementation demonstrates a privacy-aware signal-processing architecture, not a medical or diagnostic model.

Future versions could expand this pattern to opt-in keyboard, richer eye-tracking, richer speech prosody features, wearable, or other behavioral features with consent and validation.

## Non-Medical Action Recommendations

The current action engine is intentionally rule-based and conservative. It suggests small productivity or comfort actions such as taking a short break, reducing multitasking, improving signal quality, switching to a smaller task step, or pausing optional sensors if the user is uncomfortable. These actions are based on general human-computer interaction and workload-management concepts, not medical guidance.

The follow-up loop asks whether a user-performed action helped and captures simple 1-5 focus and energy self-ratings. This is subjective product feedback, not a cognitive diagnosis. The purpose is to make the dashboard useful and explainable while avoiding unsupported claims. A future adaptive system would need explicit consent, stronger validation, and transparent evaluation before recommendations could be personalized beyond simple user feedback.

## Weekly Trend Reflection

The weekly trends panel aggregates the user's own recent sessions, metric snapshots, and action outcomes into a simple seven-day reflection. It is meant to support personal review: average focus, average stability, sessions completed, common alert-like patterns, useful action feedback, and signal quality trend.

This is descriptive product analytics over simulated and aggregate data. It does not predict a health condition, diagnose fatigue, or make clinical claims.

## Personal Baseline Concept

The baseline feature uses a practical within-user comparison idea: a user's current session is easier to interpret when compared against their own recent reference state rather than against a generic population threshold. NEUROSHADOW implements this as a short self-check-in plus current aggregate metrics and latest available mouse, eye, and voice aggregate values. It is a usability and research-demo reference point, not a clinical baseline.

References:

- [A review of physiological and behavioral monitoring with digital sensors](https://pmc.ncbi.nlm.nih.gov/articles/PMC5995114/)
- [Correlation between Unconscious Mouse Actions and Human Cognitive Workload](https://arxiv.org/abs/2204.08559)
- [Eye tracking in human-computer interaction and usability research](https://pmc.ncbi.nlm.nih.gov/articles/PMC4892080/)
- [Cognitive Performance Measurements and the Impact of Sleep Quality Using Wearable and Mobile Sensors](https://arxiv.org/abs/2501.15583)

## Limitation

This app does not collect EEG, wearable, clinical, or medical data. Core cognitive values are synthetic and exist for educational demonstration. The baseline module stores self-check-in answers and aggregate reference values only. The mouse module collects aggregate browser interaction indicators only and does not persist raw coordinates. The eye module processes camera frames locally and stores aggregate indicators only, not images or video. The voice module processes microphone samples locally and stores aggregate indicators only, not audio files, waveforms, transcripts, or speech content.
