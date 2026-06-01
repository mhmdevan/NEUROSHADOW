import type { Language } from "./i18n";

export type WeeklyMetricSnapshot = {
  focus: number;
  stability: number;
  signalQuality: number;
  cognitiveLoad: number;
  fatigue: number;
  stress: number;
  collapseRisk: number;
  createdAt: string | Date;
};

export type WeeklySessionRecord = {
  createdAt: string | Date;
};

export type WeeklyActionRecord = {
  title: string;
  actionType: string;
  helpful: boolean | null;
  status: string;
  respondedAt: string | Date | null;
};

export type WeeklyTrendPoint = {
  date: string;
  label: string;
  focus: number | null;
  stability: number | null;
  signalQuality: number | null;
  snapshots: number;
};

export type WeeklyTrendSummary = {
  windowStart: string;
  windowEnd: string;
  averageFocusScore: number | null;
  averageStabilityScore: number | null;
  sessionsCompleted: number;
  mostCommonAlertType: {
    type: "stability" | "attention" | "load" | "stress" | "risk" | "signal" | "none";
    label: string;
    count: number;
  };
  mostUsefulAction: {
    title: string;
    count: number;
  } | null;
  signalQualityTrend: WeeklyTrendPoint[];
  summary: string;
  empty: boolean;
};

function toDate(value: string | Date) {
  return value instanceof Date ? value : new Date(value);
}

function isoDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function average(values: number[]) {
  if (values.length === 0) return null;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function localizedAlertLabel(type: WeeklyTrendSummary["mostCommonAlertType"]["type"], language: Language) {
  const labels = {
    en: {
      stability: "Cognitive stability pressure",
      attention: "Attention drift",
      load: "High cognitive load",
      stress: "Stress pressure",
      risk: "Elevated collapse risk",
      signal: "Low signal quality",
      none: "No repeated alert pattern",
    },
    fa: {
      stability: "فشار روی پایداری شناختی",
      attention: "انحراف توجه",
      load: "بار شناختی بالا",
      stress: "فشار استرس",
      risk: "ریسک افت عملکرد بالاتر",
      signal: "کیفیت سیگنال پایین",
      none: "الگوی هشدار تکرارشونده وجود ندارد",
    },
  } satisfies Record<Language, Record<WeeklyTrendSummary["mostCommonAlertType"]["type"], string>>;

  return labels[language][type];
}

function classifySnapshot(snapshot: WeeklyMetricSnapshot): WeeklyTrendSummary["mostCommonAlertType"]["type"] {
  if (snapshot.signalQuality < 55) return "signal";
  if (snapshot.collapseRisk >= 34) return "risk";
  if (snapshot.stability < 58) return "stability";
  if (snapshot.focus < 62 && snapshot.cognitiveLoad >= 62) return "attention";
  if (snapshot.cognitiveLoad >= 76 || snapshot.fatigue >= 64) return "load";
  if (snapshot.stress >= 58) return "stress";
  return "none";
}

function buildDayBuckets(windowStart: Date, windowEnd: Date, snapshots: WeeklyMetricSnapshot[]) {
  const buckets = new Map<string, WeeklyMetricSnapshot[]>();
  const cursor = new Date(windowStart);

  while (cursor <= windowEnd) {
    buckets.set(isoDate(cursor), []);
    cursor.setDate(cursor.getDate() + 1);
  }

  for (const snapshot of snapshots) {
    const key = isoDate(toDate(snapshot.createdAt));
    if (buckets.has(key)) {
      buckets.get(key)?.push(snapshot);
    }
  }

  return Array.from(buckets.entries()).map(([date, items]) => ({
    date,
    label: date.slice(5),
    focus: average(items.map((item) => item.focus)),
    stability: average(items.map((item) => item.stability)),
    signalQuality: average(items.map((item) => item.signalQuality)),
    snapshots: items.length,
  }));
}

function mostUsefulAction(actions: WeeklyActionRecord[]) {
  const counts = new Map<string, { title: string; count: number }>();

  for (const action of actions) {
    if (action.helpful !== true) continue;
    const key = action.actionType || action.title;
    const current = counts.get(key) ?? { title: action.title, count: 0 };
    counts.set(key, { title: current.title, count: current.count + 1 });
  }

  return Array.from(counts.values()).sort((a, b) => b.count - a.count)[0] ?? null;
}

function mostCommonAlert(snapshots: WeeklyMetricSnapshot[], language: Language) {
  const counts = new Map<WeeklyTrendSummary["mostCommonAlertType"]["type"], number>();

  for (const snapshot of snapshots) {
    const type = classifySnapshot(snapshot);
    if (type === "none") continue;
    counts.set(type, (counts.get(type) ?? 0) + 1);
  }

  const top = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0];
  const type = top?.[0] ?? "none";

  return {
    type,
    label: localizedAlertLabel(type, language),
    count: top?.[1] ?? 0,
  };
}

