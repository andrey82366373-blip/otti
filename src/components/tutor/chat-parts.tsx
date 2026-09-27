"use client";

import {
  Check,
  CircleAlert,
  CircleCheck,
  GraduationCap,
  LoaderCircle,
  PencilLine,
  Plus,
  RotateCcw,
  WifiOff,
} from "lucide-react";
import Link from "next/link";

import { SpeakButton } from "@/components/course/speak-button";
import { Otti } from "@/components/otti";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Correction, SessionSummary, SuggestedWord } from "@/db/schema";
import type { ChatMessageView } from "@/lib/tutor/store";
import { cn } from "@/lib/utils";

/** Текст в основном по-русски (например, объяснение или предложение перейти к IELTS). */
function isMostlyRussian(text: string): boolean {
  const cyrillic = (text.match(/[а-яё]/gi) ?? []).length;
  const latin = (text.match(/[a-z]/gi) ?? []).length;
  return cyrillic > latin;
}

/* ───────────────────────────── Сообщение Отти ───────────────────────────── */

export function OttiMessage({
  message,
  showTranslation,
  onToggleTranslation,
  dictionary,
  addingWord,
  onAddWord,
  goalAction,
}: {
  message: ChatMessageView;
  showTranslation: boolean;
  onToggleTranslation: () => void;
  dictionary: Set<string>;
  addingWord: string | null;
  onAddWord: (word: SuggestedWord) => void;
  /** Кнопки «перейти к IELTS» — если Отти предложил сменить цель. */
  goalAction?: GoalActionProps;
}) {
  const russian = isMostlyRussian(message.content);
  return (
    <div className="animate-message-in flex items-start gap-2.5">
      <Otti size={36} className="mt-0.5" />
      <div className="flex max-w-[85%] min-w-0 flex-col gap-1.5">
        <div className="rounded-2xl rounded-tl-sm border bg-card px-4 py-3 shadow-xs">
          <p lang={russian ? "ru" : "en"} className="break-words whitespace-pre-wrap">
            {message.content}
          </p>
          {message.translation && showTranslation && (
            <p className="mt-2 border-t pt-2 text-sm break-words whitespace-pre-wrap text-muted-foreground">
              {message.translation}
            </p>
          )}
        </div>

        {message.action && goalAction && <GoalSwitchCard action={message.action} {...goalAction} />}

        <div className="flex items-center gap-2">
          {!russian && <SpeakButton text={message.content} className="size-8" />}
          {message.translation && (
            <button
              type="button"
              onClick={onToggleTranslation}
              aria-pressed={showTranslation}
              className="rounded-lg px-2 py-1 text-xs font-bold text-primary outline-none hover:bg-secondary focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              {showTranslation ? "Скрыть перевод" : "Перевод"}
            </button>
          )}
        </div>

        {message.words.length > 0 && (
          <ul className="flex flex-wrap gap-1.5" aria-label="Новые слова">
            {message.words.map((word) => {
              const added = dictionary.has(word.en.toLowerCase());
              const adding = addingWord === word.en.toLowerCase();
              return (
                <li key={word.en}>
                  <button
                    type="button"
                    onClick={() => onAddWord(word)}
                    disabled={added || adding}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full border-2 px-3 py-1 text-sm transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                      added
                        ? "border-river/40 bg-river-soft text-river"
                        : "border-border bg-card hover:border-primary/60 hover:bg-secondary/50",
                    )}
                  >
                    {adding ? (
                      <LoaderCircle className="size-3.5 animate-spin" aria-hidden />
                    ) : added ? (
                      <Check className="size-3.5" aria-hidden />
                    ) : (
                      <Plus className="size-3.5 text-primary" aria-hidden />
                    )}
                    <span lang="en" className="font-bold">
                      {word.en}
                    </span>
                    <span className="text-muted-foreground">— {word.ru}</span>
                    <span className="sr-only">{added ? "(уже в словаре)" : "(добавить в словарь)"}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────── Предложение перейти к IELTS ─────────────────────── */

type GoalActionProps = {
  busy: boolean;
  onAnswer: (accept: boolean) => void;
  /** Куда ведёт кнопка после согласия (раздел IELTS). */
  href: string | null;
};

function GoalSwitchCard({
  action,
  busy,
  onAnswer,
  href,
}: GoalActionProps & { action: NonNullable<ChatMessageView["action"]> }) {
  if (action.status === "accepted") {
    return (
      <div className="flex flex-wrap items-center gap-2 rounded-xl bg-success-soft px-3 py-2 text-sm font-bold text-success">
        <CircleCheck className="size-4" aria-hidden />
        Цель изменена: подготовка к IELTS.
        {href && (
          <Link href={href} className="text-primary underline underline-offset-2">
            Открыть подготовку
          </Link>
        )}
      </div>
    );
  }
  if (action.status === "declined") {
    return <p className="px-1 text-xs text-muted-foreground">Хорошо, цель осталась прежней. Продолжаем разговор!</p>;
  }
  return (
    <div className="flex flex-col gap-2 rounded-xl border-2 border-primary/30 bg-secondary/60 p-3">
      <p className="flex items-center gap-1.5 text-sm font-extrabold">
        <GraduationCap className="size-4 text-primary" aria-hidden />
        Перейти в режим подготовки к IELTS?
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="button" size="sm" onClick={() => onAnswer(true)} disabled={busy}>
          {busy && <LoaderCircle className="animate-spin" aria-hidden />}
          Да, готовиться к IELTS
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => onAnswer(false)} disabled={busy}>
          Нет, продолжим разговор
        </Button>
      </div>
    </div>
  );
}

/* ───────────────────────────── Сообщение ученика ───────────────────────────── */

export function UserMessage({ message, pending }: { message: Pick<ChatMessageView, "content" | "correction">; pending?: boolean }) {
  return (
    <div className="animate-message-in flex flex-col items-end gap-1.5">
      <div
        className={cn(
          "max-w-[85%] rounded-2xl rounded-tr-sm bg-primary px-4 py-3 text-primary-foreground",
          pending && "opacity-70",
        )}
      >
        <p className="break-words whitespace-pre-wrap">{message.content}</p>
      </div>
      {message.correction && <CorrectionCard correction={message.correction} />}
    </div>
  );
}

/** Карточка исправления: твой ответ → правильно → почему → естественнее. */
export function CorrectionCard({ correction }: { correction: Correction }) {
  return (
    <div className="animate-pop flex w-full max-w-[85%] flex-col gap-2 rounded-2xl border-2 border-xp/50 bg-xp/10 p-3.5 text-sm">
      <p className="flex items-center gap-1.5 font-extrabold">
        <PencilLine className="size-4" aria-hidden />
        Исправление
      </p>
      <dl className="flex flex-col gap-1.5">
        <div>
          <dt className="inline text-muted-foreground">Твой ответ: </dt>
          <dd lang="en" className="inline break-words line-through decoration-destructive/70">
            {correction.original}
          </dd>
        </div>
        <div>
          <dt className="inline text-muted-foreground">Правильно: </dt>
          <dd className="inline">
            <span lang="en" className="font-bold break-words">
              {correction.corrected}
            </span>
            <SpeakButton text={correction.corrected} className="ml-1.5 inline-flex size-7 align-middle" />
          </dd>
        </div>
        <div>
          <dt className="inline text-muted-foreground">Почему: </dt>
          <dd className="inline break-words">{correction.explanation}</dd>
        </div>
        {correction.natural && (
          <div>
            <dt className="inline text-muted-foreground">Естественнее: </dt>
            <dd lang="en" className="inline break-words">
              {correction.natural}
            </dd>
          </div>
        )}
      </dl>
    </div>
  );
}

/* ─────────────────── Сообщение, которое ещё не доставлено ─────────────────── */

export type OutboxStatus = "sending" | "waiting" | "failed";

/**
 * Сообщение ученика, которое отправляется, ждёт повтора или не отправилось.
 * Текст не теряется: его можно отправить ещё раз или вернуть в поле ввода.
 */
export function OutboxMessage({
  text,
  status,
  error,
  requestId,
  offline,
  countdown,
  canRetry,
  loginHref,
  onRetry,
  onEdit,
}: {
  text: string;
  status: OutboxStatus;
  error: string | null;
  requestId?: string;
  offline: boolean;
  countdown: number | null;
  canRetry: boolean;
  loginHref: string | null;
  onRetry: () => void;
  onEdit: () => void;
}) {
  return (
    <div className="flex flex-col items-end gap-1.5">
      <div
        className={cn(
          "max-w-[85%] rounded-2xl rounded-tr-sm px-4 py-3",
          status === "failed"
            ? "border-2 border-dashed border-destructive/50 bg-card text-foreground"
            : "bg-primary text-primary-foreground opacity-70",
        )}
      >
        <p className="break-words whitespace-pre-wrap">{text}</p>
      </div>
      {status !== "sending" && (
        <div
          role={status === "failed" ? "alert" : "status"}
          className="flex max-w-[92%] flex-col items-end gap-2 text-right text-sm"
        >
          <p className={cn("flex items-start gap-1.5 font-semibold", status === "failed" ? "text-destructive" : "text-muted-foreground")}>
            {offline ? (
              <WifiOff className="mt-0.5 size-4 shrink-0" aria-hidden />
            ) : status === "waiting" ? (
              <LoaderCircle className="mt-0.5 size-4 shrink-0 animate-spin" aria-hidden />
            ) : (
              <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
            )}
            <span>
              {error}
              {countdown !== null && countdown > 0 && ` Отправлю через ${countdown} с.`}
            </span>
          </p>
          {requestId && <p className="text-xs text-muted-foreground">Код ошибки: {requestId}</p>}
          <div className="flex flex-wrap justify-end gap-2">
            {loginHref && (
              <Button asChild size="sm">
                <Link href={loginHref}>Войти снова</Link>
              </Button>
            )}
            {canRetry && (
              <Button type="button" size="sm" variant={loginHref ? "outline" : "default"} onClick={onRetry}>
                <RotateCcw aria-hidden />
                Повторить отправку
              </Button>
            )}
            <Button type="button" size="sm" variant="outline" onClick={onEdit}>
              <PencilLine aria-hidden />
              Изменить текст
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ───────────────────────────── «Отти печатает…» ───────────────────────────── */

export function TypingIndicator({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2.5" role="status">
      <Otti size={36} />
      <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm border bg-card px-4 py-3.5">
        {[0, 1, 2].map((dot) => (
          <span
            key={dot}
            className="size-2 animate-typing rounded-full bg-muted-foreground"
            style={{ animationDelay: `${dot * 0.15}s` }}
            aria-hidden
          />
        ))}
        <span className="sr-only">{label}</span>
      </div>
    </div>
  );
}

/* ───────────────────────────── Итоги занятия ───────────────────────────── */

export function SummaryCard({ summary, xpEarned }: { summary: SessionSummary; xpEarned: number }) {
  const { stats } = summary;
  return (
    <Card className="animate-pop gap-4 border-primary/30 bg-linear-to-br from-secondary to-card">
      <div className="flex items-center gap-3">
        <Otti size={56} mood="wink" />
        <div className="min-w-0">
          <h2 className="text-xl font-black">Итоги занятия</h2>
          <p className="text-sm text-muted-foreground">
            Сообщений: {stats.messages} · исправлений: {stats.corrections} · слов в словарь: {stats.words}
            {xpEarned > 0 && ` · +${xpEarned} XP`}
          </p>
        </div>
      </div>

      <section className="flex flex-col gap-1">
        <h3 className="flex items-center gap-1.5 font-extrabold">
          <CircleCheck className="size-4 text-success" aria-hidden />
          Что получилось
        </h3>
        <p>{summary.wentWell}</p>
      </section>

      {summary.focusOn.length > 0 && (
        <section className="flex flex-col gap-1">
          <h3 className="font-extrabold">Над чем поработать</h3>
          <ul className="list-disc space-y-1 pl-5">
            {summary.focusOn.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="flex flex-col gap-1">
        <h3 className="font-extrabold">Домашнее задание</h3>
        <ol className="list-decimal space-y-1 pl-5">
          {summary.homework.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      </section>
    </Card>
  );
}
