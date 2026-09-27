/**
 * Проверка ответа в браузере. Ответы «своими словами» (short-answer, tutor-reply),
 * которые не совпали с образцами, дополнительно проверяет ИИ на сервере.
 */
import type { Exercise } from "@/content/course/types";
import { checkOpenAnswer, type OpenAnswerVerdict } from "@/lib/actions/answer-check";
import { checkExercise, type CheckResult, type ExerciseAnswer } from "@/lib/exercise-check";

export type AiNote =
  | { kind: "accepted"; comment: string | null }
  | { kind: "rejected"; comment: string | null; corrected: string | null }
  | { kind: "unavailable"; message: string };

function needsAiCheck(exercise: Exercise, answer: ExerciseAnswer, local: CheckResult): answer is { kind: "text"; text: string } {
  return (
    !local.correct &&
    (exercise.type === "short-answer" || exercise.type === "tutor-reply") &&
    answer.kind === "text" &&
    answer.text.trim() !== ""
  );
}

/** Проверяет ответ; если нужно — спрашивает ИИ. onAiStart вызывается перед запросом к ИИ. */
export async function checkAnswer(
  exercise: Exercise,
  answer: ExerciseAnswer,
  onAiStart?: () => void,
): Promise<{ result: CheckResult; aiNote: AiNote | null }> {
  const local = checkExercise(exercise, answer);
  if (!needsAiCheck(exercise, answer, local)) {
    return { result: local, aiNote: null };
  }

  onAiStart?.();
  let verdict: OpenAnswerVerdict;
  try {
    verdict = await checkOpenAnswer({ exerciseId: exercise.id, text: answer.text });
  } catch {
    verdict = { status: "unavailable", message: "Нет связи с сервером." };
  }

  if (verdict.status === "unavailable") {
    return { result: local, aiNote: { kind: "unavailable", message: verdict.message } };
  }
  if (verdict.status === "correct") {
    return { result: { ...local, correct: true, nearMiss: false }, aiNote: { kind: "accepted", comment: verdict.comment } };
  }
  return { result: local, aiNote: { kind: "rejected", comment: verdict.comment, corrected: verdict.corrected } };
}
