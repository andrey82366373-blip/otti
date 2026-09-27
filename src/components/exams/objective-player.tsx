"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CircleCheck,
  Clock,
  GraduationCap,
  LoaderCircle,
  RotateCcw,
  Target,
  Timer,
  Zap,
} from "lucide-react";

import { FormError } from "@/components/auth/form-parts";
import { BandBadge, InfoNote, TimerDisplay, formatDuration, useElapsed } from "@/components/exams/exam-ui";
import { ListeningAudio, type AudioStatus } from "@/components/exams/listening-audio";
import { QuestionGroupView, type Answers } from "@/components/exams/question-views";
import { AnimatedNumber } from "@/components/motion/animated-number";
import { useFeedbackPrefs } from "@/components/motion/feedback-prefs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { QUESTION_KIND_TITLES, type QuestionKind, type ScriptLine } from "@/content/ielts/types";
import { submitObjective, type ObjectiveResult } from "@/lib/actions/exams";
import {
  OBJECTIVE_ESTIMATE_NOTE,
  matchesExpected,
  type AnswerValue,
  type PublicGroup,
  type ReviewDetail,
} from "@/lib/exams/ielts";
import { cn } from "@/lib/utils";

export type PlayerTask = {
  id: string;
  title: string;
  about: string;
  level: string;
  minutes: number;
  paragraphs?: { label: string; text: string }[];
  script?: ScriptLine[];
  groups: PublicGroup[];
};

type Mode = "practice" | "exam" | "diagnostic";
type Phase = "intro" | "doing" | "saving" | "review";
type Success = Extract<ObjectiveResult, { ok: true }>;

function storageKey(taskId: string) {
  return `otti:ielts-progress:${taskId}`;
}

function readSaved(taskId: string): { mode: Mode; answers: Answers } | null {
  try {
    const raw = window.localStorage.getItem(storageKey(taskId));
    if (!raw) return null;
    const value = JSON.parse(raw) as { mode?: unknown; answers?: unknown };
    if ((value.mode === "practice" || value.mode === "exam") && value.answers && typeof value.answers === "object") {
      return { mode: value.mode, answers: value.answers as Answers };
    }
  } catch {
    // повреждённые данные — начинаем заново
  }
  return null;
}

function writeSaved(taskId: string, value: { mode: Mode; answers: Answers } | null) {
  try {
    if (value) window.localStorage.setItem(storageKey(taskId), JSON.stringify(value));
    else window.localStorage.removeItem(storageKey(taskId));
  } catch {
    // без хранилища просто не сохраняем
  }
}

/**
 * Задание Reading или Listening: выбор режима, таймер, вопросы, проверка на сервере,
 * подробный разбор каждой ошибки и «работа над ошибками».
 */
