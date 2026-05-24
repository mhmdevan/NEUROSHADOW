import { describe, expect, it } from "vitest";
import { validateFeedback } from "./validation";

describe("validateFeedback", () => {
  it("rejects invalid feedback", () => {
    const result = validateFeedback({ name: "", email: "bad", message: "tiny", rating: 8 });

    expect(result.valid).toBe(false);
    expect(result.errors.email).toBeTruthy();
    expect(result.errors.rating).toBeTruthy();
  });

  it("accepts valid feedback", () => {
    const result = validateFeedback({
      name: "Judge",
      email: "judge@example.com",
      message: "The upgraded system is visually strong and technically complete.",
      rating: 5,
    });

    expect(result.valid).toBe(true);
    expect(result.data.name).toBe("Judge");
  });
});
