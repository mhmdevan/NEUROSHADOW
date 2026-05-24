"use client";

import { Download, X } from "lucide-react";
import type { GeneratedReport } from "@/lib/reportGenerator";

type ReportModalProps = {
  report: GeneratedReport | null;
  isOpen: boolean;
  sessionId: string;
  onClose: () => void;
};

export function ReportModal({ report, isOpen, sessionId, onClose }: ReportModalProps) {
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
            <p className="eyebrow">Generated report</p>
            <h2 id="report-modal-title">NEUROSHADOW AI Report</h2>
            <span className="report-modal__session">{sessionId} • {new Date(report.timestamp).toLocaleString()}</span>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close report modal">
            <X size={18} />
          </button>
        </div>
        <div className="report-modal__summary-grid">
          <article>
            <span>Risk Level</span>
            <strong>{report.riskLevel}</strong>
          </article>
          <article>
            <span>AI Summary</span>
            <p>{report.summary}</p>
          </article>
          <article>
            <span>Recommendation</span>
            <p>{report.recommendation}</p>
          </article>
        </div>
        <div className="report-modal__indicators">
          {report.keyIndicators.map((indicator) => (
            <span key={indicator}>{indicator}</span>
          ))}
        </div>
        <pre>{report.content}</pre>
        <p className="disclaimer-box">{report.disclaimer}</p>
        <div className="report-modal__actions">
          <button className="primary-button" type="button" onClick={downloadReport}>
            <Download size={18} />
            Download .txt
          </button>
          <button className="secondary-button" type="button" onClick={onClose}>
            Close
          </button>
        </div>
      </section>
    </div>
  );
}
