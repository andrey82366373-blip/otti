"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ClipboardCheck, LoaderCircle, SkipForward } from "lucide-react";

import { FormError } from "@/components/auth/form-parts";
import { AiDisclaimer, BandBadge, InfoNote } from "@/components/exams/exam-ui";
import { ObjectivePlayer, type PlayerTask } from "@/components/exams/objective-player";
import { SpeakingSession, type SpeakingTaskView } from "@/components/exams/speaking-session";
import { WritingWorkspace, type WritingTaskView } from "@/components/exams/writing-workspace";
import { PlayOnMount } from "@/components/motion/play-on-mount";
import { Otti } from "@/components/otti";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { completeDiagnostic } from "@/lib/actions/exams";
import { formatRange } from "@/lib/exams/ielts";
import type { DiagnosticResult } from "@/lib/exams/types";

const STEPS = ["Reading", "Listening", "Writing", "Speaking"] as const;
const STEP_KEY = "otti:ielts-diagnostic-step";

type Step = "intro" | 0 | 1 | 2 | 3 | "finishing" | "done";

/**
 * Диагностика IELTS: короткие Reading и Listening, небольшой текст и три устных вопроса.
 * Итог — примерный диапазон с низкой уверенностью: по короткому тесту точный балл не определить.
 */
