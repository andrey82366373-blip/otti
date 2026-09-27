"use client";

import { Check, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type ChoiceOption<T extends string | number> = {
  value: T;
  title: string;
  description?: string;
  icon?: LucideIcon;
  /** Короткая метка слева, например «A1». */
  tag?: string;
};

type ChoiceGroupProps<T extends string | number> = {
  name: string;
  legend: string;
  /** Показывать ли заголовок группы на экране (иначе он только для экранных дикторов). */
  showLegend?: boolean;
  options: ChoiceOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  columns?: 1 | 2 | 4;
  compact?: boolean;
  disabled?: boolean;
};

/** Выбор одного варианта из нескольких карточек (работает как обычные радиокнопки). */
export function ChoiceGroup<T extends string | number>({
  name,
  legend,
  showLegend = false,
  options,
  value,
  onChange,
  columns = 1,
  compact = false,
  disabled = false,
}: ChoiceGroupProps<T>) {
  return (
    <fieldset disabled={disabled} className="min-w-0">
      <legend className={showLegend ? "mb-2 text-sm font-extrabold" : "sr-only"}>{legend}</legend>
      <div
        className={cn(
          "grid gap-2.5",
          columns === 2 && "sm:grid-cols-2",
          columns === 4 && "grid-cols-2 sm:grid-cols-4",
        )}
      >
        {options.map((option) => {
          const checked = option.value === value;
          const Icon = option.icon;
          return (
            <label
              key={String(option.value)}
              className={cn(
                "relative flex cursor-pointer items-center gap-3 rounded-2xl border-2 bg-card transition-colors select-none",
                "has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50",
                compact ? "px-3 py-2.5" : "px-4 py-3.5",
                checked
                  ? "border-primary bg-secondary"
                  : "border-border hover:border-primary/40 hover:bg-muted/50",
                disabled && "cursor-not-allowed opacity-60",
              )}
            >
              <input
                type="radio"
                name={name}
                value={String(option.value)}
                checked={checked}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              {option.tag && (
                <span
                  className={cn(
                    "flex h-10 min-w-10 shrink-0 items-center justify-center rounded-xl px-2 text-sm font-black",
                    checked ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                  )}
                >
                  {option.tag}
                </span>
              )}
              {Icon && (
                <span
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-xl",
                    checked ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                  )}
                >
                  <Icon className="size-5" aria-hidden />
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block leading-tight font-extrabold">{option.title}</span>
                {option.description && (
                  <span className="mt-0.5 block text-sm text-muted-foreground">
                    {option.description}
                  </span>
                )}
              </span>
              <span
                aria-hidden
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                  checked ? "border-primary bg-primary text-primary-foreground" : "border-border",
                )}
              >
                {checked && <Check className="size-4" strokeWidth={3} />}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
