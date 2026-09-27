"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CircleCheck, CloudOff, ListChecks, LoaderCircle, Sparkles, Timer } from "lucide-react";

import { InfoNote, TimerDisplay, useElapsed } from "@/components/exams/exam-ui";
import { ChartView } from "@/components/exams/chart-view";
import { WritingFeedbackView } from "@/components/exams/writing-feedback";
import { useFeedbackPrefs } from "@/components/motion/feedback-prefs";
import { Button } from "@/components/ui/button";
import type { ChartSpec } from "@/content/ielts/types";
import { checkWriting, getCheckStatus, saveExamDraft } from "@/lib/actions/exams";
import { countWords } from "@/lib/exams/ielts";
import type { WritingFeedback } from "@/lib/exams/types";
import { cn } from "@/lib/utils";

export type WritingTaskView = {
  id: string;
  task: 1 | 2;
  title: string;
  kindTitle: string;
  prompt: string;
  chart?: ChartSpec;
  minWords: number;
  minutes: number;
  structure: { title: string; text: string }[];
  phrases: string[];
};

export type InitialCheck = {
  checkId: string;
  status: "done" | "pending";
  feedback: WritingFeedback | null;
  content: string;
};

type SaveState = "idle" | "saving" | "saved" | "offline";

function draftKey(taskId: string) {
  return `otti:ielts-draft:${taskId}`;
}

/**
 * Рабочее место Writing: задание, таймер, счётчик слов, автосохранение черновика,
 * проверка ИИ (один раз на один и тот же текст) и разбор ошибок.
 */
