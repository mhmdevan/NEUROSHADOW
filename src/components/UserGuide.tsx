import { projectDisclaimer } from "@/lib/reportGenerator";

const guide = [
  {
    title: "What the dashboard shows",
    text: "The dashboard visualizes simulated focus, workload, fatigue, stress, stability, collapse risk, signal quality, AI alerts, engine logs, and projected performance decline.",
  },
  {
    title: "How to run baseline scan",
    text: "Use the Baseline section to run a short simulated scan. The baseline does not measure a real person; it anchors the demo session and updates the session summary.",
  },
  {
    title: "How to read metrics",
    text: "Higher focus and stability are positive. Higher cognitive load, fatigue, stress probability, and collapse risk indicate greater simulated pressure.",
  },
  {
    title: "How alerts work",
    text: "Alerts are generated from simulated patterns. They explain why the AI engine would flag drift, instability, recovery, or stress changes.",
  },
  {
    title: "How to generate report",
    text: "Click Generate AI Report in the Reports section. The app calls a backend API route, creates a text report, and lets you download it.",
  },
  {
    title: "What demo mode means",
    text: "Demo mode means the dashboard is using simulated cognitive data. It keeps the project reliable when PostgreSQL or local persistence is unavailable.",
  },
  {
    title: "Limitations",
    text: "All signals are synthetic. The current project demonstrates architecture, UX, data modeling, and responsible framing before real AI integration.",
  },
];

export function UserGuide() {
  return (
    <section className="panel info-section" id="user-guide" data-nav-section aria-labelledby="guide-title">
      <div className="panel__header">
        <div>
          <p className="eyebrow">User Guide</p>
          <h2 id="guide-title">Operating the Dashboard</h2>
        </div>
        <span className="panel__badge">plain English</span>
      </div>
      <div className="guide-list">
        {guide.map((item) => (
          <article key={item.title}>
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </article>
        ))}
      </div>
      <p className="disclaimer-box">{projectDisclaimer}</p>
    </section>
  );
}
