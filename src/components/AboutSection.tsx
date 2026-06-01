"use client";

import { BrainCircuit, Cpu, Database, ShieldCheck } from "lucide-react";
import { useLanguage } from "./LanguageProvider";

export function AboutSection() {
  const { t } = useLanguage();

  return (
    <section className="panel info-section" id="about" data-nav-section aria-labelledby="about-title">
      <div className="panel__header">
        <div>
          <p className="eyebrow">{t.about.eyebrow}</p>
          <h2 id="about-title">NEUROSHADOW</h2>
        </div>
        <span className="panel__badge">{t.about.badge}</span>
      </div>
      <div className="info-grid">
        <article>
          <BrainCircuit size={22} />
          <h3>{t.about.purpose}</h3>
          <p>{t.about.purposeText}</p>
        </article>
        <article>
          <Cpu size={22} />
          <h3>{t.about.technology}</h3>
          <p>{t.about.technologyText}</p>
        </article>
        <article>
          <Database size={22} />
          <h3>{t.about.dataLayer}</h3>
          <p>{t.about.dataLayerText}</p>
        </article>
        <article>
          <ShieldCheck size={22} />
          <h3>{t.about.ethics}</h3>
          <p>{t.projectDisclaimer}</p>
        </article>
        <article>
          <BrainCircuit size={22} />
          <h3>{t.about.targetUsers}</h3>
          <p>{t.about.targetUsersText}</p>
        </article>
      </div>
      <div className="roadmap">
        <h3>{t.about.roadmap}</h3>
        <ul>
          {t.about.roadmapItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
      <p className="team-note">{t.about.team}</p>
    </section>
  );
}
