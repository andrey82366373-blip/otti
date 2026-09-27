"use client";

import { useState } from "react";
import { Zap } from "lucide-react";

import { AnimatedNumber } from "@/components/motion/animated-number";
import { StreakFlame } from "@/components/motion/streak-flame";

/** Серия дней и опыт в верхней панели: числа «набегают», новый опыт всплывает «+N». */
export function TopBarStats({
  streak,
  streakActiveToday,
  xp,
}: {
  streak: number;
  streakActiveToday: boolean;
  xp: number;
}) {
  const [prevXp, setPrevXp] = useState(xp);
  const [gain, setGain] = useState<{ amount: number; key: number } | null>(null);
  // Опыт вырос (например, после сообщения в чате) — показываем «+N»
  if (xp !== prevXp) {
    if (xp > prevXp) setGain({ amount: xp - prevXp, key: xp });
    setPrevXp(xp);
  }

  const streakLabel = streakActiveToday
    ? "дней подряд, сегодня цель выполнена"
    : "дней подряд, сегодня цель ещё не выполнена";

  return (
    <>
      <div
        title={streakLabel}
        className="flex items-center gap-1 rounded-full px-1.5 py-1 text-base font-extrabold tabular-nums sm:px-2"
      >
        <StreakFlame streak={streak} active={streakActiveToday} />
        <span className="sr-only">— {streakLabel}</span>
      </div>
      <div
        title="очков опыта (XP)"
        className="relative flex items-center gap-1 rounded-full px-1.5 py-1 text-base font-extrabold tabular-nums sm:px-2"
      >
        <Zap className="size-5 text-xp" aria-hidden />
        <AnimatedNumber value={xp} />
        <span className="sr-only">— очков опыта (XP)</span>
        {gain && (
          <span
            key={gain.key}
            aria-hidden
            className="animate-float-up pointer-events-none absolute -top-1 right-0 rounded-full bg-xp px-1.5 text-xs font-black text-otti-ink opacity-0"
          >
            +{gain.amount}
          </span>
        )}
      </div>
    </>
  );
}
