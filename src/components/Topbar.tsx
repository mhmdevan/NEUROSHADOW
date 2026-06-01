"use client";

import { AlertTriangle, CalendarDays, CheckCircle2, Clock3, LayoutDashboard, ShieldCheck } from "lucide-react";
import { ModeBadge } from "./ModeBadge";
import { languageMeta, type Language } from "@/lib/i18n";
import { sensorSettingsToList, type SensorPrivacySettings } from "@/lib/privacy";
import { useLanguage } from "./LanguageProvider";

type TopbarProps = {
  currentTime: Date | null;
  databaseMode: "connected" | "mock";
  apiError: string | null;
  reducedMotion: boolean;
  sessionId: string;
  language: Language;
  onLanguageChange: (language: Language) => void;
  sensorSettings: SensorPrivacySettings;
  user?: {
    name: string;
    role: string;
  };
};

export function Topbar({
  currentTime,
  databaseMode,
  apiError,
  reducedMotion,
  sessionId,
  language,
  onLanguageChange,
  sensorSettings,
  user,
}: TopbarProps) {
  const { locale, t } = useLanguage();
  const nextLanguage = language === "en" ? "fa" : "en";
  const sensors = sensorSettingsToList(sensorSettings);

  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">{t.app.brandName}</p>
        <h1>{t.app.subtitle}</h1>
        <span className="topbar__subtitle">{t.app.liveStatus}</span>
      </div>
      <div className="topbar__meta">
        <span className="pill">
          <Clock3 size={16} />
          {currentTime
            ? currentTime.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit", second: "2-digit" })
            : t.app.syncing}
        </span>
        <span className="pill">
          <CalendarDays size={16} />
          {currentTime
            ? currentTime.toLocaleDateString(locale, { month: "short", day: "numeric", year: "numeric" })
            : t.app.syncing}
        </span>
        <span className="pill">{sessionId}</span>
        {user ? <span className="pill">{user.name} · {user.role}</span> : null}
        <span className="pill">
          <ShieldCheck size={16} />
          {t.app.researchMode}
        </span>
        <a className="topbar-panel-link" href="/panel">
          <LayoutDashboard size={16} />
          {t.app.userPanel}
        </a>
        <ModeBadge mode={databaseMode} />
        <span className="pill">
          <CheckCircle2 size={16} />
          {reducedMotion ? t.app.reducedMotion : t.app.liveSimulation}
        </span>
        <div className="topbar__sensors" aria-label={t.privacy.activeSensors}>
          {sensors.map((sensor) => (
            <span className={`sensor-pill ${sensor.enabled ? "is-active" : "is-muted"}`} key={sensor.key}>
              <i aria-hidden="true" />
              {t.privacy.sensors[sensor.key]}
              <small>{sensor.enabled ? t.privacy.enabled : t.privacy.disabled}</small>
            </span>
          ))}
        </div>
        <button
          className="language-toggle"
          type="button"
          onClick={() => onLanguageChange(nextLanguage)}
          aria-label={t.languageSwitchAria}
        >
          <span>{languageMeta[language].shortLabel}</span>
          <strong>{t.languageSwitch}</strong>
        </button>
        {apiError ? (
          <span className="pill pill--warning">
            <AlertTriangle size={16} />
            {t.app.backendFallback}
          </span>
        ) : null}
      </div>
    </header>
  );
}