export function ObjectivePlayer({
  skill,
  task,
  backHref,
  diagnostic,
  onDiagnosticDone,
}: {
  skill: "reading" | "listening";
  task: PlayerTask;
  backHref: string;
  /** Часть диагностики: без выбора режима и без «работы над ошибками». */
  diagnostic?: boolean;
  onDiagnosticDone?: (result: Success) => void;
}) {
  const router = useRouter();
  const { play } = useFeedbackPrefs();
  const [phase, setPhase] = useState<Phase>(diagnostic ? "doing" : "intro");
  const [mode, setMode] = useState<Mode>(diagnostic ? "diagnostic" : "practice");
  const [answers, setAnswers] = useState<Answers>({});
  const [result, setResult] = useState<Success | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [tab, setTab] = useState<"text" | "questions">("text");
  const [audioStatus, setAudioStatus] = useState<AudioStatus>("idle");
  const [retry, setRetry] = useState<{ answers: Answers; checked: boolean } | null>(null);
  const [restored, setRestored] = useState(false);
  const submittingRef = useRef(false);
  const autoSubmittedRef = useRef(false);

  const totalElapsed = useElapsed(phase === "doing");
  // Секундомер общий для всех попыток на странице: время попытки считаем от её начала
  const [offset, setOffset] = useState(0);
  const elapsed = Math.max(0, totalElapsed - offset);
  const limitSeconds = mode === "practice" ? null : task.minutes * 60;
  const allIds = useMemo(() => task.groups.flatMap((group) => group.questions.map((question) => question.id)), [task.groups]);
  // Номер первого вопроса каждой группы: 1, 6, 11…
  const groupStarts = useMemo(
    () =>
      task.groups.reduce<number[]>(
        (list, group, index) => [...list, index === 0 ? 1 : list[index - 1] + task.groups[index - 1].questions.length],
        [],
      ),
    [task.groups],
  );
  const answered = allIds.filter((id) => answers[id] !== undefined && answers[id] !== null && answers[id] !== "").length;
  const review = useMemo(
    () => (result ? new Map(result.details.map((detail) => [detail.questionId, detail])) : null),
    [result],
  );

  // Незаконченное задание переживает обновление страницы
  useEffect(() => {
    if (diagnostic || restored) return;
    const saved = readSaved(task.id);
    queueMicrotask(() => {
      setRestored(true);
      if (saved && Object.keys(saved.answers).length > 0) {
        setMode(saved.mode);
        setAnswers(saved.answers);
        setPhase("doing");
      }
    });
  }, [task.id, diagnostic, restored]);

  useEffect(() => {
    if (diagnostic || phase !== "doing") return;
    writeSaved(task.id, { mode, answers });
  }, [answers, mode, phase, task.id, diagnostic]);

  const submit = useCallback(async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setConfirmSubmit(false);
    setPhase("saving");
    setError(null);
    try {
      const response = await submitObjective({
        skill,
        taskId: task.id,
        mode,
        answers,
        durationSec: elapsed,
      });
      if (!response.ok) {
        setError(response.error);
        setPhase("doing");
        return;
      }
      writeSaved(task.id, null);
      setResult(response);
      setPhase("review");
      play(response.correct / Math.max(1, response.total) >= 0.6 ? "complete" : "correct");
      window.scrollTo({ top: 0, behavior: "smooth" });
      if (diagnostic) onDiagnosticDone?.(response);
      else router.refresh();
    } catch {
      setError("Нет связи с сервером. Ответы сохранены на этой странице — нажми «Сдать» ещё раз.");
      setPhase("doing");
    } finally {
      submittingRef.current = false;
    }
  }, [answers, diagnostic, elapsed, mode, onDiagnosticDone, play, router, skill, task.id]);

  // В режиме экзамена по окончании времени ответы сдаются сами
  useEffect(() => {
    if (phase === "doing" && limitSeconds !== null && elapsed >= limitSeconds && !submittingRef.current && !autoSubmittedRef.current) {
      autoSubmittedRef.current = true;
      queueMicrotask(() => void submit());
    }
  }, [elapsed, limitSeconds, phase, submit]);

  function start(nextMode: Mode) {
    autoSubmittedRef.current = false;
    setOffset(totalElapsed);
    setMode(nextMode);
    setAnswers({});
    setPhase("doing");
    window.scrollTo({ top: 0 });
  }

  function change(id: string, value: AnswerValue) {
    setAnswers((current) => ({ ...current, [id]: value }));
  }

  function restart() {
    setResult(null);
    setRetry(null);
    setAnswers({});
    setPhase("intro");
    setAudioStatus("idle");
    window.scrollTo({ top: 0 });
  }

  const wrong = result ? result.details.filter((detail) => !detail.correct) : [];

  /* ───────────── Экран выбора режима ───────────── */
  if (phase === "intro") {
    const questionsCount = allIds.length;
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 pt-6 pb-16">
        <Link href={backHref} className="flex items-center gap-1.5 text-sm font-bold text-primary hover:underline">
          <ArrowLeft className="size-4" aria-hidden />
          Все задания
        </Link>
        <div className="animate-card-in flex flex-col gap-2">
          <p className="text-xs font-extrabold tracking-wide text-river uppercase">
            IELTS {skill === "reading" ? "Reading" : "Listening"} · {task.level}
          </p>
          <h1 lang="en" className="text-3xl font-black tracking-tight">
            {task.title}
          </h1>
          <p className="text-muted-foreground">{task.about}</p>
          <p className="text-sm font-bold">
            {questionsCount} вопросов · около {task.minutes} мин
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => start("practice")}
            className="animate-card-in flex flex-col gap-2 rounded-2xl border-2 bg-card p-4 text-left transition-colors outline-none hover:border-primary/50 focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <GraduationCap className="size-6 text-primary" aria-hidden />
            <span className="text-lg font-black">Учебный режим</span>
            <span className="text-sm text-muted-foreground">
              Без ограничения времени, с подсказками по типам вопросов.
              {skill === "listening" ? " Запись можно ставить на паузу и переслушивать." : ""}
            </span>
          </button>
          <button
            type="button"
            onClick={() => start("exam")}
            className="animate-card-in flex flex-col gap-2 rounded-2xl border-2 bg-card p-4 text-left transition-colors outline-none hover:border-primary/50 focus-visible:ring-[3px] focus-visible:ring-ring/50"
            style={{ animationDelay: "80ms" }}
          >
            <Timer className="size-6 text-streak" aria-hidden />
            <span className="text-lg font-black">Как на экзамене</span>
            <span className="text-sm text-muted-foreground">
              Таймер {task.minutes} мин, без подсказок.
              {skill === "listening" ? " Запись звучит один раз." : ""} По окончании времени ответы сдаются сами.
            </span>
          </button>
        </div>
      </main>
    );
  }

  /* ───────────── Шапка задания ───────────── */
  const header = (
    <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-2 px-3 py-2 sm:px-4">
        {!diagnostic && (
          <Button asChild variant="ghost" size="icon" aria-label="Выйти к списку заданий">
            <Link href={backHref}>
              <ArrowLeft className="size-5" />
            </Link>
          </Button>
        )}
        <div className="min-w-0 flex-1">
          <h1 lang="en" className="truncate text-base font-extrabold">
            {task.title}
          </h1>
          <p className="text-xs text-muted-foreground">
            {phase === "review"
              ? "Разбор ответов"
              : `${mode === "practice" ? "Учебный режим" : mode === "exam" ? "Режим экзамена" : "Диагностика"} · отвечено ${answered} из ${allIds.length}`}
          </p>
        </div>
        {phase === "doing" && <TimerDisplay elapsed={elapsed} limitSeconds={limitSeconds} />}
        {phase === "doing" && (
          <Button
            type="button"
            size="sm"
            onClick={() => (answered < allIds.length ? setConfirmSubmit(true) : void submit())}
          >
            Сдать
          </Button>
        )}
      </div>
      {phase !== "review" && skill === "reading" && (
        <div className="border-t px-4 py-2 lg:hidden">
          <div role="tablist" aria-label="Текст или вопросы" className="mx-auto grid max-w-md grid-cols-2 gap-1 rounded-xl bg-muted p-1">
            {(["text", "questions"] as const).map((value) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={tab === value}
                onClick={() => {
                  setTab(value);
                  window.scrollTo({ top: 0 });
                }}
                className={cn(
                  "rounded-lg py-1.5 text-sm font-extrabold transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                  tab === value ? "bg-card shadow-sm" : "text-muted-foreground",
                )}
              >
                {value === "text" ? "Текст" : `Вопросы · ${answered}/${allIds.length}`}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );

  /* ───────────── Текст или запись ───────────── */
  const material =
    skill === "reading" && task.paragraphs ? (
      <article lang="en" className="flex flex-col gap-3 rounded-2xl border-2 bg-card p-4 leading-relaxed">
        <h2 className="text-xl font-black">{task.title}</h2>
        {task.paragraphs.map((paragraph) => (
          <p key={paragraph.label}>
            <span className="mr-2 font-black text-primary">{paragraph.label}</span>
            {paragraph.text}
          </p>
        ))}
      </article>
    ) : task.script ? (
      <ListeningAudio
        script={task.script}
        examMode={mode !== "practice"}
        onStatusChange={setAudioStatus}
        forceTranscript={phase === "review"}
      />
    ) : null;

  const visibleRetry = retry ? new Set(wrong.map((detail) => detail.questionId)) : undefined;
  const retryReview: Map<string, ReviewDetail> | null =
    retry && retry.checked && review
      ? new Map(
          wrong.map((detail) => [
            detail.questionId,
            {
              ...detail,
              correct: matchesExpected(detail.expected, retry.answers[detail.questionId] ?? null),
              given: String(retry.answers[detail.questionId] ?? "") || null,
            },
          ]),
        )
      : null;

  const questionsView = (
    <div className="flex flex-col gap-4">
      {task.groups.map((group, groupIndex) => {
        const start = groupStarts[groupIndex];
        return (
          <QuestionGroupView
            key={group.id}
            group={group}
            startNumber={start}
            answers={retry ? retry.answers : answers}
            onChange={
              retry
                ? (id, value) => setRetry((current) => (current ? { ...current, answers: { ...current.answers, [id]: value } } : current))
                : change
            }
            review={retry ? retryReview : phase === "review" ? review : null}
            visible={visibleRetry}
            showTip={mode === "practice" || Boolean(retry)}
          />
        );
      })}
    </div>
  );

  return (
    <div className="min-h-dvh pb-16">
      {header}

      {phase === "review" && result && (
        <section aria-label="Итог задания" className="mx-auto w-full max-w-6xl px-4 pt-5">
          <ResultSummary
            skill={skill}
            result={result}
            elapsed={elapsed}
            diagnostic={Boolean(diagnostic)}
            onRetry={() => {
              setRetry({ answers: {}, checked: false });
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            onRestart={restart}
            backHref={backHref}
            retrying={Boolean(retry)}
            onStopRetry={() => setRetry(null)}
          />
        </section>
      )}

      <main
        className={cn(
          "mx-auto grid w-full max-w-6xl grid-cols-1 gap-5 px-4 pt-5",
          skill === "reading" ? "lg:grid-cols-2 lg:items-start" : "max-w-3xl",
        )}
      >
        <div
          {...(skill === "reading" ? { tabIndex: 0, role: "region", "aria-label": "Текст задания" } : {})}
          className={cn(
            "min-w-0 rounded-2xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
            skill === "reading" && "lg:sticky lg:top-20 lg:max-h-[calc(100dvh-6rem)] lg:overflow-y-auto",
            skill === "reading" && phase !== "review" && tab === "questions" && "hidden lg:block",
          )}
        >
          {material}
        </div>
        <div className={cn("min-w-0", skill === "reading" && phase !== "review" && tab === "text" && "hidden lg:block")}>
          {skill === "listening" && phase === "doing" && mode !== "practice" && audioStatus === "idle" && (
            <InfoNote className="mb-3">Прочитай вопросы, пока запись не началась, — на экзамене на это даётся время.</InfoNote>
          )}
          {questionsView}
          {retry && (
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Button type="button" size="lg" onClick={() => setRetry((current) => (current ? { ...current, checked: true } : current))}>
                <CircleCheck aria-hidden />
                Проверить исправления
              </Button>
              <Button type="button" size="lg" variant="outline" onClick={() => setRetry({ answers: {}, checked: false })}>
                <RotateCcw aria-hidden />
                Начать заново
              </Button>
            </div>
          )}
          {phase === "doing" && (
            <div className="mt-4 flex flex-col gap-2">
              <FormError message={error} />
              <Button
                type="button"
                size="lg"
                onClick={() => (answered < allIds.length ? setConfirmSubmit(true) : void submit())}
                className="sm:self-start"
              >
                Сдать ответы
              </Button>
            </div>
          )}
        </div>
      </main>

      {phase === "saving" && (
        <div role="status" className="fixed inset-x-0 bottom-6 z-40 mx-auto flex w-fit items-center gap-2 rounded-full bg-card px-4 py-2 font-bold shadow-lg">
          <LoaderCircle className="size-5 animate-spin" aria-hidden />
          Проверяем ответы…
        </div>
      )}

      {confirmSubmit && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div role="dialog" aria-modal="true" aria-labelledby="submit-title" className="animate-pop flex w-full max-w-sm flex-col gap-3 rounded-2xl bg-card p-6 text-center shadow-xl">
            <h2 id="submit-title" className="text-xl font-black">
              Сдать ответы?
            </h2>
            <p className="text-muted-foreground">
              Без ответа: {allIds.length - answered}. На экзамене за пропуск баллы не снимают — лучше угадать, чем оставить пустым.
            </p>
            <Button type="button" size="lg" onClick={() => void submit()}>
              Сдать
            </Button>
            <Button type="button" variant="ghost" onClick={() => setConfirmSubmit(false)}>
              Вернуться к вопросам
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Итог задания: баллы, примерный Band Score, частые ошибки и что делать дальше. */
function ResultSummary({
  skill,
  result,
  elapsed,
  diagnostic,
  onRetry,
  onRestart,
  backHref,
  retrying,
  onStopRetry,
}: {
  skill: "reading" | "listening";
  result: Success;
  elapsed: number;
  diagnostic: boolean;
  onRetry: () => void;
  onRestart: () => void;
  backHref: string;
  retrying: boolean;
  onStopRetry: () => void;
}) {
  const wrongByKind = new Map<QuestionKind, number>();
  for (const detail of result.details) {
    if (!detail.correct) wrongByKind.set(detail.kind, (wrongByKind.get(detail.kind) ?? 0) + 1);
  }
  const worst = [...wrongByKind.entries()].sort((a, b) => b[1] - a[1])[0];
  const wrongCount = result.total - result.correct;

  return (
    <Card className="animate-card-in gap-4">
      <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
        <div className="flex items-center gap-2">
          <Target className="size-6 text-primary" aria-hidden />
          <div>
            <p className="text-2xl font-black">
              <AnimatedNumber value={result.correct} from={0} /> из {result.total}
            </p>
            <p className="text-xs font-bold text-muted-foreground">верных ответов</p>
          </div>
        </div>
        {result.estimate ? (
          <div>
            <p className="text-xs font-extrabold tracking-wide text-muted-foreground uppercase">Примерный балл</p>
            <BandBadge estimate={result.estimate} />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Для примерного балла нужно больше вопросов.</p>
        )}
        <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
          <Clock className="size-4" aria-hidden />
          {formatDuration(elapsed)}
        </div>
        {result.xpEarned > 0 && (
          <div className="flex items-center gap-1 text-sm font-black">
            <Zap className="size-4 text-xp" aria-hidden />+{result.xpEarned} XP
          </div>
        )}
      </div>
      <InfoNote>{OBJECTIVE_ESTIMATE_NOTE}</InfoNote>
      {worst && (
        <p className="text-sm">
          <span className="font-bold">Больше всего ошибок:</span> {QUESTION_KIND_TITLES[worst[0]]} ({worst[1]}). Прочитай
          разбор ниже — у каждой ошибки есть объяснение и цитата из {skill === "reading" ? "текста" : "записи"}.
        </p>
      )}
      {!diagnostic && (
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {wrongCount > 0 &&
            (retrying ? (
              <Button type="button" variant="outline" onClick={onStopRetry}>
                Показать весь разбор
              </Button>
            ) : (
              <Button type="button" onClick={onRetry}>
                <RotateCcw aria-hidden />
                Работа над ошибками ({wrongCount})
              </Button>
            ))}
          <Button type="button" variant="outline" onClick={onRestart}>
            Пройти заново
          </Button>
          <Button asChild variant="ghost">
            <Link href={backHref}>К списку заданий</Link>
          </Button>
        </div>
      )}
    </Card>
  );
}
