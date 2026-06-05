import { describe, expect, it } from "vitest";
import { summarizeActionOutcomes, summarizeOutcomesByActionType } from "./actionFollowUp";

describe("action follow-up summaries", () => {
  it("calculates helpful rate and top helpful action", () => {
    const stats = summarizeActionOutcomes([
      {
        actionType: "five_minute_break",
        title: "Take a 5 minute cognitive break",
        status: "helpful",
        helpful: true,
        focusAfter: 4,
        energyAfter: 3,
      },
      {
        actionType: "five_minute_break",
        title: "Take a 5 minute cognitive break",
        status: "helpful",
        helpful: true,
        focusAfter: 5,
        energyAfter: 4,
      },
      {
        actionType: "turn_off_notifications",
        title: "Turn off notifications briefly",
        status: "not_useful",
        helpful: false,
        focusAfter: 2,
        energyAfter: 2,
      },
    ]);

    expect(stats.totalAnswered).toBe(3);
    expect(stats.helpfulRate).toBe(67);
    expect(stats.averageFocusAfter).toBe(3.7);
    expect(stats.topActionTitle).toBe("Take a 5 minute cognitive break");
  });

  it("returns Persian empty-state copy", () => {
    const stats = summarizeActionOutcomes([], "fa");

    expect(stats.totalAnswered).toBe(0);
    expect(stats.summary).toContain("هنوز");
  });
});

describe("per-action-type outcomes", () => {
  it("counts decisive outcomes per action type and computes a helpful rate", () => {
    const byType = summarizeOutcomesByActionType([
      { actionType: "five_minute_break", title: "Break", status: "helpful", helpful: true, focusAfter: 4, energyAfter: 3 },
      { actionType: "five_minute_break", title: "Break", status: "not_useful", helpful: false, focusAfter: 2, energyAfter: 2 },
      { actionType: "turn_off_notifications", title: "Notifications", status: "not_sure", helpful: null, focusAfter: 3, energyAfter: 3 },
    ]);

    expect(byType.five_minute_break.answered).toBe(2);
    expect(byType.five_minute_break.helpfulCount).toBe(1);
    expect(byType.five_minute_break.notUsefulCount).toBe(1);
    expect(byType.five_minute_break.helpfulRate).toBe(0.5);
    // "not sure" is not decisive, so it forms no entry
    expect(byType.turn_off_notifications).toBeUndefined();
  });
});
