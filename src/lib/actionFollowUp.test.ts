import { describe, expect, it } from "vitest";
import { summarizeActionOutcomes } from "./actionFollowUp";

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
