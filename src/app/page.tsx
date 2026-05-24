"use client";

import { type CSSProperties, useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  Brain,
  BrainCircuit,
  CheckCircle2,
  FileText,
  Loader2,
  RefreshCcw,
  ShieldAlert,
  SlidersHorizontal,
  Sparkles,
  Target,
  X,
  Zap,
} from "lucide-react";
import { AboutSection } from "@/components/AboutSection";
import { AiEngineLogs } from "@/components/AiEngineLogs";
import { AlertsPanel } from "@/components/AlertsPanel";
import { CognitiveBrainMap } from "@/components/CognitiveBrainMap";
import { CognitiveTimeline } from "@/components/CognitiveTimeline";
import { ErrorBanner } from "@/components/ErrorBanner";
import { FeedbackForm } from "@/components/FeedbackForm";
import { LiveInputMonitor } from "@/components/LiveInputMonitor";
import { MetricCard } from "@/components/MetricCard";
import { NeuralField } from "@/components/NeuralField";
import { PerformancePrediction } from "@/components/PerformancePrediction";
import { QuickActions } from "@/components/QuickActions";
import { ReportModal } from "@/components/ReportModal";
import { SessionSummary } from "@/components/SessionSummary";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { Toast, type ToastMessage } from "@/components/Toast";
import { UserGuide } from "@/components/UserGuide";
import { UserStatus } from "@/components/UserStatus";
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
import { projectDisclaimer, type GeneratedReport } from "@/lib/reportGenerator";
import { generateSecureToken, getThemeIntensityLabel } from "@/lib/simulation";

type HealthResponse = {
  database: "connected" | "mock";
};

function getMetricStatus(metric: keyof CognitiveMetrics, value: number) {
  if (metric === "focus" || metric === "stability" || metric === "signalQuality") {
    if (value >= 78) return { label: "Good", tone: "good" as const };
    if (value >= 62) return { label: "Moderate", tone: "moderate" as const };
    if (value >= 50) return { label: "Elevated", tone: "elevated" as const };
    return { label: "At Risk", tone: "risk" as const };
  }

  if (value < 25) return { label: "Good", tone: "good" as const };
  if (value < 50) return { label: "Moderate", tone: "moderate" as const };
  if (value < 68) return { label: "Elevated", tone: "elevated" as const };
  if (value < 82) return { label: "At Risk", tone: "risk" as const };
  return { label: "High", tone: "high" as const };
}

function historyPoints(history: CognitiveMetrics[], key: keyof CognitiveMetrics) {
  return history.slice(-14).map((item) => Number(item[key]));
}

