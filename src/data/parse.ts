import type { QuestionSeed } from "../lib/types";

export function seedRows(data: string): QuestionSeed[] {
  return data.trim().split("\n").filter(Boolean).map(row => {
    const [category, text, india] = row.split("|");
    return [category as QuestionSeed[0], text, india === "i"] as const;
  });
}
