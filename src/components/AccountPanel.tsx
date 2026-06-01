"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Database, Eye, FileText, Gauge, Lightbulb, LogOut, MessageSquare, Mic2, ShieldCheck, UserRound } from "lucide-react";
import { secureFetch } from "@/lib/clientSecurity";
import { getDirection, getLocale, type Language } from "@/lib/i18n";
import type { DashboardUser } from "./DashboardApp";

type Overview = {
  ok: boolean;
  user: DashboardUser;
  counts: {
    sessions: number;
    snapshots: number;
    reports: number;
    feedback: number;
    mouseSignals: number;
    eyeSignals: number;
    voiceSignals: number;
    reviews: number;
    baselines: number;
    actions: number;
  };
  latestReports: Array<{
    id: string;
    summary: string;
    riskLevel: string;
    createdAt: string;
  }>;
};

const copy = {
  en: {
    brandName: "NeuroShadow",
    title: "User Panel",
    subtitle: "Private workspace data for the signed-in researcher.",
    language: "فارسی",
    dashboard: "Back to dashboard",
    logout: "Logout",
    profile: "Profile",
    role: "Role",
    joined: "Joined",
    privacy: "Data separation",
    privacyText:
      "Your metrics, reports, feedback, and audit history are separated from every other account.",
    sessions: "Sessions",
    snapshots: "Metric snapshots",
    reports: "Reports",
    feedback: "Feedback",
    mouseSignals: "Mouse signals",
    eyeSignals: "Eye signals",
    voiceSignals: "Voice signals",
    reviews: "Session reviews",
    baselines: "Baselines",
    actions: "Actions",
    latestReports: "Latest reports",
    emptyReports: "No reports yet. Generate an AI report from the dashboard to populate this panel.",
    loading: "Loading user workspace...",
    disclaimer:
      "NeuroShadow uses simulated data and does not provide medical diagnosis, treatment, or health recommendations.",
  },
  fa: {
    brandName: "نورو شَدو",
    title: "پنل کاربری",
    subtitle: "داده‌های اختصاصی فضای کاری پژوهشگر واردشده.",
    language: "English",
    dashboard: "بازگشت به داشبورد",
    logout: "خروج",
    profile: "پروفایل",
    role: "نقش",
    joined: "تاریخ عضویت",
    privacy: "جداسازی داده",
    privacyText:
      "متریک‌ها، گزارش‌ها، بازخوردها و تاریخچه حساب شما از حساب‌های دیگر جدا نگه داشته می‌شوند.",
    sessions: "نشست‌ها",
    snapshots: "نمونه‌های متریک",
    reports: "گزارش‌ها",
    feedback: "بازخوردها",
    mouseSignals: "سیگنال‌های ماوس",
    eyeSignals: "سیگنال‌های چشم",
    voiceSignals: "سیگنال‌های صدا",
    reviews: "بازبینی‌های نشست",
    baselines: "خط پایه‌ها",
    actions: "اقدام‌ها",
    latestReports: "آخرین گزارش‌ها",
    emptyReports: "هنوز گزارشی وجود ندارد. از داشبورد گزارش هوش مصنوعی تولید کنید تا این پنل پر شود.",
    loading: "در حال بارگذاری فضای کاربری...",
    disclaimer:
      "نورو شَدو از داده‌های شبیه‌سازی‌شده استفاده می‌کند و تشخیص پزشکی، درمان یا توصیه سلامت ارائه نمی‌دهد.",
  },
} as const;

