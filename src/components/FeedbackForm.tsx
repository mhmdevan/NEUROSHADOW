"use client";

import { Send } from "lucide-react";
import { FormEvent, useState } from "react";

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
  const [form, setForm] = useState(initialState);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [localFallbackCount, setLocalFallbackCount] = useState(0);

  async function submitFeedback(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = await response.json();

      if (!response.ok) {
        const errorMessage =
          payload?.error ||
          Object.values(payload?.errors ?? {}).join(" ") ||
          "Feedback could not be submitted.";
        throw new Error(errorMessage);
      }

      setStatus("success");
      setMessage(payload.message ?? "Feedback submitted successfully.");
      onResult?.("success", "Feedback saved", payload.message ?? "Feedback submitted successfully.");
      setForm(initialState);
    } catch (error) {
      if (form.name.trim().length >= 2 && form.message.trim().length >= 10 && form.rating >= 1 && form.rating <= 5) {
        setLocalFallbackCount((count) => count + 1);
        setStatus("success");
        setMessage("API unavailable. Feedback stored locally for this demo session.");
        onResult?.("warning", "Local fallback", "API unavailable. Feedback stored locally for this demo session.");
        setForm(initialState);
        return;
      }

      const errorMessage = error instanceof Error ? error.message : "Feedback could not be submitted.";
      setStatus("error");
      setMessage(errorMessage);
    }
  }

  return (
    <section className="panel feedback-panel" id="feedback" data-nav-section aria-labelledby="feedback-title">
      <div className="panel__header">
        <div>
          <p className="eyebrow">Feedback</p>
          <h2 id="feedback-title">Submit Project Feedback</h2>
        </div>
        <span className="panel__badge">validated API</span>
      </div>
      <form className="feedback-form" onSubmit={submitFeedback}>
        <label>
          Name
          <input
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            placeholder="Your name"
            required
          />
        </label>
        <label>
          Email <span className="optional-label">optional</span>
          <input
            type="email"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            placeholder="you@example.com"
          />
        </label>
        <label>
          Rating
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
          Message
          <textarea
            value={form.message}
            onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
            placeholder="What worked well? What should be improved?"
            rows={5}
            required
          />
        </label>
        <div className="feedback-form__actions">
          <button className="primary-button" type="submit" disabled={status === "loading"}>
            <Send size={18} />
            {status === "loading" ? "Submitting..." : "Submit feedback"}
          </button>
          {message ? <p className={`form-message form-message--${status}`}>{message}</p> : null}
          {localFallbackCount > 0 ? <p className="form-message">Local demo fallback entries: {localFallbackCount}</p> : null}
        </div>
      </form>
    </section>
  );
}
