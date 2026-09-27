"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck, LoaderCircle } from "lucide-react";

import { Field, FormError } from "@/components/auth/form-parts";
import { ChoiceGroup } from "@/components/learning/choice-group";
import { goalOptions, levelOptions, minutesOptions } from "@/components/learning/options";
import { Button } from "@/components/ui/button";
import { updateLearningSettings } from "@/lib/actions/learning";
import {
  EXPLANATION_LANGUAGES,
  EXPLANATION_LANGUAGE_INFO,
  type CefrLevel,
  type DailyMinutes,
  type ExplanationLanguage,
  type LearningGoal,
} from "@/lib/learning";

type Settings = {
  name: string;
  level: CefrLevel;
  goal: LearningGoal;
  dailyMinutes: DailyMinutes;
  explanationLanguage: ExplanationLanguage;
};

/** Настройки обучения в профиле: имя, уровень, цель, время в день и язык объяснений. */
export function SettingsForm({ initial }: { initial: Settings }) {
  const router = useRouter();
  const [saved, setSaved] = useState<Settings>(initial);
  const [values, setValues] = useState<Settings>(initial);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  const changed =
    values.name.trim() !== saved.name ||
    values.level !== saved.level ||
    values.goal !== saved.goal ||
    values.dailyMinutes !== saved.dailyMinutes ||
    values.explanationLanguage !== saved.explanationLanguage;

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setJustSaved(false);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = values.name.trim();
    if (!name) {
      setError("Как тебя зовут? Имя не может быть пустым.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const response = await updateLearningSettings({ ...values, name });
      if (!response.ok) {
        setError(response.error);
      } else {
        setSaved({ ...values, name });
        setValues((current) => ({ ...current, name }));
        setJustSaved(true);
        router.refresh();
      }
    } catch {
      setError("Нет связи с сервером. Проверь интернет и попробуй ещё раз.");
    }
    setPending(false);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      <Field
        name="name"
        label="Имя"
        autoComplete="given-name"
        maxLength={50}
        value={values.name}
        onChange={(event) => update("name", event.target.value)}
        disabled={pending}
      />

      <ChoiceGroup
        name="level"
        legend="Уровень"
        showLegend
        options={levelOptions.map((option) => ({
          value: option.value,
          tag: option.tag,
          title: option.title,
        }))}
        value={values.level}
        onChange={(value) => update("level", value)}
        columns={2}
        compact
        disabled={pending}
      />

      <ChoiceGroup
        name="goal"
        legend="Цель"
        showLegend
        options={goalOptions.map((option) => ({
          value: option.value,
          title: option.title,
          icon: option.icon,
        }))}
        value={values.goal}
        onChange={(value) => update("goal", value)}
        columns={2}
        compact
        disabled={pending}
      />

      <ChoiceGroup
        name="minutes"
        legend="Время в день"
        showLegend
        options={minutesOptions.map((option) => ({
          value: option.value,
          title: `${option.value} мин`,
        }))}
        value={values.dailyMinutes}
        onChange={(value) => update("dailyMinutes", value)}
        columns={4}
        compact
        disabled={pending}
      />

      <ChoiceGroup
        name="explanationLanguage"
        legend="Язык объяснений у Отти"
        showLegend
        options={EXPLANATION_LANGUAGES.map((language) => ({
          value: language,
          title: EXPLANATION_LANGUAGE_INFO[language].title,
          description: EXPLANATION_LANGUAGE_INFO[language].description,
        }))}
        value={values.explanationLanguage}
        onChange={(value) => update("explanationLanguage", value)}
        columns={2}
        compact
        disabled={pending}
      />

      <FormError message={error} />

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending || !changed}>
          {pending && <LoaderCircle className="animate-spin" aria-hidden />}
          {pending ? "Сохраняем…" : "Сохранить"}
        </Button>
        <p role="status" className="flex items-center gap-1.5 text-sm font-bold text-success">
          {justSaved && !changed && (
            <>
              <CircleCheck className="size-4" aria-hidden />
              Сохранено
            </>
          )}
        </p>
      </div>
    </form>
  );
}
