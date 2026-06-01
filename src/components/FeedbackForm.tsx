"use client";

import { Send } from "lucide-react";
import { FormEvent, useState } from "react";
import { secureFetch } from "@/lib/clientSecurity";
import { useLanguage } from "./LanguageProvider";

type FeedbackState = {
  name: string;
  email: string;
  rating: number;
  message: string;
};

const initialState: FeedbackState = {
  name: "",
  email: "",
  rating: 5,
  message: "",
};

type FeedbackFormProps = {
  onResult?: (type: "success" | "warning", title: string, message: string) => void;
};

export function FeedbackForm({ onResult }: FeedbackFormProps) {
  const { language, t } = useLanguage();
  const [form, setForm] = useState(initialState);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [localFallbackCount, setLocalFallbackCount] = useState(0);

  async function submitFeedback(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const response = await secureFetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, language }),
      });
      const payload = await response.json();

      if (!response.ok) {
        const errorMessage =
          payload?.error ||
          Object.values(payload?.errors ?? {}).join(" ") ||
          t.feedback.defaultError;
        throw new Error(errorMessage);
      }

      setStatus("success");
      setMessage(payload.message ?? t.feedback.defaultSuccess);
      onResult?.("success", t.feedback.savedTitle, payload.message ?? t.feedback.defaultSuccess);
      setForm(initialState);
    } catch (error) {
      if (form.name.trim().length >= 2 && form.message.trim().length >= 10 && form.rating >= 1 && form.rating <= 5) {
        setLocalFallbackCount((count) => count + 1);
        setStatus("success");
        setMessage(t.feedback.fallback);
        onResult?.("warning", t.feedback.fallbackTitle, t.feedback.fallback);
        setForm(initialState);
        return;
      }

      const errorMessage = error instanceof Error ? error.message : t.feedback.defaultError;
      setStatus("error");
      setMessage(errorMessage);
    }
  }

  return (
    <section className="panel feedback-panel" id="feedback" data-nav-section aria-labelledby="feedback-title">
      <div className="panel__header">
        <div>
          <p className="eyebrow">{t.feedback.eyebrow}</p>
          <h2 id="feedback-title">{t.feedback.title}</h2>
        </div>
        <span className="panel__badge">{t.feedback.badge}</span>
      </div>
      <form className="feedback-form" onSubmit={submitFeedback}>
        <label>
          {t.feedback.name}
          <input
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            placeholder={t.feedback.namePlaceholder}
            required
          />
        </label>
        <label>
          <span className="label-row">
            <span>{t.feedback.email}</span>
            <span className="optional-label">({t.feedback.optional})</span>
          </span>
          <input
            type="email"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            placeholder={t.feedback.emailPlaceholder}
          />
        </label>
        <label>
          {t.feedback.rating}
          <select
            value={form.rating}
            onChange={(event) => setForm((current) => ({ ...current, rating: Number(event.target.value) }))}
          >
            {[5, 4, 3, 2, 1].map((rating) => (
              <option value={rating} key={rating}>
                {rating}
              </option>
            ))}
          </select>
        </label>
        <label className="feedback-form__wide">
          {t.feedback.message}
          <textarea
            value={form.message}
            onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
            placeholder={t.feedback.messagePlaceholder}
            rows={5}
            required
          />
        </label>
        <div className="feedback-form__actions">
          <button className="primary-button" type="submit" disabled={status === "loading"}>
            <Send size={18} />
            {status === "loading" ? t.feedback.submitting : t.feedback.submit}
          </button>
          {message ? <p className={`form-message form-message--${status}`}>{message}</p> : null}
          {localFallbackCount > 0 ? <p className="form-message">{t.feedback.fallbackCount}: {localFallbackCount}</p> : null}
        </div>
      </form>
    </section>
  );
}
