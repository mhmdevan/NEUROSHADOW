"use client";

import { Download, X } from "lucide-react";
import type { GeneratedReport } from "@/lib/reportGenerator";
import { useLanguage } from "./LanguageProvider";

type ReportModalProps = {
  report: GeneratedReport | null;
  isOpen: boolean;
  sessionId: string;
  onClose: () => void;
};

export function ReportModal({ report, isOpen, sessionId, onClose }: ReportModalProps) {
  const { direction, locale, t } = useLanguage();

  if (!isOpen || !report) {
    return null;
  }

  const downloadReport = () => {
    const blob = new Blob([report.content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `neuroshadow-report-${report.timestamp.replace(/[:.]/g, "-")}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="report-modal" role="dialog" aria-modal="true" aria-labelledby="report-modal-title">
        <div className="report-modal__header">
          <div>
            <p className="eyebrow">{t.reportModal.eyebrow}</p>
            <h2 id="report-modal-title">{t.reportModal.title}</h2>
            <span className="report-modal__session">{sessionId} • {new Date(report.timestamp).toLocaleString(locale)}</span>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label={t.reportModal.closeAria}>
            <X size={18} />
          </button>
        </div>
        <div className="report-modal__summary-grid">
          <article>
            <span>{t.reportModal.riskLevel}</span>
            <strong>{report.riskLevel === "Low" ? t.status.low : report.riskLevel === "Moderate" ? t.status.moderate : t.status.elevated}</strong>
          </article>
          <article>
            <span>{t.reportModal.aiSummary}</span>
            <p>{report.summary}</p>
          </article>
          <article>
            <span>{t.reportModal.recommendation}</span>
            <p>{report.recommendation}</p>
          </article>
        </div>
        <div className="report-modal__indicators">
          {report.keyIndicators.map((indicator) => {
            const [label, ...valueParts] = indicator.split(": ");
            const value = valueParts.join(": ");

            return (
              <span className="report-modal__indicator" key={indicator}>
                <small>{label}</small>
                {value ? <bdi dir="ltr">{value}</bdi> : null}
              </span>
            );
          })}
        </div>
        <pre dir={direction}>{report.content}</pre>
        <p className="disclaimer-box">{report.disclaimer}</p>
        <div className="report-modal__actions">
          <button className="primary-button" type="button" onClick={downloadReport}>
            <Download size={18} />
            {t.reportModal.download}
          </button>
          <button className="secondary-button" type="button" onClick={onClose}>
            {t.reportModal.close}
          </button>
        </div>
      </section>
    </div>
  );
}