export function DiagnosticFlow({
  reading,
  listening,
  writing,
  speaking,
  writingRemaining,
  speakingRemaining,
  previous,
}: {
  reading: PlayerTask;
  listening: PlayerTask;
  writing: WritingTaskView;
  speaking: SpeakingTaskView;
  writingRemaining: number;
  speakingRemaining: number;
  previous: DiagnosticResult | null;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("intro");
  const [stepDone, setStepDone] = useState(false);
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Диагностику можно продолжить после обновления страницы
  useEffect(() => {
    let saved: number | null = null;
    try {
      const raw = window.sessionStorage.getItem(STEP_KEY);
      saved = raw === null ? null : Number.parseInt(raw, 10);
    } catch {
      saved = null;
    }
    if (saved !== null && saved >= 1 && saved <= 3) {
      const next = saved as 1 | 2 | 3;
      queueMicrotask(() => setStep(next));
    }
  }, []);

  function go(next: Step) {
    setStep(next);
    setStepDone(false);
    try {
      if (typeof next === "number") window.sessionStorage.setItem(STEP_KEY, String(next));
      else window.sessionStorage.removeItem(STEP_KEY);
    } catch {
      // без хранилища — просто без продолжения
    }
    window.scrollTo({ top: 0 });
  }

  async function finish() {
    go("finishing");
    setError(null);
    try {
      const response = await completeDiagnostic();
      if (!response.ok) {
        setError(response.error);
        setStep(3);
        return;
      }
      setResult(response.result);
      setStep("done");
      router.refresh();
    } catch {
      setError("Нет связи с сервером. Попробуй ещё раз.");
      setStep(3);
    }
  }

  const progress = typeof step === "number" ? (
    <div className="mx-auto w-full max-w-3xl px-4 pt-3">
      <Progress
        value={step + (stepDone ? 1 : 0)}
        max={STEPS.length}
        label={`Диагностика: шаг ${step + 1} из ${STEPS.length}`}
        className="h-2"
      />
      <p className="mt-1 text-xs font-bold text-muted-foreground">
        Шаг {step + 1} из {STEPS.length}: {STEPS[step]}
      </p>
    </div>
  ) : null;

  const nextBar = (label: string, onClick: () => void, skip?: () => void) => (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-end gap-2 px-4 py-3">
        {skip && (
          <Button type="button" variant="ghost" onClick={skip}>
            <SkipForward aria-hidden />
            Пропустить
          </Button>
        )}
        <Button type="button" size="lg" onClick={onClick}>
          {label}
          <ArrowRight aria-hidden />
        </Button>
      </div>
    </div>
  );

  if (step === "intro") {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 pt-8 pb-16">
        <div className="flex items-center gap-3">
          <ClipboardCheck className="size-8 text-primary" aria-hidden />
          <h1 className="text-3xl font-black tracking-tight">Диагностика IELTS</h1>
        </div>
        <p className="text-muted-foreground">
          Четыре коротких шага, всего 25–30 минут. Отвечай сам, без словаря и переводчика — так результат будет честнее.
        </p>
        <ol className="flex flex-col gap-2">
          {[
            ["Reading", "короткий текст и 6 вопросов, 8 минут"],
            ["Listening", "разговор и 5 вопросов"],
            ["Writing", "ответ на вопрос, 80–120 слов"],
            ["Speaking", "три вопроса о тебе, голосом или текстом"],
          ].map(([title, text], index) => (
            <li key={title} className="flex items-center gap-3 rounded-xl border-2 bg-card p-3">
              <span className="flex size-8 items-center justify-center rounded-full bg-secondary font-black">{index + 1}</span>
              <span>
                <span className="font-extrabold">{title}</span> — {text}
              </span>
            </li>
          ))}
        </ol>
        <InfoNote>
          Результат — примерный диапазон с низкой уверенностью: по короткому тесту точный балл определить нельзя. Writing и
          Speaking можно пропустить, если нет времени или ИИ недоступен.
        </InfoNote>
        {previous && (
          <InfoNote>Ты уже проходил диагностику. Новый результат заменит прежний и обновит план.</InfoNote>
        )}
        <Button type="button" size="lg" onClick={() => go(0)} className="sm:self-start">
          Начать
          <ArrowRight aria-hidden />
        </Button>
      </main>
    );
  }

  if (step === 0) {
    return (
      <div className="pb-24">
        {progress}
        <ObjectivePlayer key="reading" skill="reading" task={reading} backHref="/exams/ielts" diagnostic onDiagnosticDone={() => setStepDone(true)} />
        {stepDone && nextBar("Дальше: Listening", () => go(1))}
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="pb-24">
        {progress}
        <ObjectivePlayer key="listening" skill="listening" task={listening} backHref="/exams/ielts" diagnostic onDiagnosticDone={() => setStepDone(true)} />
        {stepDone && nextBar("Дальше: Writing", () => go(2))}
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="pb-28">
        {progress}
        <div className="mx-auto w-full max-w-3xl px-4 pt-4">
          <h1 className="mb-3 text-2xl font-black">Writing</h1>
          <WritingWorkspace
            task={writing}
            initialDraft=""
            initialCheck={null}
            remaining={writingRemaining}
            limit={writingRemaining}
            backHref="/exams/ielts"
            embedded
            onChecked={() => setStepDone(true)}
          />
        </div>
        {nextBar(stepDone ? "Дальше: Speaking" : "Дальше без проверки", () => go(3), stepDone ? undefined : () => go(3))}
      </div>
    );
  }

  if (step === 3 || step === "finishing") {
    return (
      <div className="pb-28">
        {progress}
        <div className="mx-auto w-full max-w-3xl px-4 pt-4">
          <h1 className="mb-3 text-2xl font-black">Speaking</h1>
          <SpeakingSession
            task={speaking}
            initialFeedback={null}
            pendingCheckId={null}
            remaining={speakingRemaining}
            limit={speakingRemaining}
            backHref="/exams/ielts"
            embedded
            onChecked={() => setStepDone(true)}
          />
          <FormError message={error} />
        </div>
        {step === "finishing" ? (
          <div role="status" className="fixed inset-x-0 bottom-6 z-40 mx-auto flex w-fit items-center gap-2 rounded-full bg-card px-4 py-2 font-bold shadow-lg">
            <LoaderCircle className="size-5 animate-spin" aria-hidden />
            Подводим итоги…
          </div>
        ) : (
          nextBar("Узнать результат", () => void finish())
        )}
      </div>
    );
  }

  // Итог
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 pt-8 pb-16">
      <PlayOnMount sound="complete" />
      <div className="flex flex-col items-center gap-2 text-center">
        <Otti size={96} mood="joy" className="animate-celebrate" />
        <h1 className="text-3xl font-black tracking-tight">Диагностика пройдена</h1>
        <p className="text-muted-foreground">План занятий обновлён с учётом результата.</p>
      </div>
      {result && (
        <Card className="gap-4">
          <div>
            <p className="text-xs font-extrabold tracking-wide text-muted-foreground uppercase">Примерный стартовый уровень</p>
            {result.estimate ? (
              <BandBadge estimate={result.estimate} size="lg" />
            ) : (
              <p className="text-sm">Для общей оценки не хватило данных — она появится после нескольких заданий.</p>
            )}
          </div>
          <ul className="grid gap-2 text-sm sm:grid-cols-2">
            <li className="rounded-xl bg-muted/60 p-3">
              <span className="font-bold">Reading:</span> {result.reading.correct} из {result.reading.total} верно
            </li>
            <li className="rounded-xl bg-muted/60 p-3">
              <span className="font-bold">Listening:</span> {result.listening.correct} из {result.listening.total} верно
            </li>
            <li className="rounded-xl bg-muted/60 p-3">
              <span className="font-bold">Writing:</span> {result.writing ? `≈ ${formatRange(result.writing)} (оценка ИИ)` : "без оценки (пропущено или ответ слишком короткий)"}
            </li>
            <li className="rounded-xl bg-muted/60 p-3">
              <span className="font-bold">Speaking:</span> {result.speaking ? `≈ ${formatRange(result.speaking)} (оценка ИИ)` : "без оценки (пропущено или ответ слишком короткий)"}
            </li>
          </ul>
          <InfoNote>Это ориентир по короткому тесту, уверенность низкая. Точнее станет после нескольких полноценных заданий.</InfoNote>
          {(result.writing || result.speaking) && <AiDisclaimer />}
        </Card>
      )}
      <Button asChild size="lg" className="sm:self-center">
        <Link href="/exams/ielts">К плану подготовки</Link>
      </Button>
    </main>
  );
}