export function AccountPanel({ initialUser }: { initialUser: DashboardUser }) {
  const [language, setLanguage] = useState<Language>("fa");
  const [overview, setOverview] = useState<Overview | null>(null);
  const text = copy[language];
  const direction = getDirection(language);
  const locale = getLocale(language);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = direction;
  }, [direction, language]);

  useEffect(() => {
    void fetch("/api/auth/csrf", { cache: "no-store" }).catch(() => undefined);
  }, []);

  useEffect(() => {
    let mounted = true;
    fetch("/api/user/overview", { cache: "no-store" })
      .then((response) => response.json())
      .then((data: Overview) => {
        if (mounted) setOverview(data);
      })
      .catch(() => {
        if (mounted) setOverview(null);
      });
    return () => {
      mounted = false;
    };
  }, []);

  async function logout() {
    await secureFetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  const user = overview?.user ?? initialUser;
  const counts = overview?.counts ?? {
    sessions: 0,
    snapshots: 0,
    reports: 0,
    feedback: 0,
    mouseSignals: 0,
    eyeSignals: 0,
    voiceSignals: 0,
    reviews: 0,
    baselines: 0,
    actions: 0,
  };

  return (
    <main className={`account-shell dir-${direction}`} dir={direction} lang={language}>
      <section className="account-hero">
        <div>
          <p className="eyebrow">{text.brandName}</p>
          <h1>{text.title}</h1>
          <p>{text.subtitle}</p>
        </div>
        <div className="account-actions">
          <button className="secondary-button" type="button" onClick={() => setLanguage(language === "en" ? "fa" : "en")}>
            {text.language}
          </button>
          <a className="secondary-button" href="/dashboard">
            <ArrowLeft size={18} />
            {text.dashboard}
          </a>
          <button className="secondary-button" type="button" onClick={logout}>
            <LogOut size={18} />
            {text.logout}
          </button>
        </div>
      </section>

      <section className="account-grid">
        <article className="panel account-profile-card">
          <UserRound size={28} />
          <p className="eyebrow">{text.profile}</p>
          <h2>{user.name}</h2>
          <p>{user.email}</p>
          <div>
            <span>{text.role}</span>
            <strong>{user.role}</strong>
          </div>
          <div>
            <span>{text.joined}</span>
            <strong>{new Date(user.createdAt).toLocaleDateString(locale)}</strong>
          </div>
        </article>

        <article className="panel account-privacy-card">
          <ShieldCheck size={28} />
          <p className="eyebrow">{text.privacy}</p>
          <h2>{text.privacy}</h2>
          <p>{text.privacyText}</p>
          <p className="disclaimer-inline">{text.disclaimer}</p>
        </article>
      </section>

      <section className="account-stats">
        {[
          { label: text.sessions, value: counts.sessions, icon: Database },
          { label: text.snapshots, value: counts.snapshots, icon: Gauge },
          { label: text.mouseSignals, value: counts.mouseSignals, icon: Gauge },
          { label: text.eyeSignals, value: counts.eyeSignals, icon: Eye },
          { label: text.voiceSignals, value: counts.voiceSignals, icon: Mic2 },
          { label: text.baselines, value: counts.baselines, icon: Gauge },
          { label: text.actions, value: counts.actions, icon: Lightbulb },
          { label: text.reviews, value: counts.reviews, icon: FileText },
          { label: text.reports, value: counts.reports, icon: FileText },
          { label: text.feedback, value: counts.feedback, icon: MessageSquare },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <article className="panel account-stat" key={item.label}>
              <Icon size={24} />
              <span>{item.label}</span>
              <strong>{new Intl.NumberFormat(locale).format(item.value)}</strong>
            </article>
          );
        })}
      </section>

      <section className="panel account-reports">
        <div className="panel__header">
          <div>
            <p className="eyebrow">{text.latestReports}</p>
            <h2>{text.latestReports}</h2>
          </div>
        </div>
        {!overview ? <p>{text.loading}</p> : null}
        {overview?.latestReports.length === 0 ? <p>{text.emptyReports}</p> : null}
        {overview?.latestReports.map((report) => (
          <article key={report.id}>
            <span>{new Date(report.createdAt).toLocaleString(locale)}</span>
            <strong>{report.riskLevel}</strong>
            <p>{report.summary}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
