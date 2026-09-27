"use client";

import { useEffect, useRef, useState } from "react";

import { useFeedbackPrefs } from "@/components/motion/feedback-prefs";

/** Плавное замедление к концу. */
function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}

/**
 * Число, которое «набегает» до нового значения: 0 → 25 XP, 7 → 8 дней.
 * При уменьшенных анимациях сразу показывает итог. Экранный диктор читает только итоговое число.
 */
export function AnimatedNumber({
  value,
  from,
  duration = 800,
  delay = 0,
  prefix = "",
  suffix = "",
  className,
}: {
  value: number;
  /** С какого числа начать при первом показе. Без него первое значение показывается сразу. */
  from?: number;
  duration?: number;
  delay?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  const { reduceMotion } = useFeedbackPrefs();
  const [shown, setShown] = useState(from ?? value);
  const shownRef = useRef(from ?? value);

  useEffect(() => {
    const start = shownRef.current;
    if (start === value) return;
    if (reduceMotion) {
      const frame = requestAnimationFrame(() => {
        shownRef.current = value;
        setShown(value);
      });
      return () => cancelAnimationFrame(frame);
    }
    let frame = 0;
    let startedAt: number | null = null;
    const step = (time: number) => {
      startedAt ??= time + delay;
      const progress = Math.min(1, Math.max(0, (time - startedAt) / duration));
      const current = Math.round(start + (value - start) * easeOutCubic(progress));
      shownRef.current = current;
      setShown(current);
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value, duration, delay, reduceMotion]);

  return (
    <span className={className}>
      <span aria-hidden className="tabular-nums">
        {prefix}
        {shown}
        {suffix}
      </span>
      <span className="sr-only">
        {prefix}
        {value}
        {suffix}
      </span>
    </span>
  );
}
