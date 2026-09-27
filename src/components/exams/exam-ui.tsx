"use client";

import { useEffect, useRef, useState } from "react";
import { Info, ShieldAlert } from "lucide-react";

import {
  AI_ESTIMATE_DISCLAIMER,
  CONFIDENCE_TITLES,
  formatBand,
  formatRange,
} from "@/lib/exams/ielts";
import type { BandEstimate } from "@/lib/exams/types";
import { cn } from "@/lib/utils";

/** Примерный балл: диапазон крупно, уверенность и основание мелко. */
export function BandBadge({
  estimate,
  size = "md",
  className,
}: {
  estimate: BandEstimate;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col", className)}>
      <span
        className={cn(
          "font-black tabular-nums tracking-tight",
          size === "lg" ? "text-4xl" : size === "md" ? "text-2xl" : "text-lg",
        )}
      >
        {formatRange(estimate)}
      </span>
      <span className="text-xs font-semibold text-muted-foreground">
        уверенность: {CONFIDENCE_TITLES[estimate.confidence]} · {estimate.basis}
      </span>
    </div>
  );
}

/** Обязательная пометка: оценка ИИ примерная, это не результат IELTS. */
export function AiDisclaimer({ className }: { className?: string }) {
  return (
    <p
      role="note"
      className={cn(
        "flex items-start gap-2 rounded-xl border border-xp/50 bg-xp/10 px-3 py-2 text-sm font-semibold",
        className,
      )}
    >
      <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
      {AI_ESTIMATE_DISCLAIMER}
    </p>
  );
}

/** Небольшое пояснение с иконкой «i». */
export function InfoNote({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("flex items-start gap-2 text-sm text-muted-foreground", className)}>
      <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>{children}</span>
    </p>
  );
}

/** «12:05» из секунд. */
export function formatClock(seconds: number): string {
  const safe = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(safe / 60);
  return `${minutes}:${String(safe % 60).padStart(2, "0")}`;
}

/** «1 ч 5 мин», «12 мин», «40 с». */
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.max(0, Math.round(seconds))} с`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} мин`;
  return `${Math.floor(minutes / 60)} ч ${minutes % 60} мин`;
}

/**
 * Секундомер: считает прошедшие секунды, пока running = true (паузы не считаются).
 * Отсчёт идёт от реального времени, поэтому не сбивается, если вкладка была в фоне.
 */
export function useElapsed(running: boolean): number {
  const [elapsed, setElapsed] = useState(0);
  const baseRef = useRef(0);

  useEffect(() => {
    if (!running) return;
    const started = Date.now();
    const base = baseRef.current;
    const timer = window.setInterval(() => setElapsed(Math.floor(base + (Date.now() - started) / 1000)), 500);
    return () => {
      window.clearInterval(timer);
      baseRef.current = base + (Date.now() - started) / 1000;
    };
  }, [running]);

  return elapsed;
}

/** Таймер: обратный отсчёт (limit) или просто прошедшее время. */
export function TimerDisplay({
  elapsed,
  limitSeconds,
  className,
}: {
  elapsed: number;
  /** null — без ограничения: показываем прошедшее время. */
  limitSeconds: number | null;
  className?: string;
}) {
  const left = limitSeconds !== null ? limitSeconds - elapsed : null;
  const warning = left !== null && left <= 60;
  return (
    <span
      role="timer"
      aria-label={left !== null ? `Осталось ${formatClock(Math.max(0, left))}` : `Прошло ${formatClock(elapsed)}`}
      className={cn(
        "rounded-full px-2.5 py-1 text-sm font-extrabold tabular-nums",
        left !== null && left <= 0
          ? "bg-destructive text-destructive-foreground"
          : warning
            ? "bg-destructive-soft text-destructive"
            : "bg-muted text-foreground",
        className,
      )}
    >
      {left !== null ? (left <= 0 ? "Время вышло" : formatClock(left)) : formatClock(elapsed)}
    </span>
  );
}

export function bandText(value: number): string {
  return formatBand(value);
}
