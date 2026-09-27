/**
 * Мини-тест на определение уровня: 10 вопросов от простого к сложному.
 * Правильные ответы хранятся только здесь и проверяются на сервере.
 */
import type { CefrLevel } from "@/lib/learning";

export type PlacementQuestion = {
  id: string;
  level: CefrLevel;
  prompt: string;
  /** Предложение с пропуском или фраза, о которой спрашивают. */
  sentence?: string;
  options: string[];
  /** Номер правильного варианта (с нуля). */
  correct: number;
};

/** Вопрос без правильного ответа — в таком виде он отправляется в браузер. */
export type PublicPlacementQuestion = Omit<PlacementQuestion, "correct">;

export const PLACEMENT_QUESTIONS: PlacementQuestion[] = [
  {
    id: "p1",
    level: "A1",
    prompt: "Выбери слово для пропуска",
    sentence: "She ___ a teacher.",
    options: ["am", "is", "are", "be"],
    correct: 1,
  },
  {
    id: "p2",
    level: "A1",
    prompt: "Как правильно сказать «Мне 20 лет»?",
    options: ["I have 20 years.", "I am 20 years old.", "My age is 20 years old.", "I'm 20 year."],
    correct: 1,
  },
  {
    id: "p3",
    level: "A1",
    prompt: "Выбери слово для пропуска",
    sentence: "___ you like coffee?",
    options: ["Do", "Does", "Are", "Is"],
    correct: 0,
  },
  {
    id: "p4",
    level: "A2",
    prompt: "Выбери слово для пропуска",
    sentence: "Yesterday we ___ to the cinema.",
    options: ["go", "went", "have gone", "goes"],
    correct: 1,
  },
  {
    id: "p5",
    level: "A2",
    prompt: "Выбери слово для пропуска",
    sentence: "There isn't ___ milk in the fridge.",
    options: ["some", "any", "many", "a"],
    correct: 1,
  },
  {
    id: "p6",
    level: "A2",
    prompt: "Выбери правильный вариант",
    sentence: "This book is ___ than that one.",
    options: ["more interesting", "interestinger", "most interesting", "the more interesting"],
    correct: 0,
  },
  {
    id: "p7",
    level: "B1",
    prompt: "Выбери правильный вариант",
    sentence: "If it rains tomorrow, we ___ at home.",
    options: ["stay", "will stay", "would stay", "stayed"],
    correct: 1,
  },
  {
    id: "p8",
    level: "B1",
    prompt: "Выбери слово для пропуска",
    sentence: "I've lived in Moscow ___ 2020.",
    options: ["for", "since", "from", "during"],
    correct: 1,
  },
  {
    id: "p9",
    level: "B2",
    prompt: "Выбери правильный вариант",
    sentence: "I wish I ___ more time to travel.",
    options: ["have", "had", "would have", "will have"],
    correct: 1,
  },
  {
    id: "p10",
    level: "B2",
    prompt: "Выбери правильный вариант",
    sentence: "By the time we arrived, the film ___.",
    options: ["started", "has started", "had already started", "was starting"],
    correct: 2,
  },
];

/** Ответ «Не знаю». */
export const DONT_KNOW = -1;

export type PlacementResult = {
  correct: number;
  total: number;
  level: CefrLevel;
};

/** Вопросы без правильных ответов — для показа в браузере. */
export function getPublicQuestions(): PublicPlacementQuestion[] {
  return PLACEMENT_QUESTIONS.map((question) => ({
    id: question.id,
    level: question.level,
    prompt: question.prompt,
    sentence: question.sentence,
    options: question.options,
  }));
}

/**
 * Считает результат: 0–3 правильных — A1, 4–5 — A2, 6–7 — B1, 8–10 — B2.
 * answers[i] — номер выбранного варианта или DONT_KNOW.
 */
export function gradePlacement(answers: number[]): PlacementResult {
  const correct = PLACEMENT_QUESTIONS.reduce(
    (sum, question, index) => sum + (answers[index] === question.correct ? 1 : 0),
    0,
  );
  const level: CefrLevel = correct >= 8 ? "B2" : correct >= 6 ? "B1" : correct >= 4 ? "A2" : "A1";
  return { correct, total: PLACEMENT_QUESTIONS.length, level };
}
