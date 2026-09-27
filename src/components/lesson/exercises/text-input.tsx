"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

/** Поле для ответа по-английски. Подсказывает, если включена русская раскладка. */
export function EnglishInput({
  value,
  onChange,
  disabled,
  state,
  placeholder,
  label,
  warnCyrillic = true,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  state: "idle" | "correct" | "wrong";
  placeholder: string;
  label: string;
  warnCyrillic?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const hasCyrillic = warnCyrillic && /[а-яё]/i.test(value);

  // Сразу ставим курсор в поле, чтобы можно было печатать
  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, []);

  return (
    <div className="flex flex-col gap-1.5">
      <label className="sr-only" htmlFor="lesson-answer">
        {label}
      </label>
      <input
        ref={ref}
        id="lesson-answer"
        lang="en"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        maxLength={300}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="none"
        spellCheck={false}
        enterKeyHint="done"
        aria-invalid={state === "wrong" ? true : undefined}
        className={cn(
          "h-14 w-full rounded-2xl border-2 bg-card px-4 text-lg font-bold outline-none transition-colors placeholder:font-normal placeholder:text-muted-foreground/70 focus-visible:ring-[3px] focus-visible:ring-ring/25 disabled:opacity-100",
          state === "idle" && "border-input focus-visible:border-primary",
          state === "correct" && "border-success bg-success-soft text-success",
          state === "wrong" && "border-destructive bg-destructive-soft text-destructive",
        )}
      />
      {hasCyrillic && !disabled && (
        <p className="text-sm font-semibold text-streak-text">
          Похоже, включена русская раскладка — ответ нужен на английском.
        </p>
      )}
    </div>
  );
}
