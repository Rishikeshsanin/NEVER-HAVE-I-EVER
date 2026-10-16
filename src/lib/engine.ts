import { CATEGORIES, type Category, type Heat, type Question, type QuestionSeed } from "./types";

export function makeQuestions(level: Heat, seeds: readonly QuestionSeed[]): Question[] {
  return seeds.map(([category, text, india], index) => ({
    id: "h" + level + "-" + String(index + 1).padStart(3, "0"),
    text: text.startsWith("Never have I ever") ? text : "Never have I ever " + text + ".",
    category, heat: level, ...(india ? { india: true } : {}),
  }));
}

export function filteredQuestions(
  questions: readonly Question[], heat: Heat, category: Category, usedIds: readonly string[] = [],
): Question[] {
  const used = new Set(usedIds);
  return questions.filter((question) => (
    question.heat === heat &&
    !used.has(question.id) &&
    (category === "Mixed" || (category === "India Special" ? question.india : question.category === category))
  ));
}

export function nextQuestion(
  questions: readonly Question[], heat: Heat, category: Category,
  usedIds: readonly string[], random: () => number = Math.random,
): Question | null {
  const pool = filteredQuestions(questions, heat, category, usedIds);
  if (!pool.length) return null;
  const index = Math.min(Math.floor(random() * pool.length), pool.length - 1);
  return pool[index];
}

export function normalizedCustomText(input: string): string {
  let text = input.trim().replace(/\s+/g, " ");
  text = text.replace(/[.!?]+$/, "");
  if (!/^never have i ever\b/i.test(text)) {
    text = "Never have I ever " + text.charAt(0).toLowerCase() + text.slice(1);
  }
  return text + ".";
}

export function validateCustomQuestion(
  raw: string, existing: readonly Question[],
): string | null {
  const cleaned = normalizedCustomText(raw);
  if (raw.trim().length < 8 || cleaned.length < 22) return "Make it a little longer (at least 8 characters).";
  if (cleaned.length > 180) return "Keep it under 180 characters.";
  if (existing.some(q => q.text.toLowerCase() === cleaned.toLowerCase())) {
    return "That question is already in your pack.";
  }
  return null;
}

export function validateLibrary(questions: readonly Question[]): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  const texts = new Set<string>();
  for (const q of questions) {
    if (ids.has(q.id)) errors.push("Duplicate ID: " + q.id);
    ids.add(q.id);
    const value = q.text.toLowerCase().trim();
    if (texts.has(value)) errors.push("Duplicate question: " + q.text);
    texts.add(value);
    if (!/^never have i ever\b/i.test(q.text)) errors.push("Invalid opening: " + q.id);
    if (!CATEGORIES.includes(q.category)) errors.push("Invalid category: " + q.id);
    if (q.text.length < 25 || q.text.length > 180) errors.push("Question length: " + q.id);
  }
  for (const heat of [1,2,3,4,5]) {
    const count = questions.filter(q => q.heat === heat).length;
    if (count < 60) errors.push("Heat " + heat + " has only " + count + " questions");
  }
  return errors;
}
