"use client";

import { type CSSProperties, useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  Brain,
  BrainCircuit,
  CheckCircle2,
  FileText,
  Loader2,
  LogOut,
  RefreshCcw,
  ShieldAlert,
  SlidersHorizontal,
  Target,
  X,
  Zap,
} from "lucide-react";
import { AboutSection } from "@/components/AboutSection";
import { ActionFollowUp, type DueActionFollowUp } from "@/components/ActionFollowUp";
import { ActionRecommendation } from "@/components/ActionRecommendation";
import { AiEngineLogs } from "@/components/AiEngineLogs";
import { AlertsPanel } from "@/components/AlertsPanel";
import { BaselineFlow } from "@/components/BaselineFlow";
import { CognitiveBrainMap } from "@/components/CognitiveBrainMap";
import { CognitiveTimeline } from "@/components/CognitiveTimeline";
import { ErrorBanner } from "@/components/ErrorBanner";
import { FeedbackForm } from "@/components/FeedbackForm";
import { LanguageProvider } from "@/components/LanguageProvider";
import { LiveInputMonitor } from "@/components/LiveInputMonitor";
import { MetricCard } from "@/components/MetricCard";
import { NeuralField } from "@/components/NeuralField";
import { PerformancePrediction } from "@/components/PerformancePrediction";
import { PrivacyControls } from "@/components/PrivacyControls";
import { QuickActions } from "@/components/QuickActions";
import { ReportModal } from "@/components/ReportModal";
import { SessionReviewPanel } from "@/components/SessionReviewPanel";
import { SessionSummary } from "@/components/SessionSummary";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { Toast, type ToastMessage } from "@/components/Toast";
import { UserGuide } from "@/components/UserGuide";
import { UserStatus } from "@/components/UserStatus";
import { WeeklyTrends } from "@/components/WeeklyTrends";
import {
  blendMetrics,
  createInitialMetricHistory,
  createMetricHistory,
  generateAlerts,
  generateLogs,
  initialAlerts,
  initialLogs,
  generateMetrics,
  initialMetrics,
  type AlertItem,
  type CognitiveMetrics,
  type EngineLog,
} from "@/lib/mockData";
import { type BaselineSelfReport, type GeneratedBaselineProfile } from "@/lib/baseline";
import type { ActionOutcomeStats } from "@/lib/actionFollowUp";
import { type GeneratedRecommendedAction, type RecommendedActionStatus } from "@/lib/actionEngine";
import { type GeneratedReport } from "@/lib/reportGenerator";
import { type GeneratedSessionReview } from "@/lib/sessionReview";
import type { WeeklyTrendSummary } from "@/lib/weeklyTrends";
import { generateSecureToken, getThemeIntensityLabel } from "@/lib/simulation";
import { dictionaries, getDirection, getLocale, type Language } from "@/lib/i18n";
import { defaultSensorPrivacySettings, type SensorPrivacySettings } from "@/lib/privacy";
import { secureFetch } from "@/lib/clientSecurity";

type HealthResponse = {
  database: "connected" | "mock";
};

export type DashboardUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  locale: string;
  createdAt: string;
  sessionId: string;
};

function getMetricStatus(metric: keyof CognitiveMetrics, value: number) {
  if (metric === "focus" || metric === "stability" || metric === "signalQuality") {
    if (value >= 78) return { labelKey: "good" as const, tone: "good" as const };
    if (value >= 62) return { labelKey: "moderate" as const, tone: "moderate" as const };
    if (value >= 50) return { labelKey: "elevated" as const, tone: "elevated" as const };
    return { labelKey: "risk" as const, tone: "risk" as const };
  }

  if (value < 25) return { labelKey: "good" as const, tone: "good" as const };
  if (value < 50) return { labelKey: "moderate" as const, tone: "moderate" as const };
  if (value < 68) return { labelKey: "elevated" as const, tone: "elevated" as const };
  if (value < 82) return { labelKey: "risk" as const, tone: "risk" as const };
  return { labelKey: "high" as const, tone: "high" as const };
}

function historyPoints(history: CognitiveMetrics[], key: keyof CognitiveMetrics) {
  return history.slice(-14).map((item) => Number(item[key]));
}

