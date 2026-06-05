import type { Language } from "./i18n";

export type ActionOutcomeRecord = {
  actionType: string;
  title: string;
  status: string;
  helpful: boolean | null;
  focusAfter: number | null;
  energyAfter: number | null;
};

export type ActionOutcomeStats = {
  totalAnswered: number;
  helpfulCount: number;
  notUsefulCount: number;
  notSureCount: number;
  helpfulRate: number;
  averageFocusAfter: number | null;
  averageEnergyAfter: number | null;
  topActionTitle: string | null;
  summary: string;
};

function average(values: number[]) {
  if (values.length === 0) return null;
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
}

export function summarizeActionOutcomes(actions: ActionOutcomeRecord[], language: Language = "en"): ActionOutcomeStats {
  const answered = actions.filter(
    (action) =>
      (action.status === "helpful" || action.status === "not_useful" || action.status === "not_sure") &&
      action.focusAfter !== null &&
      action.energyAfter !== null,
  );
  const helpful = answered.filter((action) => action.helpful === true);
  const notUseful = answered.filter((action) => action.helpful === false);
  const notSure = answered.filter((action) => action.status === "not_sure");
  const topCounts = new Map<string, { title: string; count: number }>();

  for (const action of helpful) {
    const current = topCounts.get(action.actionType) ?? { title: action.title, count: 0 };
    topCounts.set(action.actionType, { title: current.title, count: current.count + 1 });
  }

  const topAction = Array.from(topCounts.values()).sort((a, b) => b.count - a.count)[0] ?? null;
  const totalAnswered = answered.length;
  const helpfulRate = totalAnswered === 0 ? 0 : Math.round((helpful.length / totalAnswered) * 100);
  const summary =
    language === "fa"
      ? totalAnswered === 0
        ? "هنوز پیگیری پاسخ‌داده‌شده‌ای وجود ندارد."
        : `${helpfulRate}% از پیگیری‌های پاسخ‌داده‌شده مفید گزارش شده‌اند.`
      : totalAnswered === 0
        ? "No answered follow-ups yet."
        : `${helpfulRate}% of answered follow-ups were marked helpful.`;

  return {
    totalAnswered,
    helpfulCount: helpful.length,
    notUsefulCount: notUseful.length,
    notSureCount: notSure.length,
    helpfulRate,
    averageFocusAfter: average(answered.flatMap((action) => (action.focusAfter ? [action.focusAfter] : []))),
    averageEnergyAfter: average(answered.flatMap((action) => (action.energyAfter ? [action.energyAfter] : []))),
    topActionTitle: topAction?.title ?? null,
    summary,
  };
}

export type ActionTypeOutcome = {
  actionType: string;
  helpfulCount: number;
  notUsefulCount: number;
  answered: number;
  helpfulRate: number; // 0..1 over decided (helpful/not-useful) follow-ups
};

// Per-action-type helpful history. The action engine uses this to promote actions a user
// found helpful and demote ones they repeatedly marked not useful. "not sure" is excluded
// because it is not a decisive signal.
export function summarizeOutcomesByActionType(actions: ActionOutcomeRecord[]): Record<string, ActionTypeOutcome> {
  const byType: Record<string, ActionTypeOutcome> = {};

  for (const action of actions) {
    const decided = action.helpful !== null && (action.status === "helpful" || action.status === "not_useful");
    if (!decided) continue;

    const entry =
      byType[action.actionType] ??
      { actionType: action.actionType, helpfulCount: 0, notUsefulCount: 0, answered: 0, helpfulRate: 0 };
    entry.answered += 1;
    if (action.helpful === true) {
      entry.helpfulCount += 1;
    } else {
      entry.notUsefulCount += 1;
    }
    byType[action.actionType] = entry;
  }

  for (const entry of Object.values(byType)) {
    entry.helpfulRate = entry.answered === 0 ? 0 : entry.helpfulCount / entry.answered;
  }

  return byType;
}
