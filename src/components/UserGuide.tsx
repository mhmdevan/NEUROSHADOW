"use client";

import { useLanguage } from "./LanguageProvider";

export function UserGuide() {
  const { t } = useLanguage();

  return (
    <section className="panel info-section" id="user-guide" data-nav-section aria-labelledby="guide-title">
      <div className="panel__header">
        <div>
          <p className="eyebrow">{t.guide.eyebrow}</p>
          <h2 id="guide-title">{t.guide.title}</h2>
        </div>
        <span className="panel__badge">{t.guide.badge}</span>
      </div>
      <div className="guide-list">
        {t.guide.items.map(([title, text]) => (
          <article key={title}>
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </div>
      <p className="disclaimer-box">{t.projectDisclaimer}</p>
    </section>
  );
}
