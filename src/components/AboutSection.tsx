import { BrainCircuit, Cpu, Database, ShieldCheck } from "lucide-react";
import { projectDisclaimer } from "@/lib/reportGenerator";

export function AboutSection() {
  return (
    <section className="panel info-section" id="about" data-nav-section aria-labelledby="about-title">
      <div className="panel__header">
        <div>
          <p className="eyebrow">About</p>
          <h2 id="about-title">NEUROSHADOW</h2>
        </div>
        <span className="panel__badge">competition-ready concept</span>
      </div>
      <div className="info-grid">
        <article>
          <BrainCircuit size={22} />
          <h3>Purpose</h3>
          <p>
            NEUROSHADOW demonstrates how a future AI dashboard could monitor behavioral and cognitive indicators,
            detect instability patterns, and communicate risk transparently before a performance drop.
          </p>
        </article>
        <article>
          <Cpu size={22} />
          <h3>Technology</h3>
          <p>Next.js App Router, TypeScript, React components, API routes, Prisma ORM, SQLite demo fallback, and PostgreSQL-ready architecture.</p>
        </article>
        <article>
          <Database size={22} />
          <h3>Data Layer</h3>
          <p>Sessions, metric snapshots, alerts, generated reports, feedback, and audit events are modeled in Prisma.</p>
        </article>
        <article>
          <ShieldCheck size={22} />
          <h3>Ethics</h3>
          <p>{projectDisclaimer}</p>
        </article>
        <article>
          <BrainCircuit size={22} />
          <h3>Target Users</h3>
          <p>Students, judges, research teams, human-performance labs, and product evaluators exploring safe AI monitoring concepts.</p>
        </article>
      </div>
      <div className="roadmap">
        <h3>Future Roadmap</h3>
        <ul>
          <li>Integrate real opt-in sensor streams from keyboard, mouse, eye tracking, and voice features.</li>
          <li>Add signal processing pipelines for smoothing, artifact rejection, and confidence scoring.</li>
          <li>Train transparent ML models on consented research data and add model cards.</li>
          <li>Build team dashboards, exportable studies, and privacy-preserving analytics.</li>
        </ul>
      </div>
      <p className="team-note">Team placeholder: Research Lead, Full-Stack Engineer, ML Engineer, UX Designer.</p>
    </section>
  );
}
