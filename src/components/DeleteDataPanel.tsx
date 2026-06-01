"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "./LanguageProvider";

type DeleteDataPanelProps = {
  deletingCurrent: boolean;
  deletingAll: boolean;
  onDeleteCurrentSession: () => void;
  onDeleteAllData: () => void;
};

export function DeleteDataPanel({
  deletingCurrent,
  deletingAll,
  onDeleteCurrentSession,
  onDeleteAllData,
}: DeleteDataPanelProps) {
  const { t } = useLanguage();
  const [confirmCurrent, setConfirmCurrent] = useState(false);
  const [confirmAll, setConfirmAll] = useState(false);

  return (
    <article className="privacy-action-card privacy-action-card--danger">
      <div>
        <strong>{t.privacy.deleteTitle}</strong>
        <p>{t.privacy.deleteBody}</p>
      </div>
      <div className="privacy-danger-actions">
        <button
          className="secondary-button"
          type="button"
          data-testid="privacy-delete-current"
          onClick={() => {
            if (!confirmCurrent) {
              setConfirmCurrent(true);
              return;
            }
            onDeleteCurrentSession();
            setConfirmCurrent(false);
          }}
          disabled={deletingCurrent || deletingAll}
        >
          {deletingCurrent ? <Loader2 className="spin" size={17} /> : <Trash2 size={17} />}
          {confirmCurrent ? t.privacy.confirmCurrent : t.privacy.deleteCurrent}
        </button>
        <button
          className="secondary-button secondary-button--danger"
          type="button"
          data-testid="privacy-delete-all"
          onClick={() => {
            if (!confirmAll) {
              setConfirmAll(true);
              return;
            }
            onDeleteAllData();
            setConfirmAll(false);
          }}
          disabled={deletingCurrent || deletingAll}
        >
          {deletingAll ? <Loader2 className="spin" size={17} /> : <Trash2 size={17} />}
          {confirmAll ? t.privacy.confirmAll : t.privacy.deleteAll}
        </button>
      </div>
    </article>
  );
}
