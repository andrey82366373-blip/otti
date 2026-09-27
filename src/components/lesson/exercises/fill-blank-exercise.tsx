"use client";

import { useState } from "react";
import { Lightbulb } from "lucide-react";

import { BlankSentence } from "@/components/lesson/blank-sentence";
import type { ExerciseProps } from "@/components/lesson/exercise-props";
import { EnglishInput } from "@/components/lesson/exercises/text-input";
import type { FillBlankExercise as FillBlankData } from "@/content/course/types";

/** Вписать пропущенное слово. */
export function FillBlankExercise({ exercise, answer, onAnswer, result }: ExerciseProps<FillBlankData>) {
  const [showHint, setShowHint] = useState(false);
  const text = answer?.kind === "text" ? answer.text : "";
  const state = !result ? "idle" : result.correct ? "correct" : "wrong";

  return (
    <div className="flex flex-col gap-6">
      <p className="text-2xl leading-snug font-extrabold break-words md:text-3xl">
        <BlankSentence text={exercise.sentence} value={text.trim() || undefined} state={state} />
      </p>

      <EnglishInput
        value={text}
        onChange={(value) => onAnswer(value.trim() ? { kind: "text", text: value } : null)}
        disabled={result !== null}
        state={state}
        placeholder="Впиши слово"
        label="Пропущенное слово"
      />

      {exercise.hint && !result && (
        <div>
          {showHint ? (
            <p className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <Lightbulb className="size-4 text-xp" aria-hidden />
              {exercise.hint}
            </p>
          ) : (
            <button
              type="button"
              onClick={() => setShowHint(true)}
              className="flex items-center gap-2 rounded-lg text-sm font-bold text-primary outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <Lightbulb className="size-4" aria-hidden />
              Подсказка
            </button>
          )}
        </div>
      )}
    </div>
  );
}
