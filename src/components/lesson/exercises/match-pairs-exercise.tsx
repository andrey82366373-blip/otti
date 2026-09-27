"use client";

import { useMemo, useState } from "react";

import { optionStateClass, type ExerciseProps } from "@/components/lesson/exercise-props";
import type { MatchPairsExercise as MatchPairsData } from "@/content/course/types";
import { seededShuffle } from "@/lib/shuffle";
import { cn } from "@/lib/utils";

type Side = "en" | "ru";

/** Соединить английское слово и перевод: нажми на слово слева, затем на перевод справа. */
export function MatchPairsExercise({ exercise, onAnswer, result }: ExerciseProps<MatchPairsData>) {
  const left = useMemo(() => seededShuffle(exercise.pairs, `${exercise.id}-en`), [exercise]);
  const right = useMemo(() => seededShuffle(exercise.pairs, `${exercise.id}-ru`), [exercise]);

  const [matched, setMatched] = useState<string[]>([]); // en-слова, у которых найдена пара
  const [selected, setSelected] = useState<{ side: Side; en: string } | null>(null);
  const [wrong, setWrong] = useState<{ en: string; ruOf: string } | null>(null);
  const [mistakeList, setMistakeList] = useState<string[]>([]);

  function pick(side: Side, en: string) {
    if (result || matched.includes(en) || wrong) return;
    if (!selected || selected.side === side) {
      setSelected({ side, en });
      return;
    }
    // Выбраны слово с одной стороны и перевод с другой
    const leftEn = side === "en" ? en : selected.en;
    const rightEn = side === "ru" ? en : selected.en;
    if (leftEn === rightEn) {
      const next = [...matched, leftEn];
      setMatched(next);
      setSelected(null);
      if (next.length === exercise.pairs.length) {
        onAnswer({ kind: "pairs", mistakes: mistakeList.length, wrongPairs: mistakeList });
      }
    } else {
      const ru = exercise.pairs.find((pair) => pair.en === rightEn)?.ru ?? "";
      setMistakeList([...mistakeList, `${leftEn} — ${ru}`]);
      setWrong({ en: leftEn, ruOf: rightEn });
      setSelected(null);
      window.setTimeout(() => setWrong(null), 600);
    }
  }

  function stateFor(side: Side, en: string): Parameters<typeof optionStateClass>[0] {
    if (matched.includes(en)) return "correct";
    if (wrong && ((side === "en" && wrong.en === en) || (side === "ru" && wrong.ruOf === en))) {
      return "wrong";
    }
    if (selected && selected.side === side && selected.en === en) return "selected";
    return "idle";
  }

  const column = (side: Side, items: typeof left) => (
    <div role="group" aria-label={side === "en" ? "Английские слова" : "Переводы"} className="flex flex-col gap-2.5">
      {items.map((pair) => {
        const state = stateFor(side, pair.en);
        const isMatched = matched.includes(pair.en);
        return (
          <button
            key={`${side}-${pair.en}`}
            type="button"
            lang={side}
            aria-pressed={state === "selected"}
            disabled={isMatched || result !== null}
            onClick={() => pick(side, pair.en)}
            className={cn(
              "min-h-14 rounded-2xl border-2 px-3 py-3 text-center text-lg font-bold transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-default",
              optionStateClass(state),
              state === "wrong" && "animate-shake",
              isMatched && "opacity-70",
            )}
          >
            {side === "en" ? pair.en : pair.ru}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      <p className="text-muted-foreground">
        Нажми на английское слово, а затем на его перевод.
        {mistakeList.length > 0 && !result && (
          <span className="ml-1 font-bold text-destructive">Ошибок: {mistakeList.length}</span>
        )}
      </p>
      <div className="grid grid-cols-2 gap-3">
        {column("en", left)}
        {column("ru", right)}
      </div>
    </div>
  );
}
