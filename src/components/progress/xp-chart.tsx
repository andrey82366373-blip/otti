"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

export type ChartDay = {
  day: string;
  /** Подпись под столбиком, например «26». */
  label: string;
  /** Полная дата для подсказки: «26 сентября, пт». */
  fullLabel: string;
  xp: number;
  isToday: boolean;
};

/** Шаг шкалы: 10, 20, 50, 100… */
function niceMax(value: number): number {
  const steps = [10, 20, 30, 40, 50, 60, 80, 100, 120, 150, 200, 250, 300, 400, 500];
  return steps.find((step) => step >= value) ?? Math.ceil(value / 100) * 100;
}

/** Столбики опыта по дням с линией дневной цели. Подсказка при наведении и фокусе. */
export function XpChart({ days, goal }: { days: ChartDay[]; goal: number }) {
  const [active, setActive] = useState<number | null>(null);
  const max = niceMax(Math.max(goal * 1.25, ...days.map((item) => item.xp), 10));
  const goalPercent = Math.min(100, (goal / max) * 100);
  const total = days.reduce((sum, item) => sum + item.xp, 0);

  return (
    <div className="flex flex-col gap-3">
      <div className="relative pr-1 pl-8">
        {/* Шкала слева */}
        <span className="absolute top-0 left-0 -translate-y-1/2 text-xs text-muted-foreground tabular-nums">
          {max}
        </span>
        <span className="absolute bottom-6 left-0 translate-y-1/2 text-xs text-muted-foreground tabular-nums">
          0
        </span>

        <div className="relative h-44">
          {/* Сетка: верх и основание */}
          <div aria-hidden className="absolute inset-x-0 top-0 border-t border-border" />
          <div aria-hidden className="absolute inset-x-0 bottom-6 border-t border-border" />

          {/* Линия дневной цели; её значение — на шкале слева */}
          <div
            aria-hidden
            className="absolute inset-x-0 z-10 border-t border-muted-foreground/60"
            style={{ bottom: `calc(1.5rem + (100% - 1.5rem) * ${goalPercent / 100})` }}
          >
            <span className="absolute -left-8 w-7 -translate-y-1/2 text-right text-xs font-black text-foreground tabular-nums">
              {goal}
            </span>
          </div>

          <div className="absolute inset-0 grid grid-cols-[repeat(14,minmax(0,1fr))]">
            {days.map((item, index) => {
              const height = (item.xp / max) * 100;
              const isActive = active === index;
              return (
                <button
                  key={item.day}
                  type="button"
                  aria-label={`${item.fullLabel}: ${item.xp} XP${item.xp >= goal ? ", цель выполнена" : ""}`}
                  onPointerEnter={() => setActive(index)}
                  onPointerLeave={() => setActive(null)}
                  onFocus={() => setActive(index)}
                  onBlur={() => setActive(null)}
                  className="group relative flex h-full flex-col items-center justify-end outline-none"
                >
                  {/* Подсказка */}
                  {isActive && (
                    <span
                      role="tooltip"
                      className={cn(
                        "absolute bottom-full z-20 mb-1 flex flex-col items-center rounded-lg border bg-popover px-2.5 py-1.5 whitespace-nowrap shadow-md",
                        index < 3 ? "left-0" : index > 10 ? "right-0" : "left-1/2 -translate-x-1/2",
                      )}
                    >
                      <span className="text-sm font-black text-foreground">{item.xp} XP</span>
                      <span className="text-xs text-muted-foreground">{item.fullLabel}</span>
                    </span>
                  )}

                  <span className="relative flex h-[calc(100%-1.5rem)] w-full items-end justify-center">
                    {/* Значение над сегодняшним столбиком */}
                    {item.isToday && item.xp > 0 && (
                      <span
                        className="absolute text-xs font-black text-foreground tabular-nums"
                        style={{ bottom: `calc(${height}% + 2px)` }}
                      >
                        {item.xp}
                      </span>
                    )}
                    {item.xp > 0 && (
                      <span
                        className={cn(
                          "block w-3/5 max-w-6 rounded-t-[4px] bg-chart-1 transition-opacity",
                          active !== null && !isActive && "opacity-50",
                        )}
                        style={{ height: `${Math.max(height, 1.5)}%` }}
                      />
                    )}
                  </span>
                  <span
                    className={cn(
                      "flex h-6 items-end text-[11px] tabular-nums group-focus-visible:underline",
                      item.isToday ? "font-black text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <details className="text-sm">
        <summary className="w-fit cursor-pointer rounded font-bold text-primary outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
          Показать таблицей
        </summary>
        <table className="mt-2 w-full text-left">
          <thead className="text-muted-foreground">
            <tr>
              <th scope="col" className="py-1 font-bold">
                День
              </th>
              <th scope="col" className="py-1 text-right font-bold">
                XP
              </th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {days.map((item) => (
              <tr key={item.day} className="border-t">
                <td className="py-1">{item.fullLabel}</td>
                <td className="py-1 text-right">{item.xp}</td>
              </tr>
            ))}
            <tr className="border-t font-bold">
              <td className="py-1">Всего</td>
              <td className="py-1 text-right">{total}</td>
            </tr>
          </tbody>
        </table>
      </details>
    </div>
  );
}
