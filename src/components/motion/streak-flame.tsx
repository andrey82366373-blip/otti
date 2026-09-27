"use client";

import { useEffect, useState } from "react";
import { Flame } from "lucide-react";

import { AnimatedNumber } from "@/components/motion/animated-number";
import { useFeedbackPrefs } from "@/components/motion/feedback-prefs";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "otti:last-seen-streak";

function readSeen(): number | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw === null ? null : Number.parseInt(raw, 10);
  } catch {
    return null;
  }
}

function writeSeen(value: number) {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(value));
  } catch {
    // без хранилища просто не анимируем в следующий раз
  }
}

/**
 * Огонёк серии дней. Когда серия выросла с прошлого показа — огонёк «вспыхивает»,
 * а число перелистывается (один раз).
 */
export function StreakFlame({
  streak,
  active,
  className,
  iconClassName,
}: {
  streak: number;
  /** Сегодня цель выполнена — огонёк горит. */
  active: boolean;
  className?: string;
  iconClassName?: string;
}) {
  const { play } = useFeedbackPrefs();
  const [grewFrom, setGrewFrom] = useState<number | null>(null);

  useEffect(() => {
    const seen = readSeen();
    writeSeen(streak);
    if (seen === null || !Number.isFinite(seen) || streak <= seen) return;
    const frame = requestAnimationFrame(() => {
      setGrewFrom(seen);
      play("streak");
    });
    return () => cancelAnimationFrame(frame);
  }, [streak, play]);

  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <Flame
        key={grewFrom === null ? "still" : "grew"}
        className={cn(
          "size-5",
          active ? "fill-streak/30 text-streak" : "text-muted-foreground",
          grewFrom !== null && "animate-flame",
          iconClassName,
        )}
        aria-hidden
      />
      {grewFrom !== null ? (
        <AnimatedNumber key="grew" value={streak} from={grewFrom} duration={500} delay={200} className="animate-roll-in inline-block" />
      ) : (
        <span className="tabular-nums">{streak}</span>
      )}
    </span>
  );
}
