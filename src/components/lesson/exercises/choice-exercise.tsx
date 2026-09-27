"use client";

import { SpeakButton } from "@/components/course/speak-button";
import { BlankSentence } from "@/components/lesson/blank-sentence";
import { optionStateClass, type ExerciseProps } from "@/components/lesson/exercise-props";
import type { ChoiceExercise as ChoiceExerciseData } from "@/content/course/types";
import { cn } from "@/lib/utils";

/** Выбор одного варианта: перевод, слово или грамматическая форма. */
export function ChoiceExercise({
  exercise,
  answer,
  onAnswer,
  result,
}: ExerciseProps<ChoiceExerciseData>) {
  const selected = answer?.kind === "choice" ? answer.index : null;
  const hasBlank = exercise.text.includes("___");
  const checked = result !== null;

  const blankState = !checked ? "idle" : result.correct ? "correct" : "wrong";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        {exercise.textLang === "en" && !hasBlank && <SpeakButton text={exercise.text} />}
        <p
          lang={exercise.textLang}
          className="text-2xl leading-snug font-extrabold break-words md:text-3xl"
        >
          {hasBlank ? (
            <BlankSentence
              text={exercise.text}
              value={selected !== null ? exercise.options[selected] : undefined}
              state={blankState}
            />
          ) : (
            exercise.text
          )}
        </p>
      </div>

      <div
        role="group"
        aria-label="Варианты ответа"
        className={cn("grid gap-2.5", exercise.options.length >= 4 && "sm:grid-cols-2")}
      >
        {exercise.options.map((option, index) => {
          let state: Parameters<typeof optionStateClass>[0] = "idle";
          if (checked) {
            if (index === exercise.answer) state = "correct";
            else if (index === selected) state = "wrong";
            else state = "muted";
          } else if (index === selected) {
            state = "selected";
          }
          return (
            <button
              key={option}
              type="button"
              lang={exercise.optionsLang}
              aria-pressed={selected === index}
              disabled={checked}
              onClick={() => onAnswer({ kind: "choice", index })}
              className={cn(
                "flex min-h-14 items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left text-lg font-bold transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-default",
                optionStateClass(state),
              )}
            >
              <span
                aria-hidden
                className="flex size-7 shrink-0 items-center justify-center rounded-lg border-2 border-current/25 text-sm font-black opacity-70"
              >
                {index + 1}
              </span>
              <span>{option}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