export function DashboardApp({ user }: { user: DashboardUser }) {
  const sessionId = user.sessionId;
  const [language, setLanguage] = useState<Language>(user.locale === "fa" ? "fa" : "en");
  const [metrics, setMetrics] = useState<CognitiveMetrics>(initialMetrics);
  const [history, setHistory] = useState<CognitiveMetrics[]>(() => createInitialMetricHistory(32));
  const [alerts, setAlerts] = useState<AlertItem[]>(initialAlerts);
  const [logs, setLogs] = useState<EngineLog[]>(initialLogs);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [databaseMode, setDatabaseMode] = useState<"connected" | "mock">("mock");
  const [apiError, setApiError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [baselineComplete, setBaselineComplete] = useState(false);
  const [baselineRunning, setBaselineRunning] = useState(false);
  const [baselineLoading, setBaselineLoading] = useState(true);
  const [baselineProfile, setBaselineProfile] = useState<GeneratedBaselineProfile | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [report, setReport] = useState<GeneratedReport | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [sessionReview, setSessionReview] = useState<GeneratedSessionReview | null>(null);
  const [sessionReviewLoading, setSessionReviewLoading] = useState(false);
  const [weeklyTrends, setWeeklyTrends] = useState<WeeklyTrendSummary | null>(null);
  const [weeklyTrendsLoading, setWeeklyTrendsLoading] = useState(true);
  const [weeklyTrendsError, setWeeklyTrendsError] = useState<string | null>(null);
  const [recommendedAction, setRecommendedAction] = useState<GeneratedRecommendedAction | null>(null);
  const [dueActionFollowUp, setDueActionFollowUp] = useState<DueActionFollowUp | null>(null);
  const [actionOutcomeStats, setActionOutcomeStats] = useState<ActionOutcomeStats | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionFeedbackLoading, setActionFeedbackLoading] = useState(false);
  const [actionFollowUpLoading, setActionFollowUpLoading] = useState(false);
  const [actionFollowUpSubmitting, setActionFollowUpSubmitting] = useState(false);
  const [privacySettings, setPrivacySettings] = useState<SensorPrivacySettings>(defaultSensorPrivacySettings);
  const [exportLoading, setExportLoading] = useState(false);
  const [deleteCurrentLoading, setDeleteCurrentLoading] = useState(false);
  const [deleteAllLoading, setDeleteAllLoading] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [themeIntensity, setThemeIntensity] = useState(82);
  const [monitoringActive, setMonitoringActive] = useState(true);
  const [presentationMode, setPresentationMode] = useState(false);
  const [apiPreview, setApiPreview] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [sessionStartedAt, setSessionStartedAt] = useState(() => new Date("2026-01-01T00:00:00.000Z"));
  const secureToken = useMemo(() => generateSecureToken(sessionId), [sessionId]);
  const t = dictionaries[language];
  const direction = getDirection(language);
  const locale = getLocale(language);

  const addToast = useCallback((type: ToastMessage["type"], title: string, message: string) => {
    const id = `${type}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((current) => [...current.slice(-3), { id, type, title, message }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 5200);
  }, []);

  const appendLog = useCallback((message: string, level: EngineLog["level"] = "info") => {
    setLogs((current) => [
      ...current.slice(-7),
      {
        id: `local-log-${Date.now()}-${message}`,
        level,
        message,
        timestamp: new Date().toISOString(),
      },
    ]);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = direction;
  }, [direction, language]);

  useEffect(() => {
    void fetch("/api/auth/csrf", { cache: "no-store" }).catch(() => undefined);
  }, []);

  const fetchHealth = useCallback(async () => {
    try {
      const response = await fetch("/api/health", { cache: "no-store" });
      if (!response.ok) throw new Error("Health endpoint unavailable.");
      const data = (await response.json()) as HealthResponse;
      setDatabaseMode(data.database);
      setApiError(null);
    } catch {
      setDatabaseMode("mock");
      setApiError(t.app.backendFallback);
    }
  }, [t.app.backendFallback]);

  const fetchMetrics = useCallback(async () => {
    if (!monitoringActive || !privacySettings.cognitive) {
      setLoadingMetrics(false);
      return;
    }

    try {
      const response = await fetch("/api/metrics", { cache: "no-store" });
      if (!response.ok) throw new Error("Metrics endpoint unavailable.");
      const incoming = (await response.json()) as CognitiveMetrics;
      setMetrics((current) => {
        const next = blendMetrics(current, incoming, reducedMotion ? 0.55 : 0.32);
        setHistory((items) => [...items.slice(-39), next]);
        return next;
      });
      setApiError(null);
    } catch {
      const fallback = generateMetrics();
      setMetrics((current) => {
        const next = blendMetrics(current, fallback, 0.3);
        setHistory((items) => [...items.slice(-39), next]);
        return next;
      });
      setDatabaseMode("mock");
      setApiError(t.actions.mockFallbackMessage);
      addToast("warning", t.actions.mockFallbackTitle, t.actions.mockFallbackMessage);
    } finally {
      setLoadingMetrics(false);
    }
  }, [
    addToast,
    monitoringActive,
    privacySettings.cognitive,
    reducedMotion,
    t.actions.mockFallbackMessage,
    t.actions.mockFallbackTitle,
  ]);

  const fetchCurrentBaseline = useCallback(async () => {
    try {
      const response = await fetch("/api/baseline/current", { cache: "no-store" });
      if (!response.ok) throw new Error("Baseline endpoint unavailable.");
      const payload = (await response.json()) as { baseline: GeneratedBaselineProfile | null };
      setBaselineProfile(payload.baseline);
      setBaselineComplete(Boolean(payload.baseline));
    } catch {
      setBaselineProfile(null);
      setBaselineComplete(false);
    } finally {
      setBaselineLoading(false);
    }
  }, []);

  const fetchActionFollowUp = useCallback(async () => {
    setActionFollowUpLoading(true);
    try {
      const response = await fetch(`/api/actions/follow-up?language=${language}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Action follow-up endpoint unavailable.");
      const payload = (await response.json()) as { dueAction: DueActionFollowUp | null; stats: ActionOutcomeStats };
      setDueActionFollowUp(payload.dueAction);
      setActionOutcomeStats(payload.stats);
    } catch {
      setDueActionFollowUp(null);
    } finally {
      setActionFollowUpLoading(false);
    }
  }, [language]);

  const fetchWeeklyTrends = useCallback(async () => {
    setWeeklyTrendsLoading(true);
    try {
      const response = await fetch(`/api/trends/weekly?language=${language}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Weekly trends endpoint unavailable.");
      const payload = (await response.json()) as { trends: WeeklyTrendSummary };
      setWeeklyTrends(payload.trends);
      setWeeklyTrendsError(null);
    } catch {
      setWeeklyTrendsError(t.weeklyTrends.failedMessage);
    } finally {
      setWeeklyTrendsLoading(false);
    }
  }, [language, t.weeklyTrends.failedMessage]);

  useEffect(() => {
    const initialFetch = window.setTimeout(() => {
      setCurrentTime(new Date());
      setSessionStartedAt(new Date());
      void fetchHealth();
      void fetchMetrics();
      void fetchCurrentBaseline();
      void fetchActionFollowUp();
      void fetchWeeklyTrends();
    }, 0);
    const clock = window.setInterval(() => setCurrentTime(new Date()), 1000);
    const metricsTimer = window.setInterval(fetchMetrics, reducedMotion ? 5000 : 2600);
    const healthTimer = window.setInterval(fetchHealth, 12000);
    const actionFollowUpTimer = window.setInterval(fetchActionFollowUp, reducedMotion ? 45000 : 15000);
    const weeklyTrendsTimer = window.setInterval(fetchWeeklyTrends, reducedMotion ? 90000 : 60000);
    return () => {
      window.clearTimeout(initialFetch);
      window.clearInterval(clock);
      window.clearInterval(metricsTimer);
      window.clearInterval(healthTimer);
      window.clearInterval(actionFollowUpTimer);
      window.clearInterval(weeklyTrendsTimer);
    };
  }, [fetchActionFollowUp, fetchCurrentBaseline, fetchHealth, fetchMetrics, fetchWeeklyTrends, reducedMotion]);

  useEffect(() => {
    const alertsTimer = window.setInterval(async () => {
      try {
        const response = await fetch("/api/alerts", { cache: "no-store" });
        setAlerts(response.ok ? ((await response.json()) as AlertItem[]) : generateAlerts());
      } catch {
        setAlerts(generateAlerts());
      }
    }, reducedMotion ? 9000 : 6200);

    const logsTimer = window.setInterval(async () => {
      try {
        const response = await fetch("/api/logs", { cache: "no-store" });
        const nextLogs = response.ok ? ((await response.json()) as EngineLog[]) : generateLogs();
        setLogs(nextLogs);
      } catch {
        setLogs(generateLogs());
      }
    }, reducedMotion ? 10000 : 4800);

    return () => {
      window.clearInterval(alertsTimer);
      window.clearInterval(logsTimer);
    };
  }, [reducedMotion]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) {
          setActiveSection(visible.target.id);
        }
      },
      { rootMargin: "-20% 0px -65% 0px", threshold: [0.1, 0.35, 0.65] },
    );

    document.querySelectorAll("[data-nav-section]").forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  const metricCards = useMemo(
    () => [
      { title: t.metrics.focus, key: "focus" as const, icon: <Target size={20} />, value: metrics.focus },
      {
        title: t.metrics.cognitiveLoad,
        key: "cognitiveLoad" as const,
        icon: <BrainCircuit size={20} />,
        value: metrics.cognitiveLoad,
      },
      { title: t.metrics.fatigue, key: "fatigue" as const, icon: <Brain size={20} />, value: metrics.fatigue },
      { title: t.metrics.stress, key: "stress" as const, icon: <Zap size={20} />, value: metrics.stress },
      {
        title: t.metrics.stability,
        key: "stability" as const,
        icon: <Activity size={20} />,
        value: metrics.stability,
      },
      {
        title: t.metrics.collapseRisk,
        key: "collapseRisk" as const,
        icon: <ShieldAlert size={20} />,
        value: metrics.collapseRisk,
      },
    ],
    [metrics, t.metrics.cognitiveLoad, t.metrics.collapseRisk, t.metrics.fatigue, t.metrics.focus, t.metrics.stability, t.metrics.stress],
  );

  function navigateTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
    setActiveSection(id);
  }

  async function runBaselineScan(selfReport: BaselineSelfReport) {
    setBaselineRunning(true);
    addToast("info", t.actions.baselineStartedTitle, t.actions.baselineStartedMessage);
    appendLog("Baseline scan requested", "system");
    try {
      await secureFetch("/api/baseline/start", { method: "POST" });
      await new Promise((resolve) => window.setTimeout(resolve, reducedMotion ? 450 : 1400));
      const response = await secureFetch("/api/baseline/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, metrics, language, ...selfReport }),
      });
      if (!response.ok) throw new Error("Baseline endpoint unavailable.");
      const payload = (await response.json()) as { baseline: GeneratedBaselineProfile };
      setBaselineProfile(payload.baseline);
      setBaselineComplete(true);
      addToast("success", t.actions.baselineCompleteTitle, t.actions.baselineCompleteMessage);
      appendLog("Personal baseline saved", "info");
    } catch {
      setApiError(t.actions.baselineFailedMessage);
      addToast("warning", t.actions.baselineFailedTitle, t.actions.baselineFailedMessage);
    } finally {
      setBaselineRunning(false);
    }
  }

  function runQuickBaselineScan() {
    void runBaselineScan({
      focusSelfReport: 4,
      energySelfReport: 3,
      taskDifficulty: 3,
      distractionLevel: 2,
    });
  }

  async function generateAiReport() {
    setReportLoading(true);
    try {
      const response = await secureFetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: "demo-session", metrics, language }),
      });
      if (!response.ok) throw new Error("Report endpoint unavailable.");
      const nextReport = (await response.json()) as GeneratedReport;
      setReport(nextReport);
      setReportOpen(true);
      appendLog("Report generated", "info");
      addToast("success", t.actions.reportReadyTitle, t.actions.reportReadyMessage);
    } catch {
      setApiError(t.actions.reportFailedMessage);
      addToast("warning", t.actions.reportFailedTitle, t.actions.reportFailedMessage);
    } finally {
      setReportLoading(false);
    }
  }

  async function generateReview() {
    setSessionReviewLoading(true);
    try {
      const response = await secureFetch("/api/session-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          metrics,
          history: history.slice(-40),
          language,
          baselineComplete,
          startedAt: sessionStartedAt.toISOString(),
        }),
      });
      if (!response.ok) throw new Error("Session review endpoint unavailable.");
      const payload = (await response.json()) as { review: GeneratedSessionReview };
      setSessionReview(payload.review);
      appendLog("Session review generated", "info");
      addToast("success", t.sessionReview.readyTitle, t.sessionReview.readyMessage);
    } catch {
      setApiError(t.sessionReview.failedMessage);
      addToast("warning", t.sessionReview.failedTitle, t.sessionReview.failedMessage);
    } finally {
      setSessionReviewLoading(false);
    }
  }

  async function generateActionRecommendation() {
    setActionLoading(true);
    try {
      const response = await secureFetch("/api/actions/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, metrics, language }),
      });
      if (!response.ok) throw new Error("Action endpoint unavailable.");
      const payload = (await response.json()) as { action: GeneratedRecommendedAction };
      setRecommendedAction(payload.action);
      void fetchActionFollowUp();
      appendLog("Action recommendation generated", "system");
      addToast("success", t.actionRecommendation.readyTitle, t.actionRecommendation.readyMessage);
    } catch {
      setApiError(t.actionRecommendation.failedMessage);
      addToast("warning", t.actionRecommendation.failedTitle, t.actionRecommendation.failedMessage);
    } finally {
      setActionLoading(false);
    }
  }

  async function saveActionFeedback(status: Extract<RecommendedActionStatus, "accepted" | "not_useful" | "dismissed" | "not_sure" | "helpful">) {
    if (!recommendedAction) return;
    setActionFeedbackLoading(true);
    try {
      const response = await secureFetch("/api/actions/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionId: recommendedAction.id, status }),
      });
      if (!response.ok) throw new Error("Action feedback endpoint unavailable.");
      setRecommendedAction((current) => (current ? { ...current, status } : current));
      void fetchActionFollowUp();
      appendLog("Action feedback saved", "system");
      addToast("success", t.actionRecommendation.feedbackSavedTitle, t.actionRecommendation.feedbackSavedMessage);
    } catch {
      setApiError(t.actionRecommendation.feedbackFailedMessage);
      addToast("warning", t.actionRecommendation.feedbackFailedTitle, t.actionRecommendation.feedbackFailedMessage);
    } finally {
      setActionFeedbackLoading(false);
    }
  }

  async function saveActionFollowUp(payload: {
    actionId: string;
    outcome: "helpful" | "not_useful" | "not_sure";
    focusAfter: number;
    energyAfter: number;
  }) {
    setActionFollowUpSubmitting(true);
    try {
      const response = await secureFetch("/api/actions/follow-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, language }),
      });
      if (!response.ok) throw new Error("Action follow-up endpoint unavailable.");
      const result = (await response.json()) as { stats: ActionOutcomeStats };
      setDueActionFollowUp(null);
      setActionOutcomeStats(result.stats);
      setRecommendedAction((current) => (current && current.id === payload.actionId ? { ...current, status: payload.outcome } : current));
      void fetchWeeklyTrends();
      appendLog("Action follow-up saved", "system");
      addToast("success", t.actionFollowUp.savedTitle, t.actionFollowUp.savedMessage);
    } catch {
      setApiError(t.actionFollowUp.failedMessage);
      addToast("warning", t.actionFollowUp.failedTitle, t.actionFollowUp.failedMessage);
    } finally {
      setActionFollowUpSubmitting(false);
    }
  }

  function toggleMonitoring() {
    setMonitoringActive((active) => {
      const next = !active;
      addToast(next ? "success" : "info", next ? t.actions.monitoringResumedTitle : t.actions.monitoringPausedTitle, t.actions.monitoringMessage);
      appendLog(next ? "Neural pattern stream active" : "Live monitoring paused", "system");
      return next;
    });
  }

  async function testBackendApi() {
    try {
      const [healthResponse, metricsResponse] = await Promise.all([
        fetch("/api/health", { cache: "no-store" }),
        fetch("/api/metrics", { cache: "no-store" }),
      ]);
      const payload = {
        health: await healthResponse.json(),
        metrics: await metricsResponse.json(),
      };
      setApiPreview(JSON.stringify(payload, null, 2));
      appendLog("API response received", "system");
      addToast("success", t.actions.apiOnlineTitle, t.actions.apiOnlineMessage);
    } catch (error) {
      const fallback = { database: "mock", metrics: generateMetrics(), error: error instanceof Error ? error.message : "API failed" };
      setApiPreview(JSON.stringify(fallback, null, 2));
      setDatabaseMode("mock");
      appendLog("Mock API fallback generated", "warning");
      addToast("warning", t.actions.apiFallbackTitle, t.actions.apiFallbackMessage);
    }
  }

  async function activatePresentationMode() {
    setPresentationMode((active) => !active);
    addToast("info", t.actions.presentationTitle, t.actions.presentationMessage);
    appendLog("Presentation mode toggled", "system");

    if (!document.fullscreenElement) {
      try {
        await document.documentElement.requestFullscreen();
      } catch {
        addToast("warning", t.actions.fullscreenTitle, t.actions.fullscreenMessage);
      }
    }
  }

  function resetSession(showToast = true) {
    const next = generateMetrics();
    setMetrics(next);
    setHistory(createMetricHistory(32));
    setBaselineComplete(Boolean(baselineProfile));
    setSessionStartedAt(new Date());
    setLogs(generateLogs());
    setAlerts(generateAlerts());
    setApiPreview(null);
    if (showToast) {
      addToast("info", t.actions.sessionResetTitle, t.actions.sessionResetMessage);
      appendLog("Session reset", "system");
    }
  }

  async function exportUserData() {
    setExportLoading(true);
    try {
      const response = await secureFetch("/api/user/export", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok || payload?.ok === false) {
        throw new Error(payload?.error ?? "Export failed.");
      }

      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `neuroshadow-data-export-${Date.now()}.json`;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);

      appendLog("User data exported", "system");
      addToast("success", t.privacy.exportReadyTitle, t.privacy.exportReadyMessage);
    } catch {
      setApiError(t.privacy.exportFailedMessage);
      addToast("warning", t.privacy.exportFailedTitle, t.privacy.exportFailedMessage);
    } finally {
      setExportLoading(false);
    }
  }

  async function deleteCurrentSession() {
    setDeleteCurrentLoading(true);
    try {
      const response = await secureFetch("/api/user/session", { method: "DELETE" });
      const payload = await response.json();
      if (!response.ok || payload?.ok === false) {
        throw new Error(payload?.error ?? "Delete failed.");
      }

      resetSession(false);
      void fetchWeeklyTrends();
      appendLog("Current session data deleted", "warning");
      addToast("success", t.privacy.deleteCurrentTitle, t.privacy.deleteCurrentMessage);
    } catch {
      setApiError(t.privacy.deleteFailedMessage);
      addToast("warning", t.privacy.deleteFailedTitle, t.privacy.deleteFailedMessage);
    } finally {
      setDeleteCurrentLoading(false);
    }
  }

  async function deleteAllUserData() {
    setDeleteAllLoading(true);
    try {
      const response = await secureFetch("/api/user/all-data", { method: "DELETE" });
      const payload = await response.json();
      if (!response.ok || payload?.ok === false) {
        throw new Error(payload?.error ?? "Delete failed.");
      }

      appendLog("All user data deleted", "warning");
      addToast("success", t.privacy.deleteAllTitle, t.privacy.deleteAllMessage);
      window.setTimeout(() => {
        window.location.href = "/register";
      }, 900);
    } catch {
      setApiError(t.privacy.deleteFailedMessage);
      addToast("warning", t.privacy.deleteFailedTitle, t.privacy.deleteFailedMessage);
      setDeleteAllLoading(false);
    }
  }

  async function logout() {
    await secureFetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <LanguageProvider language={language}>
      <main
        className={`app-shell dir-${direction} intensity-${getThemeIntensityLabel(themeIntensity).toLowerCase()} ${presentationMode ? "presentation-mode" : ""}`}
        dir={direction}
        lang={language}
        style={{ "--theme-intensity": themeIntensity } as CSSProperties}
      >
      <Sidebar activeSection={activeSection} onNavigate={navigateTo} secureToken={secureToken} databaseMode={databaseMode} />
      <div className="workspace">
        <Topbar
          currentTime={currentTime}
          databaseMode={demoMode ? "mock" : databaseMode}
          apiError={apiError}
          reducedMotion={reducedMotion}
          sessionId={sessionId}
          language={language}
          onLanguageChange={setLanguage}
          sensorSettings={privacySettings}
          user={user}
        />
        <div className="account-strip">
          <span>
            <strong>{t.app.signedInAs}</strong>
            {user.name} · {user.email}
          </span>
          <button className="secondary-button" type="button" onClick={logout}>
            <LogOut size={18} />
            {t.app.logout}
          </button>
        </div>

        <ErrorBanner message={apiError} databaseMode={demoMode ? "mock" : databaseMode} />

        <section className="dashboard-section" id="dashboard" data-nav-section>
          <div className="hero-panel hero-panel--premium">
            <div className="hero-panel__copy">
              <div className="scan-indicator">
                <span />
                {t.hero.scan}
              </div>
              <p className="eyebrow">{t.hero.eyebrow}</p>
              <h2>{t.hero.title}</h2>
              <p>{t.hero.body}</p>
              <div className="neural-wave" aria-hidden="true">
                {Array.from({ length: 36 }, (_, index) => (
                  <i key={index} style={{ animationDelay: `${index * 0.035}s` }} />
                ))}
              </div>
            </div>
            <div className="hero-panel__visual">
              <NeuralField metrics={metrics} reducedMotion={reducedMotion} />
            </div>
          </div>

          <QuickActions
            baselineRunning={baselineRunning}
            reportLoading={reportLoading}
            monitoringActive={monitoringActive}
            onBaseline={runQuickBaselineScan}
            onToggleMonitoring={toggleMonitoring}
            onReport={generateAiReport}
            onTestApi={testBackendApi}
            onPresentation={activatePresentationMode}
            onGuide={() => navigateTo("user-guide")}
            onFeedback={() => navigateTo("feedback")}
          />

          <section className="panel project-mode-panel">
            <div>
              <p className="eyebrow">{t.projectMode.eyebrow}</p>
              <h2>{demoMode || databaseMode === "mock" ? t.mode.demoFull : t.mode.database}</h2>
              <p>{t.projectDisclaimer}</p>
            </div>
            <div className="project-mode-panel__status">
              <CheckCircle2 size={20} />
              {t.app.secureSession}
            </div>
          </section>

          <ActionRecommendation
            action={recommendedAction}
            loading={actionLoading}
            feedbackLoading={actionFeedbackLoading}
            onRecommend={generateActionRecommendation}
            onFeedback={(status) => void saveActionFeedback(status)}
          />

          <ActionFollowUp
            dueAction={dueActionFollowUp}
            stats={actionOutcomeStats}
            loading={actionFollowUpLoading}
            submitting={actionFollowUpSubmitting}
            onRefresh={() => void fetchActionFollowUp()}
            onSubmit={(payload) => void saveActionFollowUp(payload)}
          />

          {loadingMetrics ? <div className="loading-line">{t.metrics.loading}</div> : null}

          <div className="metric-grid">
            {metricCards.map((card) => {
              const status = getMetricStatus(card.key, card.value);
              return (
                <MetricCard
                  key={card.key}
                  icon={card.icon}
                  title={card.title}
                  value={card.value}
                  status={t.status[status.labelKey]}
                  tone={status.tone}
                  points={historyPoints(history, card.key)}
                />
              );
            })}
          </div>

          <div className="dashboard-grid dashboard-grid--main">
            <AlertsPanel alerts={alerts} />
            <PerformancePrediction collapseRisk={metrics.collapseRisk} />
            <UserStatus metrics={metrics} />
            <SessionSummary
              metrics={metrics}
              startedAt={sessionStartedAt}
              currentTime={currentTime ?? sessionStartedAt}
              databaseMode={databaseMode}
              baselineComplete={baselineComplete}
            />
          </div>
        </section>

        <section className="dashboard-section" id="baseline" data-nav-section>
          <div className="panel baseline-panel">
            <div className="panel__header">
              <div>
                <p className="eyebrow">{t.baseline.eyebrow}</p>
                <h2>{t.baseline.title}</h2>
              </div>
              <span className="panel__badge">{baselineComplete ? t.status.complete : t.status.pending}</span>
            </div>
            <BaselineFlow
              metrics={metrics}
              baseline={baselineProfile}
              loading={baselineLoading}
              running={baselineRunning}
              onRun={(selfReport) => void runBaselineScan(selfReport)}
            />
          </div>
        </section>

        <LiveInputMonitor metrics={metrics} sessionId={sessionId} privacySettings={privacySettings} />

        <section className="dashboard-section" id="ai-analysis" data-nav-section>
          <div className="dashboard-grid dashboard-grid--analysis">
            <CognitiveBrainMap metrics={metrics} reducedMotion={reducedMotion} />
            <AiEngineLogs logs={logs} />
          </div>
          <CognitiveTimeline history={history} />
        </section>

        <section className="dashboard-section" id="reports" data-nav-section>
          <div className="panel reports-panel">
            <div className="panel__header">
              <div>
                <p className="eyebrow">{t.reports.eyebrow}</p>
                <h2>{t.reports.title}</h2>
              </div>
              <span className="panel__badge">{t.reports.badge}</span>
            </div>
            <p>{t.reports.body}</p>
            <button className="primary-button" type="button" onClick={generateAiReport} disabled={reportLoading}>
              {reportLoading ? <Loader2 className="spin" size={18} /> : <FileText size={18} />}
              {reportLoading ? t.reports.loading : t.reports.button}
            </button>
          </div>
          <SessionReviewPanel review={sessionReview} loading={sessionReviewLoading} onGenerate={generateReview} />
        </section>

        <section className="dashboard-section" id="history" data-nav-section>
          <div className="panel history-panel">
            <div className="panel__header">
              <div>
                <p className="eyebrow">{t.history.eyebrow}</p>
                <h2>{t.history.title}</h2>
              </div>
              <span className="panel__badge">{history.length} {t.history.retained}</span>
            </div>
            <div className="history-table">
              {history.slice(-8).reverse().map((item, index) => (
                <div key={`${item.timestamp}-${item.focus}-${item.cognitiveLoad}-${index}`}>
                  <time>{new Date(item.timestamp).toLocaleTimeString(locale)}</time>
                  <span>{t.history.focus} {item.focus}%</span>
                  <span>{t.history.load} {item.cognitiveLoad}%</span>
                  <span>{t.history.risk} {item.collapseRisk}%</span>
                  <span>{t.history.signal} {item.signalQuality}%</span>
                </div>
              ))}
            </div>
          </div>
          <WeeklyTrends
            trends={weeklyTrends}
            loading={weeklyTrendsLoading}
            error={weeklyTrendsError}
            onRefresh={() => void fetchWeeklyTrends()}
          />
        </section>

        <section className="dashboard-section" id="settings" data-nav-section>
          <div className="panel settings-panel">
            <div className="panel__header">
              <div>
                <p className="eyebrow">{t.settings.eyebrow}</p>
                <h2>{t.settings.title}</h2>
              </div>
              <SlidersHorizontal size={20} />
            </div>
            <div className="settings-grid">
              <label>
                <input type="checkbox" checked={demoMode} onChange={(event) => setDemoMode(event.target.checked)} />
                {t.settings.demoMode}
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={reducedMotion}
                  onChange={(event) => setReducedMotion(event.target.checked)}
                />
                {t.settings.reducedMotion}
              </label>
              <label>
                {t.settings.themeIntensity}
                <input
                  type="range"
                  min="30"
                  max="100"
                  value={themeIntensity}
                  onChange={(event) => setThemeIntensity(Number(event.target.value))}
                />
                <span>{t.settings.intensity[getThemeIntensityLabel(themeIntensity)]}</span>
              </label>
              <button className="secondary-button" type="button" onClick={() => resetSession()}>
                <RefreshCcw size={18} />
                {t.settings.resetSession}
              </button>
            </div>
          </div>
          <PrivacyControls
            settings={privacySettings}
            exportLoading={exportLoading}
            deletingCurrent={deleteCurrentLoading}
            deletingAll={deleteAllLoading}
            onChange={setPrivacySettings}
            onExport={() => void exportUserData()}
            onDeleteCurrentSession={() => void deleteCurrentSession()}
            onDeleteAllData={() => void deleteAllUserData()}
          />
        </section>

        <AboutSection />
        <UserGuide />
        <FeedbackForm onResult={(type, title, toastMessage) => addToast(type, title, toastMessage)} />

        <footer className="app-footer">
          <strong>{t.footer.title}</strong>
          <span>{t.projectDisclaimer}</span>
        </footer>
      </div>

      {apiPreview ? (
        <div className="modal-backdrop" role="presentation">
          <section className="report-modal api-preview-modal" role="dialog" aria-modal="true" aria-labelledby="api-preview-title">
            <div className="report-modal__header">
              <div>
                <p className="eyebrow">{t.apiPreview.eyebrow}</p>
                <h2 id="api-preview-title">{t.apiPreview.title}</h2>
              </div>
              <button className="icon-button" type="button" onClick={() => setApiPreview(null)} aria-label={t.apiPreview.closeAria}>
                <X size={18} />
              </button>
            </div>
            <pre>{apiPreview}</pre>
          </section>
        </div>
      ) : null}

      <Toast toasts={toasts} onDismiss={(id) => setToasts((current) => current.filter((toast) => toast.id !== id))} />
      <ReportModal report={report} isOpen={reportOpen} sessionId={sessionId} onClose={() => setReportOpen(false)} />
      </main>
    </LanguageProvider>
  );
}
