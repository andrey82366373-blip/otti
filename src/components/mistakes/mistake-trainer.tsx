"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, Flame, LoaderCircle, RotateCcw, X, Zap } from "lucide-react";

import { checkAnswer, type AiNote } from "@/components/lesson/check-answer";
import { Confetti } from "@/components/lesson/confetti";
import { ExerciseView, canSkip } from "@/components/lesson/exercise-view";
import { FeedbackPanel } from "@/components/lesson/feedback-panel";
import { SoundToggleButton } from "@/components/motion/feedback-settings";
import { PlayOnMount } from "@/components/motion/play-on-mount";
import { Otti } from "@/components/otti";
import { NewAchievements } from "@/components/progress/new-achievements";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { checkMistake } from "@/lib/actions/mistakes";
import type { CheckResult, ExerciseAnswer } from "@/lib/exercise-check";
import type { TrainingItem } from "@/lib/mistake-store";
import { getExerciseQuestion } from "@/lib/mistakes";
import { MISTAKES, withPlural } from "@/lib/plural";
import { cn } from "@/lib/utils";

type QueueItem = { item: TrainingItem; repeat: boolean; key: string };
type Phase = "play" | "saving" | "summary";

type MistakeTrainerProps = {
  items: TrainingItem[];
  /** Сколько всего неисправленных ошибок (с учётом темы) на начало тренировки. */
  totalOpen: number;
  topicTitle?: string;
  /** Ссылка на следующую тренировку. */
  moreHref: string;
};

/**
 * Тренировка ошибок: задания по одному. Каждый ответ сразу сохраняется на сервере:
 * верный — ошибка исправлена, неверный — задание ещё раз покажется в конце.
 */
