"use client";

import { Eye, Mic2, MousePointer2, ShieldCheck, Sparkles, X } from "lucide-react";
import { useState } from "react";
import type { SensorPrivacySettings } from "@/lib/privacy";
import { DataExportPanel } from "./DataExportPanel";
import { DeleteDataPanel } from "./DeleteDataPanel";
import { useLanguage } from "./LanguageProvider";

type PrivacyControlsProps = {
  settings: SensorPrivacySettings;
  exportLoading: boolean;
  deletingCurrent: boolean;
  deletingAll: boolean;
  onChange: (settings: SensorPrivacySettings) => void;
  onExport: () => void;
  onDeleteCurrentSession: () => void;
  onDeleteAllData: () => void;
};

const sensorIcons = {
  mouse: MousePointer2,
  eye: Eye,
  voice: Mic2,
  cognitive: Sparkles,
} as const;

export function PrivacyControls({
  settings,
  exportLoading,
  deletingCurrent,
  deletingAll,
  onChange,
  onExport,
  onDeleteCurrentSession,
  onDeleteAllData,
}: PrivacyControlsProps) {
  const { t } = useLanguage();
  const [explainerOpen, setExplainerOpen] = useState(false);

  function update(key: keyof SensorPrivacySettings, enabled: boolean) {
    onChange({ ...settings, [key]: enabled });
  }

  return (
    <section className="panel privacy-controls-panel" aria-labelledby="privacy-controls-title" data-testid="privacy-controls">
      <div className="panel__header">
        <div>
          <p className="eyebrow">{t.privacy.eyebrow}</p>
          <h2 id="privacy-controls-title">{t.privacy.title}</h2>
        </div>
        <button className="secondary-button" type="button" onClick={() => setExplainerOpen(true)}>
          <ShieldCheck size={17} />
          {t.privacy.explainButton}
        </button>
      </div>

      <div className="privacy-grid">
        {(Object.keys(settings) as Array<keyof SensorPrivacySettings>).map((key) => {
          const Icon = sensorIcons[key];
          return (
            <label className="privacy-toggle-card" key={key}>
              <span>
                <Icon size={20} />
                <strong>{t.privacy.sensors[key]}</strong>
              </span>
              <input
                type="checkbox"
                checked={settings[key]}
                data-testid={`privacy-toggle-${key}`}
                onChange={(event) => update(key, event.target.checked)}
              />
              <small>{settings[key] ? t.privacy.enabled : t.privacy.disabled}</small>
            </label>
          );
        })}
      </div>

      <div className="privacy-actions-grid">
        <DataExportPanel loading={exportLoading} onExport={onExport} />
        <DeleteDataPanel
          deletingCurrent={deletingCurrent}
          deletingAll={deletingAll}
          onDeleteCurrentSession={onDeleteCurrentSession}
          onDeleteAllData={onDeleteAllData}
        />
      </div>

      {explainerOpen ? (
        <div className="modal-backdrop" role="presentation">
          <section className="report-modal privacy-modal" role="dialog" aria-modal="true" aria-labelledby="privacy-modal-title">
            <div className="report-modal__header">
              <div>
                <p className="eyebrow">{t.privacy.explainerEyebrow}</p>
                <h2 id="privacy-modal-title">{t.privacy.explainerTitle}</h2>
              </div>
              <button className="icon-button" type="button" onClick={() => setExplainerOpen(false)} aria-label={t.privacy.closeExplainer}>
                <X size={18} />
              </button>
            </div>
            <div className="privacy-explainer-list">
              {t.privacy.explainerItems.map((item) => (
                <p key={item}>
                  <ShieldCheck size={16} />
                  {item}
                </p>
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}
