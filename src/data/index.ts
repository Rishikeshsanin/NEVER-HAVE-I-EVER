import { makeQuestions } from "../lib/engine";
import { chill } from "./chill";
import { funny } from "./funny";
import { juicy } from "./juicy";
import { spicy } from "./spicy";
import { afterDark } from "./after-dark";

export const QUESTIONS = [
  ...makeQuestions(1, chill),
  ...makeQuestions(2, funny),
  ...makeQuestions(3, juicy),
  ...makeQuestions(4, spicy),
  ...makeQuestions(5, afterDark),
];

export const QUESTION_COUNTS = [1,2,3,4,5].map(level => QUESTIONS.filter(q => q.heat === level).length);
