import type { CSSProperties } from "react";

import { seededShuffle } from "@/lib/shuffle";

const COLORS = ["var(--primary)", "var(--river)", "var(--xp)", "var(--streak)", "var(--success)"];

/** Праздничное конфетти после урока: полоски и «капли». Без внешних библиотек. */
export function Confetti({ count = 48 }: { count?: number }) {
  const pieces = Array.from({ length: count }, (_, index) => index);
  const lefts = seededShuffle(pieces, "confetti-left");
  const delays = seededShuffle(pieces, "confetti-delay");

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {pieces.map((index) => {
        const style = {
          left: `${(lefts[index] / count) * 100}%`,
          animationDelay: `${(delays[index] % 12) * 0.08}s`,
          backgroundColor: COLORS[index % COLORS.length],
          "--drift": `${((index % 7) - 3) * 18}px`,
          width: index % 4 === 0 ? 9 : index % 3 === 0 ? 8 : 10,
          height: index % 4 === 0 ? 9 : index % 3 === 0 ? 14 : 8,
        } as CSSProperties;
        return (
          <span
            key={index}
            className={`animate-confetti absolute -top-4 block opacity-0 ${index % 4 === 0 ? "rounded-full" : "rounded-[2px]"}`}
            style={style}
          />
        );
      })}
    </div>
  );
}