export default function Home() {
  const sessionId = "NS-DEMO-001";
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
  const [reportLoading, setReportLoading] = useState(false);
  const [report, setReport] = useState<GeneratedReport | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [themeIntensity, setThemeIntensity] = useState(82);
  const [monitoringActive, setMonitoringActive] = useState(true);
  const [presentationMode, setPresentationMode] = useState(false);
  const [apiPreview, setApiPreview] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [sessionStartedAt, setSessionStartedAt] = useState(() => new Date("2026-01-01T00:00:00.000Z"));
  const secureToken = useMemo(() => generateSecureToken(sessionId), [sessionId]);

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

  const fetchHealth = useCallback(async () => {
    try {
      const response = await fetch("/api/health", { cache: "no-store" });
      if (!response.ok) throw new Error("Health endpoint unavailable.");
      const data = (await response.json()) as HealthResponse;
      setDatabaseMode(data.database);
      setApiError(null);
    } catch (error) {
      setDatabaseMode("mock");
      setApiError(error instanceof Error ? error.message : "Backend health check failed.");
    }
  }, []);

  const fetchMetrics = useCallback(async () => {
    if (!monitoringActive) {
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
    } catch (error) {
      const fallback = generateMetrics();
      setMetrics((current) => {
        const next = blendMetrics(current, fallback, 0.3);
        setHistory((items) => [...items.slice(-39), next]);
        return next;
      });
      setDatabaseMode("mock");
      setApiError(error instanceof Error ? error.message : "Using local fallback metrics.");
      addToast("warning", "Mock fallback active", "Live metrics are using the local simulation engine.");
    } finally {
      setLoadingMetrics(false);
    }
  }, [addToast, monitoringActive, reducedMotion]);

  useEffect(() => {
    const initialFetch = window.setTimeout(() => {
      setCurrentTime(new Date());
      setSessionStartedAt(new Date());
      void fetchHealth();
      void fetchMetrics();
    }, 0);
    const clock = window.setInterval(() => setCurrentTime(new Date()), 1000);
    const metricsTimer = window.setInterval(fetchMetrics, reducedMotion ? 5000 : 2600);
    const healthTimer = window.setInterval(fetchHealth, 12000);
    return () => {
      window.clearTimeout(initialFetch);
      window.clearInterval(clock);
      window.clearInterval(metricsTimer);
      window.clearInterval(healthTimer);
    };
  }, [fetchHealth, fetchMetrics, reducedMotion]);

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
      { title: "Focus Level", key: "focus" as const, icon: <Target size={20} />, value: metrics.focus },
      {
        title: "Cognitive Load",
        key: "cognitiveLoad" as const,
        icon: <BrainCircuit size={20} />,
        value: metrics.cognitiveLoad,
      },
      { title: "Mental Fatigue", key: "fatigue" as const, icon: <Brain size={20} />, value: metrics.fatigue },
      { title: "Stress Probability", key: "stress" as const, icon: <Zap size={20} />, value: metrics.stress },
      {
        title: "Cognitive Stability",
        key: "stability" as const,
        icon: <Activity size={20} />,
        value: metrics.stability,
      },
      {
        title: "Collapse Risk",
        key: "collapseRisk" as const,
        icon: <ShieldAlert size={20} />,
        value: metrics.collapseRisk,
      },
    ],
    [metrics],
  );

  function navigateTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
    setActiveSection(id);
  }

  async function runBaselineScan() {
    setBaselineRunning(true);
    addToast("info", "Baseline scan started", "Synthetic baseline calibration is running.");
    appendLog("Baseline scan requested", "system");
    await new Promise((resolve) => window.setTimeout(resolve, reducedMotion ? 400 : 1600));
    setBaselineComplete(true);
    setBaselineRunning(false);
    addToast("success", "Baseline complete", "Research baseline loaded into the current session.");
    appendLog("Cognitive baseline loaded", "info");
  }

  async function generateAiReport() {
    setReportLoading(true);
    try {
      const response = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: "demo-session", metrics }),
      });
      if (!response.ok) throw new Error("Report endpoint unavailable.");
      const nextReport = (await response.json()) as GeneratedReport;
      setReport(nextReport);
      setReportOpen(true);
      appendLog("Report generated", "info");
      addToast("success", "AI report ready", "The downloadable research report has been generated.");
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Report generation failed.");
      addToast("warning", "Report failed", "The report API did not respond. Try again in demo mode.");
    } finally {
      setReportLoading(false);
    }
  }

  function toggleMonitoring() {
    setMonitoringActive((active) => {
      const next = !active;
      addToast(next ? "success" : "info", next ? "Monitoring resumed" : "Monitoring paused", "Live simulation state updated.");
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
      addToast("success", "Backend API online", "Health and metrics endpoints returned valid JSON.");
    } catch (error) {
      const fallback = { database: "mock", metrics: generateMetrics(), error: error instanceof Error ? error.message : "API failed" };
      setApiPreview(JSON.stringify(fallback, null, 2));
      setDatabaseMode("mock");
      appendLog("Mock API fallback generated", "warning");
      addToast("warning", "API fallback", "Backend test used local simulated data.");
    }
  }

  async function activatePresentationMode() {
    setPresentationMode((active) => !active);
    addToast("info", "Presentation mode", "Layout density adjusted for judge demo.");
    appendLog("Presentation mode toggled", "system");

    if (!document.fullscreenElement) {
      try {
        await document.documentElement.requestFullscreen();
      } catch {
        addToast("warning", "Fullscreen unavailable", "Browser fullscreen was blocked, but presentation layout is active.");
      }
    }
  }

  function resetSession() {
    const next = generateMetrics();
    setMetrics(next);
    setHistory(createMetricHistory(32));
    setBaselineComplete(false);
    setSessionStartedAt(new Date());
    setLogs(generateLogs());
    setAlerts(generateAlerts());
    setApiPreview(null);
    addToast("info", "Session reset", "Metrics, alerts, logs, and baseline status were refreshed.");
    appendLog("Session reset", "system");
  }

  return (
    <main
      className={`app-shell intensity-${getThemeIntensityLabel(themeIntensity).toLowerCase()} ${presentationMode ? "presentation-mode" : ""}`}
      style={{ "--theme-intensity": themeIntensity } as CSSProperties}
    >
      <Sidebar activeSection={activeSection} onNavigate={navigateTo} secureToken={secureToken} databaseMode={databaseMode} />
      <div className="workspace">
        <Topbar
          currentTime={currentTime}
          databaseMode={databaseMode}
          apiError={apiError}
          reducedMotion={reducedMotion}
          sessionId={sessionId}
        />

        <ErrorBanner message={apiError} databaseMode={demoMode ? "mock" : databaseMode} />

        <section className="dashboard-section" id="dashboard" data-nav-section>
          <div className="hero-panel hero-panel--premium">
            <div className="hero-panel__copy">
              <div className="scan-indicator">
                <span />
                Live scan active
              </div>
              <p className="eyebrow">Multi-modal AI • Behavioral Analysis • Predictive Monitoring</p>
              <h2>NEUROSHADOW is analyzing your cognitive patterns in real-time</h2>
              <p>
                Synthetic cognitive signals stream through a transparent research interface built for prediction,
                explainability, and safe competition demonstration.
              </p>
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
            onBaseline={runBaselineScan}
            onToggleMonitoring={toggleMonitoring}
            onReport={generateAiReport}
            onTestApi={testBackendApi}
            onPresentation={activatePresentationMode}
            onGuide={() => navigateTo("user-guide")}
            onFeedback={() => navigateTo("feedback")}
          />

          <section className="panel project-mode-panel">
            <div>
              <p className="eyebrow">Project mode / disclaimer panel</p>
              <h2>{demoMode || databaseMode === "mock" ? "Demo mode active: using simulated cognitive data." : "Database mode active."}</h2>
              <p>{projectDisclaimer}</p>
            </div>
            <div className="project-mode-panel__status">
              <CheckCircle2 size={20} />
              Secure demo session active
            </div>
          </section>

          {loadingMetrics ? <div className="loading-line">Loading live simulated metrics...</div> : null}

          <div className="metric-grid">
            {metricCards.map((card) => {
              const status = getMetricStatus(card.key, card.value);
              return (
                <MetricCard
                  key={card.key}
                  icon={card.icon}
                  title={card.title}
                  value={card.value}
                  status={status.label}
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
                <p className="eyebrow">Baseline</p>
                <h2>Baseline Scan</h2>
              </div>
              <span className="panel__badge">{baselineComplete ? "complete" : "pending"}</span>
            </div>
            <div className="baseline-panel__body">
              <div>
                <p>
                  Run a short simulated baseline to anchor the session. This creates a research-style reference point
                  for the UI and report narrative without claiming real physiological measurement.
                </p>
                <p className="disclaimer-inline">{projectDisclaimer}</p>
              </div>
              <button className="primary-button" type="button" onClick={runBaselineScan} disabled={baselineRunning}>
                {baselineRunning ? <Loader2 className="spin" size={18} /> : <Sparkles size={18} />}
                {baselineRunning ? "Scanning..." : "Run baseline scan"}
              </button>
            </div>
          </div>
        </section>

        <LiveInputMonitor metrics={metrics} />

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
                <p className="eyebrow">Reports</p>
                <h2>Research Report Generator</h2>
              </div>
              <span className="panel__badge">backend API</span>
            </div>
            <p>
              Generate a timestamped .txt report with summary, risk interpretation, key indicators, non-medical action,
              and disclaimer.
            </p>
            <button className="primary-button" type="button" onClick={generateAiReport} disabled={reportLoading}>
              {reportLoading ? <Loader2 className="spin" size={18} /> : <FileText size={18} />}
              {reportLoading ? "Generating report..." : "Generate AI Report"}
            </button>
          </div>
        </section>

        <section className="dashboard-section" id="history" data-nav-section>
          <div className="panel history-panel">
            <div className="panel__header">
              <div>
                <p className="eyebrow">History</p>
                <h2>Recent Metric Snapshots</h2>
              </div>
              <span className="panel__badge">{history.length} retained</span>
            </div>
            <div className="history-table">
              {history.slice(-8).reverse().map((item, index) => (
                <div key={`${item.timestamp}-${item.focus}-${item.cognitiveLoad}-${index}`}>
                  <time>{new Date(item.timestamp).toLocaleTimeString()}</time>
                  <span>Focus {item.focus}%</span>
                  <span>Load {item.cognitiveLoad}%</span>
                  <span>Risk {item.collapseRisk}%</span>
                  <span>Signal {item.signalQuality}%</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="dashboard-section" id="settings" data-nav-section>
          <div className="panel settings-panel">
            <div className="panel__header">
              <div>
                <p className="eyebrow">Settings</p>
                <h2>Demo Controls</h2>
              </div>
              <SlidersHorizontal size={20} />
            </div>
            <div className="settings-grid">
              <label>
                <input type="checkbox" checked={demoMode} onChange={(event) => setDemoMode(event.target.checked)} />
                Demo mode indicator
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={reducedMotion}
                  onChange={(event) => setReducedMotion(event.target.checked)}
                />
                Reduced motion
              </label>
              <label>
                Theme intensity
                <input
                  type="range"
                  min="30"
                  max="100"
                  value={themeIntensity}
                  onChange={(event) => setThemeIntensity(Number(event.target.value))}
                />
                <span>{getThemeIntensityLabel(themeIntensity)}</span>
              </label>
              <button className="secondary-button" type="button" onClick={resetSession}>
                <RefreshCcw size={18} />
                Reset session
              </button>
            </div>
          </div>
        </section>

        <AboutSection />
        <UserGuide />
        <FeedbackForm onResult={(type, title, toastMessage) => addToast(type, title, toastMessage)} />

        <footer className="app-footer">
          <strong>Scientific and ethical disclaimer</strong>
          <span>{projectDisclaimer}</span>
        </footer>
      </div>

      {apiPreview ? (
        <div className="modal-backdrop" role="presentation">
          <section className="report-modal api-preview-modal" role="dialog" aria-modal="true" aria-labelledby="api-preview-title">
            <div className="report-modal__header">
              <div>
                <p className="eyebrow">Backend API test</p>
                <h2 id="api-preview-title">Live JSON Response</h2>
              </div>
              <button className="icon-button" type="button" onClick={() => setApiPreview(null)} aria-label="Close API preview">
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
  );
}
