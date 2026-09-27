"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, HelpCircle, LoaderCircle } from "lucide-react";

import { FormError } from "@/components/auth/form-parts";
import { ChoiceGroup, type ChoiceOption } from "@/components/learning/choice-group";
import { goalOptions, levelOptions, minutesOptions } from "@/components/learning/options";
import { PlacementTest } from "@/components/learning/placement-test";
import { Otti } from "@/components/otti";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { PlacementResult, PublicPlacementQuestion } from "@/content/placement-test";
import { completeOnboarding, gradePlacementTest } from "@/lib/actions/learning";
import {
  LEVEL_INFO,
  type CefrLevel,
  type DailyMinutes,
  type LearningGoal,
} from "@/lib/learning";

type Step = "level" | "goal" | "time" | "test-intro" | "test" | "result";
type LevelChoice = CefrLevel | "unknown";

const STEP_NUMBER: Record<Step, number> = {
  level: 1,
  goal: 2,
  time: 3,
  "test-intro": 4,
  test: 4,
  result: 4,
};
const TOTAL_STEPS = 4;

const levelChoiceOptions: ChoiceOption<LevelChoice>[] = [
  ...levelOptions,
  {
    value: "unknown",
    icon: HelpCircle,
    title: "Не знаю",
    description: "Определим по мини-тесту",
  },
];

type OnboardingFlowProps = {
  questions: PublicPlacementQuestion[];
};

