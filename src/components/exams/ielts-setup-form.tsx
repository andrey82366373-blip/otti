"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpenText, Briefcase, CircleHelp, Headphones, LoaderCircle, Mic, PenLine } from "lucide-react";

import { FormError } from "@/components/auth/form-parts";
import { ChoiceGroup } from "@/components/learning/choice-group";
import { Button } from "@/components/ui/button";
import { saveIeltsProfile, type ProfileInput } from "@/lib/actions/exams";
import { IELTS_LEVELS, IELTS_MODULE_INFO, TARGET_BANDS, formatBand } from "@/lib/exams/ielts";
import type { IeltsLevel, IeltsModule, WeakestSkill } from "@/lib/exams/types";
import { cn } from "@/lib/utils";

type Initial = Partial<ProfileInput>;

/** Маленькие кнопки-«таблетки» для выбора числа (балл, занятия в неделю). */
function PillGroup<T extends string | number>({
  legend,
  hint,
  options,
  value,
  onChange,
  format = String,
}: {
  legend: string;
  hint?: string;
  options: readonly T[];
  value: T | null;
  onChange: (value: T) => void;
  format?: (value: T) => string;
}) {
  return (
    <fieldset className="min-w-0">
      <legend className="mb-1 text-sm font-extrabold">{legend}</legend>
      {hint && <p className="mb-2 text-sm text-muted-foreground">{hint}</p>}
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const checked = option === value;
          return (
            <label
              key={String(option)}
              className={cn(
                "flex min-w-12 cursor-pointer items-center justify-center rounded-xl border-2 px-3 py-2 font-extrabold tabular-nums transition-colors select-none has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50",
                checked ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary/40",
              )}
            >
              <input
                type="radio"
                className="sr-only"
                name={legend}
                checked={checked}
                onChange={() => onChange(option)}
              />
              {format(option)}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

/** Настройка подготовки к IELTS: модуль, цель, дата, уровень, занятия в неделю, сложный навык. */
export function IeltsSetupForm({ initial, today, isEdit }: { initial: Initial; today: string; isEdit: boolean }) {
  const router = useRouter();
  const [examModule, setExamModule] = useState<IeltsModule | null>(initial.module ?? null);
  const [targetBand, setTargetBand] = useState<number | null>(initial.targetBand ?? null);
  const [examDate, setExamDate] = useState(initial.examDate ?? "");
  const [dateUnknown, setDateUnknown] = useState(isEdit ? !initial.examDate : false);
  const [level, setLevel] = useState<IeltsLevel | null>(initial.currentLevel ?? null);
  const [sessions, setSessions] = useState<number | null>(initial.sessionsPerWeek ?? 3);
  const [weakest, setWeakest] = useState<WeakestSkill | null>(initial.weakestSkill ?? null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!examModule) return setError("Выбери модуль: Academic или General Training.");
    if (targetBand === null) return setError("Выбери желаемый балл.");
    if (!dateUnknown && !examDate) return setError("Укажи дату экзамена или отметь «Пока не знаю».");
    if (!level) return setError("Выбери свой текущий уровень.");
    if (!sessions) return setError("Выбери, сколько раз в неделю будешь заниматься.");
    if (!weakest) return setError("Выбери навык, который даётся труднее всего.");
    setError(null);
    setPending(true);
    try {
      const result = await saveIeltsProfile({
        module: examModule,
        targetBand,
        examDate: dateUnknown ? null : examDate,
        currentLevel: level,
        sessionsPerWeek: sessions,
        weakestSkill: weakest,
      });
      if (!result.ok) {
        setError(result.error);
        setPending(false);
        return;
      }
      router.push("/exams/ielts");
      router.refresh();
    } catch {
      setError("Нет связи с сервером. Проверь интернет и попробуй ещё раз.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-7" noValidate>
      <ChoiceGroup<IeltsModule>
        name="module"
        legend="Какой модуль ты сдаёшь?"
        showLegend
        columns={2}
        value={examModule}
        onChange={setExamModule}
        options={[
          { value: "academic", title: IELTS_MODULE_INFO.academic.title, description: IELTS_MODULE_INFO.academic.description, icon: BookOpenText },
          { value: "general", title: IELTS_MODULE_INFO.general.title, description: IELTS_MODULE_INFO.general.description, icon: Briefcase },
        ]}
      />

      <PillGroup
        legend="Какой общий балл тебе нужен?"
        hint="Посмотри требования университета, работодателя или визовой программы."
        options={TARGET_BANDS}
        value={targetBand}
        onChange={setTargetBand}
        format={formatBand}
      />

      <fieldset className="min-w-0">
        <legend className="mb-1 text-sm font-extrabold">Когда примерно экзамен?</legend>
        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="exam-date" className="sr-only">
            Дата экзамена
          </label>
          <input
            id="exam-date"
            type="date"
            min={today}
            value={examDate}
            disabled={dateUnknown}
            onChange={(event) => setExamDate(event.target.value)}
            className="h-12 rounded-xl border-2 bg-card px-3 font-semibold outline-none focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-ring/25 disabled:opacity-50"
          />
          <label className="flex cursor-pointer items-center gap-2 text-sm font-bold">
            <input
              type="checkbox"
              checked={dateUnknown}
              onChange={(event) => setDateUnknown(event.target.checked)}
              className="size-5 accent-primary"
            />
            Пока не знаю
          </label>
        </div>
      </fieldset>

      <ChoiceGroup<IeltsLevel>
        name="level"
        legend="Какой у тебя сейчас уровень английского?"
        showLegend
        columns={2}
        compact
        value={level}
        onChange={setLevel}
        options={IELTS_LEVELS.map((item) => ({ value: item.value, title: item.title, description: item.description }))}
      />

      <PillGroup
        legend="Сколько раз в неделю будешь заниматься?"
        hint="Одно занятие — 20–45 минут."
        options={[1, 2, 3, 4, 5, 6, 7] as const}
        value={sessions as 1 | 2 | 3 | 4 | 5 | 6 | 7 | null}
        onChange={setSessions}
      />

      <ChoiceGroup<WeakestSkill>
        name="weakest"
        legend="Какой навык даётся труднее всего?"
        showLegend
        columns={2}
        compact
        value={weakest}
        onChange={setWeakest}
        options={[
          { value: "reading", title: "Reading", description: "Чтение", icon: BookOpenText },
          { value: "listening", title: "Listening", description: "Аудирование", icon: Headphones },
          { value: "writing", title: "Writing", description: "Письмо", icon: PenLine },
          { value: "speaking", title: "Speaking", description: "Говорение", icon: Mic },
          { value: "unsure", title: "Не знаю", description: "Покажет диагностика", icon: CircleHelp },
        ]}
      />

      <FormError message={error} />
      <Button type="submit" size="lg" disabled={pending} className="sm:self-start">
        {pending && <LoaderCircle className="animate-spin" aria-hidden />}
        {isEdit ? "Сохранить и обновить план" : "Составить учебный план"}
      </Button>
    </form>
  );
}
