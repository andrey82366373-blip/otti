"use client";

import { useSyncExternalStore } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { cn } from "@/lib/utils";

const options = [
  { value: "light", label: "Светлая", icon: Sun },
  { value: "dark", label: "Тёмная", icon: Moon },
  { value: "system", label: "Как в системе", icon: Monitor },
] as const;

// Возвращает true только в браузере: до этого момента тема ещё неизвестна.
const subscribe = () => () => {};
function useIsClient() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}

/** Выбор темы из трёх вариантов (для экрана профиля). */
export function ThemeSelect() {
  const { theme, setTheme } = useTheme();
  const isClient = useIsClient();

  return (
    <div role="group" aria-label="Тема оформления" className="grid grid-cols-3 gap-2">
      {options.map(({ value, label, icon: Icon }) => {
        const active = isClient && theme === value;
        return (
          <button
            key={value}
            type="button"
            aria-pressed={active}
            onClick={() => setTheme(value)}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-xl border-2 px-2 py-3 text-sm font-bold transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
              active
                ? "border-primary bg-secondary text-secondary-foreground"
                : "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="size-5" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