export function OnboardingFlow({ questions }: OnboardingFlowProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("level");
  const [levelChoice, setLevelChoice] = useState<LevelChoice | null>(null);
  const [goal, setGoal] = useState<LearningGoal | null>(null);
  const [minutes, setMinutes] = useState<DailyMinutes | null>(null);
  const [result, setResult] = useState<PlacementResult | null>(null);
  const [finalLevel, setFinalLevel] = useState<CefrLevel | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(level: CefrLevel) {
    if (!goal || !minutes) return;
    setPending(true);
    setError(null);
    try {
      const response = await completeOnboarding({ level, goal, dailyMinutes: minutes });
      if (!response.ok) {
        setError(response.error);
        setPending(false);
        return;
      }
      router.replace("/onboarding/plan");
      router.refresh();
    } catch {
      setError("Нет связи с сервером. Проверь интернет и попробуй ещё раз.");
      setPending(false);
    }
  }

  async function handleTestComplete(answers: number[]) {
    setStep("result");
    setPending(true);
    setError(null);
    try {
      const response = await gradePlacementTest(answers);
      if (!response.ok) {
        setError(response.error);
      } else {
        setResult(response.result);
        setFinalLevel(response.result.level);
      }
    } catch {
      setError("Нет связи с сервером. Проверь интернет и попробуй ещё раз.");
    }
    setPending(false);
  }

  function goBack() {
    setError(null);
    if (step === "goal") setStep("level");
    else if (step === "time") setStep("goal");
    else if (step === "test-intro") setStep("time");
  }

  const canGoBack = step === "goal" || step === "time" || step === "test-intro";
  const chosenLevel = levelChoice !== "unknown" ? levelChoice : null;

  return (
    <div className="flex flex-col gap-6">
      {step !== "test" && (
        <div className="flex items-center gap-3">
          {canGoBack ? (
            <Button variant="ghost" size="icon" onClick={goBack} aria-label="Назад">
              <ArrowLeft className="size-5" />
            </Button>
          ) : (
            <span className="size-10" aria-hidden />
          )}
          <Progress
            value={STEP_NUMBER[step]}
            max={TOTAL_STEPS}
            label={`Шаг ${STEP_NUMBER[step]} из ${TOTAL_STEPS}`}
            className="flex-1"
          />
          <span className="w-12 text-right text-sm font-bold text-muted-foreground tabular-nums">
            {STEP_NUMBER[step]}/{TOTAL_STEPS}
          </span>
        </div>
      )}

      {step === "level" && (
        <section className="flex flex-col gap-5">
          <StepTitle title="Какой у тебя уровень английского?" hint="Если сомневаешься — выбери «Не знаю»." />
          <ChoiceGroup
            name="level"
            legend="Уровень английского"
            options={levelChoiceOptions}
            value={levelChoice}
            onChange={setLevelChoice}
          />
          <Button size="lg" disabled={!levelChoice} onClick={() => setStep("goal")}>
            Дальше
          </Button>
        </section>
      )}

      {step === "goal" && (
        <section className="flex flex-col gap-5">
          <StepTitle title="Зачем тебе английский?" hint="От цели зависят темы разговоров с Отти." />
          <ChoiceGroup
            name="goal"
            legend="Цель обучения"
            options={goalOptions}
            value={goal}
            onChange={setGoal}
            columns={2}
          />
          <Button size="lg" disabled={!goal} onClick={() => setStep("time")}>
            Дальше
          </Button>
        </section>
      )}

      {step === "time" && (
        <section className="flex flex-col gap-5">
          <StepTitle
            title="Сколько времени в день готов заниматься?"
            hint="Лучше понемногу, но каждый день. Изменить можно в профиле."
          />
          <ChoiceGroup
            name="minutes"
            legend="Время занятий в день"
            options={minutesOptions}
            value={minutes}
            onChange={setMinutes}
          />
          <Button size="lg" disabled={!minutes} onClick={() => setStep("test-intro")}>
            Дальше
          </Button>
        </section>
      )}

      {step === "test-intro" && (
        <section className="flex flex-col gap-5">
          <Card className="items-center text-center">
            <Otti size={88} mood="wink" />
            <div>
              <h2 className="text-2xl font-black tracking-tight">Мини-тест на уровень</h2>
              <p className="mt-2 text-muted-foreground">
                10 вопросов, около 2 минут. Не угадывай: если не знаешь ответ, нажми «Не знаю» —
                так уровень определится точнее.
              </p>
            </div>
          </Card>
          <FormError message={error} />
          <Button size="lg" onClick={() => setStep("test")} disabled={pending}>
            Начать тест
          </Button>
          {chosenLevel && (
            <Button variant="ghost" onClick={() => save(chosenLevel)} disabled={pending}>
              {pending && <LoaderCircle className="animate-spin" aria-hidden />}
              Пропустить — оставить уровень {chosenLevel}
            </Button>
          )}
        </section>
      )}

      {step === "test" && <PlacementTest questions={questions} onComplete={handleTestComplete} />}

      {step === "result" && (
        <section className="flex flex-col gap-5">
          {pending && !result && (
            <div role="status" className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
              <LoaderCircle className="size-5 animate-spin" aria-hidden />
              Считаем результат…
            </div>
          )}

          {result && (
            <>
              <Card className="items-center text-center">
                <Otti size={88} mood="happy" />
                <div>
                  <p className="text-sm font-extrabold tracking-wide text-river uppercase">
                    Правильных ответов: {result.correct} из {result.total}
                  </p>
                  <h2 className="mt-1 text-2xl font-black tracking-tight">
                    Твой уровень — {result.level}
                  </h2>
                  <p className="mt-1 text-muted-foreground">
                    {LEVEL_INFO[result.level].title}: {LEVEL_INFO[result.level].description.toLowerCase()}
                  </p>
                </div>
              </Card>

              {chosenLevel && chosenLevel !== result.level && (
                <ChoiceGroup
                  name="final-level"
                  legend={`Ты выбрал ${chosenLevel}, а тест показал ${result.level}. Какой уровень оставить?`}
                  showLegend
                  options={[
                    { value: result.level, tag: result.level, title: "По результату теста", description: LEVEL_INFO[result.level].title },
                    { value: chosenLevel, tag: chosenLevel, title: "Как я выбрал", description: LEVEL_INFO[chosenLevel].title },
                  ]}
                  value={finalLevel}
                  onChange={setFinalLevel}
                />
              )}
            </>
          )}

          <FormError message={error} />

          {result && finalLevel && (
            <Button size="lg" onClick={() => save(finalLevel)} disabled={pending}>
              {pending && <LoaderCircle className="animate-spin" aria-hidden />}
              {pending ? "Сохраняем…" : "Готово"}
            </Button>
          )}
          {!result && !pending && (
            <Button size="lg" onClick={() => setStep("test-intro")}>
              Попробовать ещё раз
            </Button>
          )}
        </section>
      )}
    </div>
  );
}

function StepTitle({ title, hint }: { title: string; hint: string }) {
  return (
    <div>
      <h2 className="text-2xl font-black tracking-tight md:text-3xl">{title}</h2>
      <p className="mt-1 text-muted-foreground">{hint}</p>
    </div>
  );
}
