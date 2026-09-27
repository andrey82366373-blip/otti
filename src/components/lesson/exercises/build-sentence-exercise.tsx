"use client";

import { useMemo, useState } from "react";

import type { ExerciseProps } from "@/components/lesson/exercise-props";
import type { BuildSentenceExercise as BuildSentenceData } from "@/content/course/types";
import { seededShuffle } from "@/lib/shuffle";
import { cn } from "@/lib/utils";

/** Собрать предложение из слов-карточек. */
export function BuildSentenceExercise({ exercise, onAnswer, result }: ExerciseProps<BuildSentenceData>) {
  // Перемешиваем одинаково на сервере и в браузере; следим, чтобы порядок не совпал с ответом
  const bank = useMemo(() => {
    const shuffled = seededShuffle(exercise.tiles, exercise.id);
    const same = shuffled.every((tile, index) => tile === exercise.tiles[index]);
    return same ? [...shuffled].reverse() : shuffled;
  }, [exercise.id, exercise.tiles]);

  const [chosen, setChosen] = useState<number[]>([]);
  const checked = result !== null;

  function update(next: number[]) {
    setChosen(next);
    onAnswer(next.length ? { kind: "tiles", tiles: next.map((index) => bank[index]) } : null);
  }

  const lineState = !checked ? "idle" : result.correct ? "correct" : "wrong";

  return (
    <div className="flex flex-col gap-6">
      <p className="text-2xl leading-snug font-extrabold md:text-3xl">«{exercise.source}»</p>

      <div
        aria-label="Твоё предложение"
        role="group"
        className={cn(
          "flex min-h-[4.5rem] flex-wrap content-start gap-2 rounded-2xl border-2 border-dashed p-3 transition-colors",
          lineState === "idle" && "border-border",
          lineState === "correct" && "border-success bg-success-soft",
          lineState === "wrong" && "border-destructive bg-destructive-soft",
        )}
      >
        {chosen.length === 0 && (
          <span className="self-center text-muted-foreground">Нажимай на слова ниже по порядку</span>
        )}
        {chosen.map((bankIndex, position) => (
          <button
            key={bankIndex}
            type="button"
            lang="en"
            disabled={checked}
            onClick={() => update(chosen.filter((_, i) => i !== position))}
            aria-label={`Убрать слово ${bank[bankIndex]}`}
            className="animate-pop rounded-xl border-2 border-border bg-card px-3 py-2 text-lg font-bold shadow-[0_2px_0_0_var(--border)] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-default"
          >
            {bank[bankIndex]}
          </button>
        ))}
      </div>

      <div role="group" aria-label="Слова" className="flex flex-wrap justify-center gap-2">
        {bank.map((tile, index) => {
          const used = chosen.includes(index);
          return (
            <button
              key={`${tile}-${index}`}
              type="button"
              lang="en"
              disabled={checked || used}
              onClick={() => update([...chosen, index])}
              aria-label={used ? `${tile} (уже выбрано)` : tile}
              className={cn(
                "rounded-xl border-2 px-3 py-2 text-lg font-bold outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50",
                used
                  ? "border-transparent bg-muted text-transparent"
                  : "border-border bg-card shadow-[0_2px_0_0_var(--border)] hover:border-primary/40 disabled:cursor-default",
              )}
            >
              {tile}
            </button>
          );
        })}
      </div>
    </div>
  );
}