export function MistakeTrainer(props: MistakeTrainerProps) {
  // Набор заданий не меняется до конца тренировки, даже если страница обновится
  const [{ items, totalOpen, topicTitle, moreHref }] = useState(props);
  const [queue, setQueue] = useState<QueueItem[]>(() =>
    items.map((item) => ({ item, repeat: false, key: `${item.exercise.id}-1` })),
  );
  const [position, setPosition] = useState(0);
  const [answer, setAnswer] = useState<ExerciseAnswer | null>(null);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [checksCount, setChecksCount] = useState(0);
  const [checking, setChecking] = useState(false);
  const [aiNote, setAiNote] = useState<AiNote | null>(null);
  /** Результат первой попытки: id задания → исправлено или нет. */
  const [outcomes, setOutcomes] = useState<Record<string, boolean>>({});
  const [xp, setXp] = useState(0);
  const [goalReached, setGoalReached] = useState(false);
  const [achievements, setAchievements] = useState<{ code: string; title: string }[]>([]);
  const [failed, setFailed] = useState(false);
  const [phase, setPhase] = useState<Phase>("play");
  const pending = useRef<Promise<void>[]>([]);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const current = queue[position];
  const firstPassDone = Object.keys(outcomes).length;
  const willRepeat = Boolean(result && !result.correct && current && !current.repeat);
  const isLast = position === queue.length - 1 && !willRepeat;

  // Новое задание — фокус на его заголовок (для экранных дикторов)
  useEffect(() => {
    if (position > 0) headingRef.current?.focus({ preventScroll: true });
  }, [position]);

  async function check(value: ExerciseAnswer | null = answer) {
    if (!current || !value || result || checking) return;
    // Ответ «своими словами», не совпавший с образцами, проверяет Отти (ИИ).
    // Решение ИИ сохраняется на сервере раньше, чем туда уйдёт ответ ниже.
    const { result: checked, aiNote: note } = await checkAnswer(current.item.exercise, value, () =>
      setChecking(true),
    );
    setChecking(false);
    setAiNote(note);
    setResult(checked);
    setChecksCount((count) => count + 1);

    // Повтор в конце — просто тренировка, на сервер не отправляем
    if (current.repeat) return;

    const exerciseId = current.item.exercise.id;
    setOutcomes((map) => ({ ...map, [exerciseId]: checked.correct }));
    if (!checked.correct) {
      setQueue((list) => [...list, { item: current.item, repeat: true, key: `${exerciseId}-2` }]);
    }

    const request = checkMistake({ exerciseId, answer: value })
      .then((response) => {
        if (!response.ok) {
          setFailed(true);
          return;
        }
        setXp((total) => total + response.xpEarned);
        if (response.goalReachedNow) setGoalReached(true);
        if (response.newAchievements.length > 0) {
          setAchievements((list) => [...list, ...response.newAchievements]);
        }
      })
      .catch(() => setFailed(true));
    pending.current.push(request);
  }

  function skip() {
    if (!current) return;
    const empty: ExerciseAnswer =
      current.item.exercise.type === "build-sentence"
        ? { kind: "tiles", tiles: [] }
        : { kind: "text", text: "" };
    setAnswer(empty);
    void check(empty);
  }

  async function finish() {
    setPhase("saving");
    await Promise.allSettled(pending.current);
    setPhase("summary");
  }

  function next() {
    if (position + 1 < queue.length) {
      setPosition((value) => value + 1);
      setAnswer(null);
      setResult(null);
      setAiNote(null);
    } else {
      void finish();
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (result) next();
    else void check();
  }

  // Тренировать нечего. Проверяем здесь, а не на странице: после каждого ответа страница
  // обновляется, и исправленные ошибки пропадают из данных — тренировка не должна исчезнуть.
  if (items.length === 0) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
        <Otti size={96} mood="wink" />
        <h1 className="text-2xl font-black">Тренировать нечего</h1>
        <p className="text-muted-foreground">
          Все ошибки исправлены. Если ошибёшься в уроке, задание появится здесь.
        </p>
        <Button asChild size="lg">
          <Link href="/mistakes">К списку ошибок</Link>
        </Button>
      </main>
    );
  }

  if (phase === "saving") {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
        <Otti size={96} mood="happy" />
        <p role="status" className="flex items-center gap-2 font-bold text-muted-foreground">
          <LoaderCircle className="size-5 animate-spin" aria-hidden />
          Сохраняем результат…
        </p>
      </main>
    );
  }

  if (phase === "summary") {
    const fixed = Object.values(outcomes).filter(Boolean).length;
    const notFixed = items.filter((item) => outcomes[item.exercise.id] === false);
    const remaining = Math.max(0, totalOpen - fixed);
    const allFixed = fixed === items.length;

    return (
      <main className="mx-auto flex w-full max-w-md flex-col gap-5 px-4 pt-10 pb-16">
        {allFixed && <Confetti />}
        <PlayOnMount sound={achievements.length > 0 ? "achievement" : "complete"} />
        <div className="flex flex-col items-center gap-2 text-center">
          <Otti size={104} mood={allFixed ? "joy" : "happy"} className="animate-celebrate" />
          <h1 className="text-3xl font-black tracking-tight">Тренировка окончена</h1>
          {topicTitle && <p className="font-bold">Тема: {topicTitle}</p>}
          <p className="text-muted-foreground">
            {allFixed
              ? "Все задания решены правильно!"
              : `Исправлено ${fixed} из ${items.length}`}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          <SummaryStat icon={Check} value={String(fixed)} label="исправлено" iconClass="text-success" />
          <SummaryStat icon={RotateCcw} value={String(remaining)} label="осталось" iconClass="text-streak" />
          <SummaryStat icon={Zap} value={`+${xp}`} label="XP" iconClass="text-xp" />
        </div>

        <NewAchievements items={achievements} />

        {goalReached && (
          <Card className="flex-row items-center gap-3">
            <Flame className="animate-flame size-7 shrink-0 fill-streak/30 text-streak" aria-hidden />
            <p className="font-extrabold">Цель дня выполнена!</p>
          </Card>
        )}

        {notFixed.length > 0 && (
          <Card className="gap-2">
            <p className="font-bold">Пока не получилось — эти задания остались в списке ошибок:</p>
            <ul className="flex flex-col gap-1 text-muted-foreground">
              {notFixed.map((item) => {
                const question = getExerciseQuestion(item.exercise);
                return (
                  <li key={item.exercise.id} lang={question.lang}>
                    {question.text}
                  </li>
                );
              })}
            </ul>
          </Card>
        )}

        {failed && (
          <p role="alert" className="text-sm font-semibold text-destructive">
            Часть ответов не сохранилась — проверь интернет. Эти задания останутся в списке ошибок.
          </p>
        )}

        <div className="flex flex-col gap-3">
          {remaining > 0 ? (
            <>
              <Button asChild size="lg">
                <Link href={moreHref}>Тренировать ещё</Link>
              </Button>
              <p className="-mt-1 text-center text-sm text-muted-foreground">
                Ждут исправления: {withPlural(remaining, MISTAKES)}
              </p>
            </>
          ) : null}
          <Button asChild size="lg" variant={remaining > 0 ? "outline" : "default"}>
            <Link href="/mistakes">К списку ошибок</Link>
          </Button>
          <Button asChild size="lg" variant="ghost">
            <Link href="/learn">На главную</Link>
          </Button>
        </div>
      </main>
    );
  }

  if (!current) return null;
  const { exercise } = current.item;

  return (
    <form onSubmit={handleSubmit} className="flex min-h-dvh flex-col">
      {/* Верх: выход и прогресс */}
      <header className="mx-auto flex w-full max-w-2xl items-center gap-3 px-4 pt-4">
        <h1 className="sr-only">Работа над ошибками: тренировка</h1>
        <Button asChild variant="ghost" size="icon" aria-label="Закончить тренировку">
          <Link href="/mistakes">
            <X className="size-6" />
          </Link>
        </Button>
        <Progress
          value={firstPassDone}
          max={items.length}
          label={`Решено заданий: ${firstPassDone} из ${items.length}`}
          className="h-4 flex-1"
          barClassName="bg-streak"
        />
        <span className="w-10 text-right text-sm font-bold text-muted-foreground tabular-nums">
          {firstPassDone}/{items.length}
        </span>
        <SoundToggleButton />
      </header>

      {/* Задание */}
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 px-4 pt-6 pb-8">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <Badge variant="muted">
              Урок {current.item.lessonNumber} · {current.item.topicTitle}
            </Badge>
            {current.repeat && (
              <Badge>
                <RotateCcw aria-hidden />
                Ещё раз
              </Badge>
            )}
          </div>
          <h2
            ref={headingRef}
            tabIndex={-1}
            className="text-lg font-extrabold text-muted-foreground outline-none"
          >
            {exercise.prompt}
          </h2>
        </div>

        <div
          key={exercise.id}
          data-exercise-id={exercise.id}
          className={cn("-mx-2 rounded-3xl px-2 py-2", result ? (result.correct ? "animate-correct" : "animate-sway") : "animate-card-in")}
        >
          <ExerciseView
            key={current.key}
            exercise={exercise}
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
            exercise={exercise}
            result={result}
            seed={checksCount}
            willRepeat={willRepeat}
            isLast={isLast}
            onNext={next}
            repeatNote="Вернёмся к этому заданию в конце тренировки."
            aiNote={aiNote}
          />
        ) : (
          <div className="border-t-2 bg-background pb-[env(safe-area-inset-bottom)]">
            <div className="mx-auto flex w-full max-w-2xl gap-3 px-4 py-4">
              {canSkip(exercise) && (
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
    </form>
  );
}

function SummaryStat({
  icon: Icon,
  value,
  label,
  iconClass,
}: {
  icon: typeof Check;
  value: string;
  label: string;
  iconClass: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl border-2 bg-card px-2 py-4 text-center">
      <Icon className={cn("size-6", iconClass)} aria-hidden />
      <p className="text-2xl font-black tabular-nums">{value}</p>
      <p className="text-xs font-bold text-muted-foreground">{label}</p>
    </div>
  );
}