function makeSummary(input: {
  language: Language;
  snapshots: WeeklyMetricSnapshot[];
  averageFocusScore: number | null;
  averageStabilityScore: number | null;
  sessionsCompleted: number;
  mostUsefulActionTitle: string | null;
}) {
  if (input.snapshots.length === 0) {
    return input.language === "fa"
      ? "هنوز داده کافی برای روند هفتگی وجود ندارد. چند نشست زنده اجرا کنید تا این بخش معنی‌دار شود."
      : "Not enough weekly data yet. Run a few live sessions to make this trend view useful.";
  }

  if (input.language === "fa") {
    return `در این بازه ${input.sessionsCompleted} نشست ثبت شده است. میانگین تمرکز ${input.averageFocusScore ?? "-"}% و میانگین پایداری ${input.averageStabilityScore ?? "-"}% است.${
      input.mostUsefulActionTitle ? ` مفیدترین اقدام گزارش‌شده: ${input.mostUsefulActionTitle}.` : ""
    }`;
  }

  return `This window includes ${input.sessionsCompleted} session(s). Average focus is ${input.averageFocusScore ?? "-"}% and average stability is ${input.averageStabilityScore ?? "-"}%.${
    input.mostUsefulActionTitle ? ` Most useful reported action: ${input.mostUsefulActionTitle}.` : ""
  }`;
}

export function generateWeeklyTrends(input: {
  snapshots: WeeklyMetricSnapshot[];
  sessions: WeeklySessionRecord[];
  actions: WeeklyActionRecord[];
  language?: Language;
  now?: Date;
}): WeeklyTrendSummary {
  const language = input.language === "fa" ? "fa" : "en";
  const windowEnd = input.now ?? new Date();
  const windowStart = new Date(windowEnd);
  windowStart.setDate(windowStart.getDate() - 6);
  windowStart.setHours(0, 0, 0, 0);

  const snapshots = input.snapshots.filter((snapshot) => {
    const createdAt = toDate(snapshot.createdAt);
    return createdAt >= windowStart && createdAt <= windowEnd;
  });
  const sessions = input.sessions.filter((session) => {
    const createdAt = toDate(session.createdAt);
    return createdAt >= windowStart && createdAt <= windowEnd;
  });
  const actions = input.actions.filter((action) => {
    if (!action.respondedAt) return false;
    const respondedAt = toDate(action.respondedAt);
    return respondedAt >= windowStart && respondedAt <= windowEnd;
  });
  const usefulAction = mostUsefulAction(actions);
  const averageFocusScore = average(snapshots.map((snapshot) => snapshot.focus));
  const averageStabilityScore = average(snapshots.map((snapshot) => snapshot.stability));

  return {
    windowStart: windowStart.toISOString(),
    windowEnd: windowEnd.toISOString(),
    averageFocusScore,
    averageStabilityScore,
    sessionsCompleted: sessions.length,
    mostCommonAlertType: mostCommonAlert(snapshots, language),
    mostUsefulAction: usefulAction,
    signalQualityTrend: buildDayBuckets(windowStart, windowEnd, snapshots),
    summary: makeSummary({
      language,
      snapshots,
      averageFocusScore,
      averageStabilityScore,
      sessionsCompleted: sessions.length,
      mostUsefulActionTitle: usefulAction?.title ?? null,
    }),
    empty: snapshots.length === 0 && sessions.length === 0 && actions.length === 0,
  };
}

export function generateMockWeeklyTrends(language: Language = "en", now = new Date()): WeeklyTrendSummary {
  const snapshots = Array.from({ length: 28 }, (_, index) => {
    const createdAt = new Date(now);
    createdAt.setDate(now.getDate() - Math.floor(index / 4));
    createdAt.setHours(10 + (index % 4) * 2, 15, 0, 0);
    return {
      focus: Math.round(68 + Math.sin(index * 0.7) * 9),
      stability: Math.round(72 + Math.cos(index * 0.55) * 8),
      signalQuality: Math.round(82 + Math.sin(index * 0.4) * 7),
      cognitiveLoad: Math.round(58 + Math.cos(index * 0.5) * 12),
      fatigue: Math.round(42 + Math.sin(index * 0.33) * 10),
      stress: Math.round(36 + Math.cos(index * 0.37) * 8),
      collapseRisk: Math.round(18 + Math.sin(index * 0.48) * 6),
      createdAt,
    };
  });

  const sessions = Array.from({ length: 4 }, (_, index) => {
    const createdAt = new Date(now);
    createdAt.setDate(now.getDate() - index * 2);
    return { createdAt };
  });

  return generateWeeklyTrends({
    snapshots,
    sessions,
    actions: [
      {
        title: language === "fa" ? "چندوظیفگی را کم کنید" : "Reduce multitasking for 10 minutes",
        actionType: "reduce_multitasking",
        helpful: true,
        status: "helpful",
        respondedAt: now,
      },
    ],
    language,
    now,
  });
}