export function WritingWorkspace({
  task,
  initialDraft,
  initialCheck,
  remaining: initialRemaining,
  limit,
  backHref,
  embedded = false,
  onChecked,
}: {
  task: WritingTaskView;
  initialDraft: string;
  initialCheck: InitialCheck | null;
  remaining: number;
  limit: number;
  backHref: string;
  /** Внутри диагностики: без шапки и ссылок. */
  embedded?: boolean;
  onChecked?: (feedback: WritingFeedback) => void;
}) {
  const router = useRouter();
  const { play } = useFeedbackPrefs();
  const [text, setText] = useState(initialDraft);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [examTimer, setExamTimer] = useState(false);
  const [typing, setTyping] = useState(initialDraft.length > 0);
  const [checking, setChecking] = useState(initialCheck?.status === "pending");
  const [pendingId, setPendingId] = useState<string | null>(initialCheck?.status === "pending" ? initialCheck.checkId : null);
  const [feedback, setFeedback] = useState<WritingFeedback | null>(initialCheck?.feedback ?? null);
  const [checkedText, setCheckedText] = useState(initialCheck?.status === "done" ? initialCheck.content : "");
  const [remaining, setRemaining] = useState(initialRemaining);
  const [message, setMessage] = useState<{ text: string; requestId?: string; tone: "error" | "info" } | null>(null);
  const [restored, setRestored] = useState(false);
  const saveTimer = useRef<number | null>(null);
  const checkingRef = useRef(false);

  const elapsed = useElapsed(typing);
  const words = countWords(text);
  const changedSinceCheck = feedback !== null && text.trim() !== checkedText.trim();

  // Черновик из этого браузера новее серверного (например, не успел сохраниться без интернета)
  useEffect(() => {
    if (restored) return;
    let local: string | null = null;
    try {
      local = window.localStorage.getItem(draftKey(task.id));
    } catch {
      local = null;
    }
    queueMicrotask(() => {
      setRestored(true);
      if (local && local !== initialDraft && local.length > 0) setText(local);
    });
  }, [initialDraft, restored, task.id]);

  const persist = useCallback(
    (value: string) => {
      try {
        window.localStorage.setItem(draftKey(task.id), value);
      } catch {
        // без хранилища — только сервер
      }
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
      setSaveState("saving");
      saveTimer.current = window.setTimeout(() => {
        saveExamDraft({ taskId: task.id, text: value })
          .then((result) => setSaveState(result.ok ? "saved" : "offline"))
          .catch(() => setSaveState("offline"));
      }, 1500);
    },
    [task.id],
  );

  // Проверка идёт (например, страницу обновили во время проверки) — ждём результат
  useEffect(() => {
    if (!pendingId) return;
    let cancelled = false;
    const startedAt = Date.now();
    const poll = async () => {
      if (cancelled) return;
      try {
        const status = await getCheckStatus({ checkId: pendingId });
        if (cancelled) return;
        if (status.status === "done" && status.writing) {
          setFeedback(status.writing);
          setCheckedText(text);
          setPendingId(null);
          setChecking(false);
          play("complete");
          return;
        }
        if (status.status === "missing" || Date.now() - startedAt > 3 * 60 * 1000) {
          setPendingId(null);
          setChecking(false);
          setMessage({ text: "Проверка не завершилась. Нажми «Проверить» ещё раз.", tone: "error" });
          return;
        }
      } catch {
        // нет связи — попробуем ещё раз
      }
      window.setTimeout(poll, 3000);
    };
    const timer = window.setTimeout(poll, 2000);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [pendingId, play, text]);

  async function check() {
    if (checkingRef.current || checking) return;
    checkingRef.current = true;
    setChecking(true);
    setMessage(null);
    const value = text;
    try {
      const result = await checkWriting({ taskId: task.id, text: value, durationSec: elapsed });
      if (result.ok) {
        setFeedback(result.feedback);
        setCheckedText(value);
        setRemaining(result.remaining);
        setChecking(false);
        play("complete");
        if (result.cached) setMessage({ text: "Этот текст уже проверялся — показываем сохранённый разбор. Лимит не потрачен.", tone: "info" });
        onChecked?.(result.feedback);
        if (!embedded) router.refresh();
        window.setTimeout(() => document.getElementById("writing-feedback-title")?.scrollIntoView({ behavior: "smooth" }), 100);
        return;
      }
      if (result.code === "pending" && result.checkId) {
        setPendingId(result.checkId);
        setMessage({ text: result.error, tone: "info" });
        return;
      }
      setChecking(false);
      setMessage({ text: result.error, requestId: result.requestId, tone: "error" });
    } catch {
      setChecking(false);
      setMessage({
        text: "Нет связи с сервером. Черновик сохранён на этом устройстве — проверь, когда интернет вернётся.",
        tone: "error",
      });
    } finally {
      checkingRef.current = false;
    }
  }

  const limitSeconds = examTimer ? task.minutes * 60 : null;

  return (
    <div className={cn(!embedded && "min-h-dvh pb-16")}>
      {!embedded && (
        <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
          <div className="mx-auto flex w-full max-w-3xl items-center gap-2 px-3 py-2 sm:px-4">
            <Button asChild variant="ghost" size="icon" aria-label="К списку заданий">
              <Link href={backHref}>
                <ArrowLeft className="size-5" />
              </Link>
            </Button>
            <div className="min-w-0 flex-1">
              <p className="truncate font-extrabold">
                Writing Task {task.task}: {task.title}
              </p>
              <p className="text-xs text-muted-foreground">{task.kindTitle}</p>
            </div>
            <TimerDisplay elapsed={elapsed} limitSeconds={limitSeconds} />
          </div>
        </header>
      )}

      <main className={cn("mx-auto flex w-full max-w-3xl flex-col gap-5", !embedded && "px-4 pt-5")}>
        <section className="flex flex-col gap-3 rounded-2xl border-2 bg-card p-4">
          <p lang="en" className="whitespace-pre-wrap">
            {task.prompt}
          </p>
          {task.chart && <ChartView chart={task.chart} />}
        </section>

        <details className="rounded-2xl border-2 bg-card p-4">
          <summary className="flex cursor-pointer items-center gap-2 font-extrabold text-primary">
            <ListChecks className="size-5" aria-hidden />
            Как построить ответ и полезные фразы
          </summary>
          <ol className="mt-3 flex flex-col gap-2 text-sm">
            {task.structure.map((step) => (
              <li key={step.title}>
                <p className="font-bold">{step.title}</p>
                <p className="text-muted-foreground">{step.text}</p>
              </li>
            ))}
          </ol>
          <p className="mt-3 mb-1 text-sm font-bold">Полезные фразы</p>
          <ul lang="en" className="flex flex-wrap gap-1.5 text-sm">
            {task.phrases.map((phrase) => (
              <li key={phrase} className="rounded-full bg-muted px-2.5 py-1">
                {phrase}
              </li>
            ))}
          </ul>
        </details>

        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label htmlFor="essay" className="font-extrabold">
              Твой ответ
            </label>
            {!embedded && (
              <button
                type="button"
                onClick={() => setExamTimer((value) => !value)}
                aria-pressed={examTimer}
                className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-bold text-primary outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                <Timer className="size-4" aria-hidden />
                {examTimer ? "Таймер экзамена включён" : `Включить таймер экзамена (${task.minutes} мин)`}
              </button>
            )}
          </div>
          <textarea
            id="essay"
            lang="en"
            value={text}
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="sentences"
            onChange={(event) => {
              const value = event.target.value.slice(0, 12_000);
              setText(value);
              setTyping(true);
              persist(value);
            }}
            rows={embedded ? 8 : 14}
            placeholder="Write your answer in English…"
            className="min-h-48 w-full rounded-2xl border-2 bg-card p-4 text-base leading-relaxed outline-none focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-ring/25"
          />
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className={cn("font-bold tabular-nums", words >= task.minWords ? "text-success" : "text-muted-foreground")}>
              Слов: {words} / от {task.minWords}
            </span>
            <span className="flex items-center gap-1 text-muted-foreground" role="status">
              {saveState === "saving" && "Сохраняем черновик…"}
              {saveState === "saved" && (
                <>
                  <CircleCheck className="size-4 text-success" aria-hidden />
                  Черновик сохранён
                </>
              )}
              {saveState === "offline" && (
                <>
                  <CloudOff className="size-4" aria-hidden />
                  Сохранено на этом устройстве
                </>
              )}
            </span>
          </div>
        </div>

        {message && (
          <div
            role={message.tone === "error" ? "alert" : "status"}
            className={cn(
              "rounded-xl px-3 py-2 text-sm font-semibold",
              message.tone === "error" ? "bg-destructive-soft text-destructive" : "bg-muted",
            )}
          >
            {message.text}
            {message.requestId && <span className="block text-xs font-normal">Код ошибки: {message.requestId}</span>}
          </div>
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button
            type="button"
            size="lg"
            onClick={() => void check()}
            disabled={checking || words < 20 || (feedback !== null && !changedSinceCheck)}
          >
            {checking ? <LoaderCircle className="animate-spin" aria-hidden /> : <Sparkles aria-hidden />}
            {checking ? "Отти проверяет… (до минуты)" : feedback ? "Проверить исправленный текст" : "Проверить с Отти"}
          </Button>
          {!embedded && (
            <span className="text-sm text-muted-foreground">
              Проверок сегодня: {remaining} из {limit}. Один и тот же текст проверяется один раз.
            </span>
          )}
        </div>
        {words > 0 && words < task.minWords && !feedback && (
          <InfoNote>На экзамене текст короче {task.minWords} слов теряет баллы за выполнение задания.</InfoNote>
        )}

        {feedback && (
          <WritingFeedbackView
            feedback={feedback}
            taskNumber={task.task}
            checkedText={checkedText || text}
            minWords={task.minWords}
          />
        )}
      </main>
    </div>
  );
}
