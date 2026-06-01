"use client";

import { Download, Loader2 } from "lucide-react";
import { useLanguage } from "./LanguageProvider";

type DataExportPanelProps = {
  loading: boolean;
  onExport: () => void;
};

export function DataExportPanel({ loading, onExport }: DataExportPanelProps) {
  const { t } = useLanguage();

  return (
    <article className="privacy-action-card">
      <div>
        <strong>{t.privacy.exportTitle}</strong>
        <p>{t.privacy.exportBody}</p>
      </div>
      <button className="primary-button" type="button" data-testid="privacy-export-data" onClick={onExport} disabled={loading}>
        {loading ? <Loader2 className="spin" size={17} /> : <Download size={17} />}
        {loading ? t.privacy.exporting : t.privacy.exportButton}
      </button>
    </article>
  );
}
