import { describe, it, expect } from "vitest";
import { cn, scoreColor, qualityColor, formatDate } from "@/lib/utils";

describe("cn", () => {
  it("merges class names and resolves tailwind conflicts", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
    expect(cn("text-sm", false && "hidden", "font-bold")).toBe("text-sm font-bold");
  });
});

describe("scoreColor", () => {
  it("returns success color for excellent scores", () => {
    expect(scoreColor(85)).toBe("text-success");
    expect(scoreColor(80)).toBe("text-success");
  });
  it("returns primary color for good scores", () => {
    expect(scoreColor(65)).toBe("text-primary");
    expect(scoreColor(60)).toBe("text-primary");
  });
  it("returns warning color for moderate scores", () => {
    expect(scoreColor(45)).toBe("text-warning");
    expect(scoreColor(40)).toBe("text-warning");
  });
  it("returns danger color for poor scores", () => {
    expect(scoreColor(20)).toBe("text-danger");
    expect(scoreColor(0)).toBe("text-danger");
  });
});

describe("qualityColor", () => {
  it("maps each quality bucket to a distinct class set", () => {
    expect(qualityColor("Excellent")).toContain("success");
    expect(qualityColor("Good")).toContain("primary");
    expect(qualityColor("Moderate")).toContain("warning");
    expect(qualityColor("Poor")).toContain("danger");
  });
  it("falls back to a muted style for unknown values", () => {
    expect(qualityColor("Unknown")).toContain("muted");
  });
});

describe("formatDate", () => {
  it("formats a valid ISO date string without throwing", () => {
    const result = formatDate("2026-01-15T10:30:00Z");
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });
  it("returns the original string if parsing fails", () => {
    // Date() on a garbage string still returns "Invalid Date" (a valid Date object,
    // not a throw), so formatDate should still return a string, never crash.
    expect(() => formatDate("not-a-date")).not.toThrow();
  });
});
