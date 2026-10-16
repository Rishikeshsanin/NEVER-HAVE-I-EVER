import { describe, expect, test } from "vitest";
import { QUESTIONS, QUESTION_COUNTS } from "../data";
import { filteredQuestions, nextQuestion, normalizedCustomText, validateCustomQuestion, validateLibrary } from "./engine";

describe("question library", () => {
  test("at least 60 questions at every heat level", () => {
    expect(QUESTION_COUNTS).toHaveLength(5);
    for (const count of QUESTION_COUNTS) expect(count).toBeGreaterThanOrEqual(60);
  });
  test("301+ valid, unique curated questions", () => {
    expect(QUESTIONS.length).toBeGreaterThanOrEqual(300);
    expect(validateLibrary(QUESTIONS)).toEqual([]);
  });
  test("heat and category boundaries are strict", () => {
    for (const heat of [1,2,3,4,5] as const) {
      const pool = filteredQuestions(QUESTIONS, heat, "Mixed");
      expect(pool.every(q => q.heat === heat)).toBe(true);
      const indian = filteredQuestions(QUESTIONS, heat, "India Special");
      expect(indian.every(q => q.india)).toBe(true);
    }
    const friends = filteredQuestions(QUESTIONS, 1, "Friends");
    expect(friends.length).toBeGreaterThan(0);
    expect(friends.every(q => q.category === "Friends")).toBe(true);
    expect(filteredQuestions(QUESTIONS, 3, "After Dark")).toEqual([]);
  });
  test("does not repeat questions in a session", () => {
    const used: string[] = [];
    for (let i = 0; i < QUESTION_COUNTS[0]; i++) {
      const q = nextQuestion(QUESTIONS, 1, "Mixed", used, () => 0);
      expect(q).not.toBeNull();
      used.push(q!.id);
    }
    expect(new Set(used).size).toBe(used.length);
    expect(nextQuestion(QUESTIONS, 1, "Mixed", used)).toBeNull();
  });
  test("category filter and used IDs remain strict after heat switching", () => {
    const used = QUESTIONS.filter(q => q.heat === 2).slice(0, 3).map(q => q.id);
    const q = nextQuestion(QUESTIONS, 2, "College Life", used, () => 0.1);
    expect(q?.heat).toBe(2);
    expect(q?.category).toBe("College Life");
    expect(used).not.toContain(q?.id);
  });
});

describe("custom question validation", () => {
  test("normalizes the question phrase", () => {
    expect(normalizedCustomText("  secretly loved a song!! ")).toBe("Never have I ever secretly loved a song.");
  });
  test("rejects duplicate, tiny, and oversized questions", () => {
    const existing = [{ id: "x", heat: 1 as const, category: "Friends" as const,
      text: "Never have I ever secretly loved a song." }];
    expect(validateCustomQuestion("secretly loved a song", existing)).toContain("already");
    expect(validateCustomQuestion("hi", [])).not.toBeNull();
    expect(validateCustomQuestion("a".repeat(200), [])).not.toBeNull();
    expect(validateCustomQuestion("given a friend an unexpected gift", [])).toBeNull();
  });
});
