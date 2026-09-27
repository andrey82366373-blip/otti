/**
 * Проверка ответа на задание. Одна и та же функция работает в браузере
 * (мгновенная проверка) и на сервере (перепроверка перед начислением XP).
 */
import type { Exercise, Skill } from "@/content/course/types";
import {
  isNearMiss,
  matchesAccepted,
  matchesPatterns,
} from "@/lib/answer-check";

/** Ответ ученика — форма зависит от типа задания. */
export type ExerciseAnswer =
  | { kind: "choice"; index: number }
  | { kind: "text"; text: string }
  | { kind: "tiles"; tiles: string[] }
  | { kind: "pairs"; mistakes: number; wrongPairs: string[] };

export type ErrorType = Skill | "spelling";

export type CheckResult = {
  correct: boolean;
  /** Ответ почти правильный — опечатка в 1–2 буквы. */
  nearMiss: boolean;
  /** Правильный ответ в виде текста — для показа ученику. */
  correctAnswer: string;
  /** Ответ ученика в виде текста — для сохранения в базе. */
  userAnswer: string;
  errorType: ErrorType;
};

/** Правильный ответ текстом. */
export function getCorrectAnswerText(exercise: Exercise): string {
  switch (exercise.type) {
    case "choose-translation":
    case "choose-word":
    case "grammar-choice":
      return exercise.options[exercise.answer] ?? "";
    case "fill-blank":
      return exercise.sentence.replace("___", exercise.accepted[0] ?? "");
    case "build-sentence":
      return exercise.accepted[0] ?? "";
    case "match-pairs":
      return exercise.pairs.map((pair) => `${pair.en} — ${pair.ru}`).join(", ");
    case "translate-phrase":
      return exercise.accepted[0] ?? "";
    case "short-answer":
    case "tutor-reply":
      return exercise.sample;
  }
}

function answerToText(answer: ExerciseAnswer, exercise: Exercise): string {
  switch (answer.kind) {
    case "choice":
      return "options" in exercise ? (exercise.options[answer.index] ?? "") : "";
    case "text":
      return answer.text.trim();
    case "tiles":
      return answer.tiles.join(" ");
    case "pairs":
      return answer.wrongPairs.length ? `Ошибки: ${answer.wrongPairs.join("; ")}` : "Без ошибок";
  }
}

/** Проверяет ответ на задание. */
export function checkExercise(exercise: Exercise, answer: ExerciseAnswer): CheckResult {
  const correctAnswer = getCorrectAnswerText(exercise);
  const userAnswer = answerToText(answer, exercise);
  let correct = false;
  let nearMiss = false;

  switch (exercise.type) {
    case "choose-translation":
    case "choose-word":
    case "grammar-choice":
      correct = answer.kind === "choice" && answer.index === exercise.answer;
      break;

    case "fill-blank":
    case "translate-phrase":
      if (answer.kind === "text") {
        correct = matchesAccepted(answer.text, exercise.accepted);
        nearMiss = !correct && isNearMiss(answer.text, exercise.accepted);
      }
      break;

    case "build-sentence":
      correct = answer.kind === "tiles" && matchesAccepted(answer.tiles.join(" "), exercise.accepted);
      break;

    case "match-pairs":
      correct = answer.kind === "pairs" && answer.mistakes === 0;
      break;

    case "short-answer":
    case "tutor-reply":
      correct = answer.kind === "text" && matchesPatterns(answer.text, exercise.patterns);
      break;
  }

  return {
    correct,
    nearMiss,
    correctAnswer,
    userAnswer,
    errorType: nearMiss ? "spelling" : exercise.skill,
  };
}

/** Сколько раз можно ответить на задание, прежде чем урок пойдёт дальше. */
export const MAX_ATTEMPTS = 3;
