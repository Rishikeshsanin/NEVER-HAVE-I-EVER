export const CATEGORIES = [
  "Mixed", "College Life", "Friends", "Embarrassing Moments", "Crushes",
  "Dating & Relationships", "Secrets", "Social Media", "School Memories",
  "Travel & Adventures", "Savage & Chaos", "After Dark", "India Special",
] as const;

export type Category = (typeof CATEGORIES)[number];
export type Heat = 1 | 2 | 3 | 4 | 5;
export type Mode = "classic" | "endless" | "quickfire" | "custom";

export interface Question {
  id: string;
  text: string;
  heat: Heat;
  category: Category;
  india?: boolean;
  custom?: boolean;
}
export type QuestionSeed = readonly [Exclude<Category, "Mixed" | "India Special">, string, boolean?];

export const HEAT_LEVELS: ReadonlyArray<{
  id: Heat; name: string; emoji: string; subtitle: string; color: string;
}> = [
  { id: 1, name: "CHILL", emoji: "😇", subtitle: "Sweet & innocent", color: "#79e5cc" },
  { id: 2, name: "FUNNY", emoji: "😂", subtitle: "Embarrassing stories", color: "#f8cf6c" },
  { id: 3, name: "JUICY", emoji: "👀", subtitle: "Little secrets", color: "#fda06f" },
  { id: 4, name: "SPICY", emoji: "🌶️", subtitle: "Turn up the heat", color: "#fb667f" },
  { id: 5, name: "AFTER DARK", emoji: "😈", subtitle: "Adults only", color: "#c78cff" },
];

export const MODES: ReadonlyArray<{ id: Mode; name: string; description: string; icon: string }> = [
  { id: "classic", name: "Classic", description: "Ten fingers. Zero filters.", icon: "hand" },
  { id: "endless", name: "Endless", description: "Keep the confessions coming.", icon: "infinity" },
  { id: "quickfire", name: "Quick Fire", description: "Five minutes of chaos.", icon: "zap" },
  { id: "custom", name: "My Questions", description: "Your private question pack.", icon: "pencil" },
];
