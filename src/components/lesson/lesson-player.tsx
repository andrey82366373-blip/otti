"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoaderCircle, RotateCcw, X } from "lucide-react";

import { FormError } from "@/components/auth/form-parts";
import { checkAnswer, type AiNote } from "@/components/lesson/check-answer";
import { ExerciseView, canSkip } from "@/components/lesson/exercise-view";
import { FeedbackPanel } from "@/components/lesson/feedback-panel";
import { LessonSummary } from "@/components/lesson/lesson-summary";
import { Otti } from "@/components/otti";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { Exercise, Lesson } from "@/content/course/types";
import {
  finishLesson,
  type LessonAttempt,
  type LessonSummary as Summary,
} from "@/lib/actions/lessons";
import { MAX_ATTEMPTS, type CheckResult, type ExerciseAnswer } from "@/lib/exercise-check";
import { cn } from "@/lib/utils";

type QueueItem = { exercise: Exercise; attempt: number; key: string };
type Phase = "play" | "saving" | "error" | "summary";

/** Прохождение урока: задания по одному, проверка, повтор ошибок в конце и итог. */
export function LessonPlayer({ lesson }: { lesson: Lesson }) {
  const router = useRouter();
  const [queue, setQueue] = useState<QueueItem[]>(() =>
    lesson.exercises.map((exercise) => ({ exercise, attempt: 1, key: `${exercise.id}-1` })),
  );
  const [position, setPosition] = useState(0);
  const [answer, setAnswer] = useState<ExerciseAnswer | null>(null);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [attempts, setAttempts] = useState<LessonAttempt[]>([]);
  const [finishedIds, setFinishedIds] = useState<string[]>([]);
  const [phase, setPhase] = useState<Phase>("play");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [confirmExit, setConfirmExit] = useState(false);
  const [checksCount, setChecksCount] = useState(0);
  const [checking, setChecking] = useState(false);
  const [aiNote, setAiNote] = useState<AiNote | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const current = queue[position];
  const total = lesson.exercises.length;
  const willRepeat = Boolean(result && !result.correct && current && current.attempt < MAX_ATTEMPTS);
  const isLast = position === queue.length - 1 && !willRepeat;

  // Новый вопрос — переводим фокус на его заголовок (для экранных дикторов)
  useEffect(() => {
    if (position > 0) headingRef.current?.focus({ preventScroll: true });
  }, [position]);

  async function check(value: ExerciseAnswer | null = answer) {
    if (!current || !value || result || checking) return;
    // Ответ «своими словами», не совпавший с образцами, проверяет Отти (ИИ)
    const { result: checked, aiNote: note } = await checkAnswer(current.exercise, value, () => setChecking(true));
    setChecking(false);
    setAiNote(note);
    setResult(checked);
    setChecksCount((count) => count + 1);
    setAttempts((list) => [...list, { exerciseId: current.exercise.id, answer: value }]);

    if (checked.correct || current.attempt >= MAX_ATTEMPTS) {
      setFinishedIds((ids) => (ids.includes(current.exercise.id) ? ids : [...ids, current.exercise.id]));
    } else {
      // Задание с ошибкой вернётся в конце урока
      const nextAttempt = current.attempt + 1;
      setQueue((items) => [
        ...items,
        { exercise: current.exercise, attempt: nextAttempt, key: `${current.exercise.id}-${nextAttempt}` },
      ]);
    }
  }

  function skip() {
    if (!current) return;
    const empty: ExerciseAnswer =
      current.exercise.type === "build-sentence" ? { kind: "tiles", tiles: [] } : { kind: "text", text: "" };
    setAnswer(empty);
    void check(empty);
  }

  async function save(list: LessonAttempt[]) {
    setPhase("saving");
    setSaveError(null);
    try {
      const response = await finishLesson({ lessonId: lesson.id, attempts: list });
      if (!response.ok) {
        setSaveError(response.error);
        setPhase("error");
        return;
      }
      setSummary(response.summary);
      setPhase("summary");
      router.refresh();
    } catch {
      setSaveError("Нет связи с сервером. Проверь интернет и нажми «Сохранить ещё раз».");
      setPhase("error");
    }
  }

  function next() {
    if (position + 1 < queue.length) {
      setPosition((value) => value + 1);
      setAnswer(null);
      setResult(null);
      setAiNote(null);
    } else {
      void save(attempts);
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (result) next();
    else void check();
  }

  if (phase === "summary" && summary) {
    return (
      <main className="mx-auto w-full max-w-2xl px-4 pt-6 pb-16">
        <LessonSummary lesson={lesson} summary={summary} />
      </main>
    );
  }

  if (phase === "saving" || phase === "error") {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
        <Otti size={96} mood={phase === "error" ? "confused" : "happy"} />
        {phase === "saving" ? (
          <p role="status" className="flex items-center gap-2 font-bold text-muted-foreground">
            <LoaderCircle className="size-5 animate-spin" aria-hidden />
            Сохраняем результат…
          </p>
        ) : (
          <>
            <FormError message={saveError} />
            <Button size="lg" onClick={() => save(attempts)}>
              Сохранить ещё раз
            </Button>
            <Button asChild variant="ghost">
              <Link href="/learn">Выйти без сохранения</Link>
            </Button>
          </>
        )}
      </main>
    );
  }

  if (!current) return null;

  return (
    <form onSubmit={handleSubmit} className="flex min-h-dvh flex-col">
      {/* Верх: выход и прогресс */}
      <header className="mx-auto flex w-full max-w-2xl items-center gap-3 px-4 pt-4">
        <h1 className="sr-only">
          Урок {lesson.number}. {lesson.title}
        </h1>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Выйти из урока"
          onClick={() => setConfirmExit(true)}
        >
          <X className="size-6" />
        </Button>
        <Progress
          value={finishedIds.length}
          max={total}
          label={`Выполнено заданий: ${finishedIds.length} из ${total}`}
          className="h-4 flex-1"
          barClassName="bg-success"
        />
        <span className="w-12 text-right text-sm font-bold text-muted-foreground tabular-nums">
          {finishedIds.length}/{total}
        </span>
      </header>

      {/* Задание */}
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 px-4 pt-6 pb-8">
        <div className="flex flex-wrap items-center gap-2">
          <h2
            ref={headingRef}
            tabIndex={-1}
            className="text-lg font-extrabold text-muted-foreground outline-none"
          >
            {current.exercise.prompt}
          </h2>
          {current.attempt > 1 && (
            <Badge variant="muted">
              <RotateCcw aria-hidden />
              Повторим ошибку
            </Badge>
          )}
        </div>

        <div
          data-exercise-id={current.exercise.id}
          className={cn(result && !result.correct && "animate-shake")}
        >
          <ExerciseView
            key={current.key}
            exercise={current.exercise}
            answer={answer}
            onAnswer={setAnswer}
            result={result}
          />
        </div>
      </main>

      {/* Низ: кнопка «Проверить» или панель с результатом */}
      <footer className="sticky bottom-0 z-20">
        {result ? (
          <FeedbackPanel
            key={`${current.key}-feedback`}
            exercise={current.exercise}
            result={result}
            seed={checksCount}
            willRepeat={willRepeat}
            isLast={isLast}
            onNext={next}
            aiNote={aiNote}
          />
        ) : (
          <div className="border-t-2 bg-background pb-[env(safe-area-inset-bottom)]">
            <div className="mx-auto flex w-full max-w-2xl gap-3 px-4 py-4">
              {canSkip(current.exercise) && (
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={skip}
                  disabled={checking}
                  className="flex-1 md:flex-none"
                >
                  Не знаю
                </Button>
              )}
              <Button
                type="submit"
                size="lg"
                disabled={!answer || checking}
                className="flex-[2] md:ml-auto md:w-44 md:flex-none"
              >
                {checking && <LoaderCircle className="animate-spin" aria-hidden />}
                {checking ? "Отти проверяет…" : "Проверить"}
              </Button>
            </div>
          </div>
        )}
      </footer>

      {confirmExit && (
        <ExitDialog lessonId={lesson.id} onStay={() => setConfirmExit(false)} />
      )}
    </form>
  );
}

function ExitDialog({ lessonId, onStay }: { lessonId: string; onStay: () => void }) {
  const stayRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    stayRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onStay();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onStay]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="exit-title"
        className="animate-pop flex w-full max-w-sm flex-col items-center gap-3 rounded-2xl bg-card p-6 text-center shadow-xl"
      >
        <Otti size={72} mood="confused" />
        <h2 id="exit-title" className="text-xl font-black">
          Точно выйти?
        </h2>
        <p className="text-muted-foreground">Прогресс этого урока не сохранится.</p>
        <Button ref={stayRef} type="button" size="lg" className="w-full" onClick={onStay}>
          Продолжить урок
        </Button>
        <Button asChild variant="ghost" className="w-full text-destructive">
          <Link href={`/lesson/${lessonId}`}>Выйти</Link>
        </Button>
      </div>
    </div>
  );
}
