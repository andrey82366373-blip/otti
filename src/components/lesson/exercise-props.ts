import type { Exercise } from "@/content/course/types";
import type { CheckResult, ExerciseAnswer } from "@/lib/exercise-check";

/** Общие свойства всех заданий в уроке. */
export type ExerciseProps<E extends Exercise> = {
  exercise: E;
  answer: ExerciseAnswer | null;
  onAnswer: (answer: ExerciseAnswer | null) => void;
  /** Результат проверки. null — ещё не проверено. */
  result: CheckResult | null;
};

/** Классы для кнопки-варианта в зависимости от состояния. */
export function optionStateClass(state: "idle" | "selected" | "correct" | "wrong" | "muted") {
  switch (state) {
    case "selected":
      return "border-primary bg-secondary text-secondary-foreground";
    case "correct":
      return "border-success bg-success-soft text-success";
    case "wrong":
      return "border-destructive bg-destructive-soft text-destructive";
    case "muted":
      return "border-border opacity-50";
    default:
      return "border-border bg-card hover:border-primary/40 hover:bg-muted/50";
  }
}
