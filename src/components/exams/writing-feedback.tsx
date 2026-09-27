"use client";

import { useState } from "react";
import { CircleCheck, Eye, Lightbulb, PencilLine, TriangleAlert } from "lucide-react";

import { AiDisclaimer, BandBadge } from "@/components/exams/exam-ui";
import { formatBand } from "@/lib/exams/ielts";
import type { CriterionScore, WritingFeedback as Feedback, WritingMistake } from "@/lib/exams/types";
import { cn } from "@/lib/utils";

const TYPE_TITLES: Record<WritingMistake["type"], string> = {
  grammar: "Грамматика",
  vocabulary: "Слова",
  spelling: "Орфография",
  punctuation: "Пунктуация",
  coherence: "Связность",
  task: "Задание",
};

function Criterion({ title, score }: { title: string; score: CriterionScore }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border-2 bg-card p-3">
      <div className="flex items-baseline justify-between gap-2">
        <p lang="en" className="text-sm font-extrabold">
          {title}
        </p>
        <p className="text-xl font-black tabular-nums">≈ {formatBand(score.band)}</p>
      </div>
      <p className="text-sm text-muted-foreground">{score.comment}</p>
    </div>
  );
}

/** Текст ученика с подсвеченными фрагментами, где есть ошибки. */
export function HighlightedText({ text, quotes }: { text: string; quotes: string[] }) {
  const ranges: [number, number, number][] = [];
  const lower = text.toLowerCase();
  quotes.forEach((quote, index) => {
    const start = lower.indexOf(quote.toLowerCase());
    if (start === -1) return;
    const end = start + quote.length;
    if (ranges.some(([from, to]) => start < to && end > from)) return;
    ranges.push([start, end, index]);
  });
  ranges.sort((a, b) => a[0] - b[0]);
  const parts: React.ReactNode[] = [];
  let cursor = 0;
  for (const [start, end, index] of ranges) {
    if (start > cursor) parts.push(text.slice(cursor, start));
    parts.push(
      <mark key={start} className="rounded bg-destructive-soft px-0.5 text-foreground underline decoration-destructive decoration-wavy">
        {text.slice(start, end)}
        <sup className="ml-0.5 text-[10px] font-black text-destructive">{index + 1}</sup>
      </mark>,
    );
    cursor = end;
  }
  if (cursor < text.length) parts.push(text.slice(cursor));
  return (
    <p lang="en" className="whitespace-pre-wrap">
      {parts}
    </p>
  );
}

/**
 * Разбор эссе: баллы по четырём критериям, выполнение задания и ошибки.
 * Исправленный вариант каждой ошибки скрыт — сначала ученик пробует исправить сам.
 */
export function WritingFeedbackView({
  feedback,
  taskNumber,
  checkedText,
  minWords,
}: {
  feedback: Feedback;
  taskNumber: 1 | 2;
  checkedText: string;
  minWords: number;
}) {
  const [revealed, setRevealed] = useState<Set<number>>(new Set());

  return (
    <section aria-labelledby="writing-feedback-title" className="animate-card-in flex flex-col gap-4">
      <h2 id="writing-feedback-title" className="text-xl font-black">
        Разбор от Отти
      </h2>
      <AiDisclaimer />

      <div className="flex flex-wrap items-end justify-between gap-3 rounded-2xl border-2 bg-card p-4">
        <div>
          <p className="text-xs font-extrabold tracking-wide text-muted-foreground uppercase">Примерный балл за текст</p>
          {feedback.overall ? (
            <BandBadge estimate={feedback.overall} size="lg" />
          ) : (
            <p className="mt-1 flex items-start gap-1.5 text-sm font-semibold">
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-streak" aria-hidden />
              Текст слишком короткий для оценки в баллах ({feedback.wordCount} слов). Ниже — разбор ошибок.
            </p>
          )}
        </div>
        <p className={cn("text-sm font-bold", feedback.wordCount < minWords ? "text-destructive" : "text-muted-foreground")}>
          Слов: {feedback.wordCount} (нужно от {minWords})
        </p>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2">
        <Criterion title={taskNumber === 1 ? "Task Achievement" : "Task Response"} score={feedback.task} />
        <Criterion title="Coherence and Cohesion" score={feedback.coherence} />
        <Criterion title="Lexical Resource" score={feedback.lexical} />
        <Criterion title="Grammatical Range and Accuracy" score={feedback.grammar} />
      </div>

      {feedback.taskCheck && (
        <div className="rounded-2xl bg-secondary/60 p-4">
          <p className="mb-1 font-extrabold">Выполнено ли задание</p>
          <p className="text-sm">{feedback.taskCheck}</p>
        </div>
      )}

      {feedback.mistakes.length > 0 ? (
        <div className="flex flex-col gap-3">
          <div>
            <h3 className="flex items-center gap-2 font-black">
              <PencilLine className="size-5 text-primary" aria-hidden />
              Ошибки — попробуй исправить сам
            </h3>
            <p className="text-sm text-muted-foreground">
              Исправь их прямо в тексте выше. Готовый вариант открывай, только если не получается.
            </p>
          </div>
          <details className="rounded-xl border-2 bg-card p-3">
            <summary className="cursor-pointer text-sm font-bold text-primary">Показать ошибки в проверенном тексте</summary>
            <div className="mt-2 text-sm leading-relaxed">
              <HighlightedText text={checkedText} quotes={feedback.mistakes.map((mistake) => mistake.quote)} />
            </div>
          </details>
          <ol className="flex flex-col gap-2.5">
            {feedback.mistakes.map((mistake, index) => (
              <li key={`${mistake.quote}-${index}`} className="flex flex-col gap-1.5 rounded-xl border-2 bg-card p-3">
                <p className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="flex size-6 items-center justify-center rounded-full bg-destructive text-xs font-black text-destructive-foreground">
                    {index + 1}
                  </span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-bold">{TYPE_TITLES[mistake.type]}</span>
                  <span lang="en" className="font-semibold line-through decoration-destructive/60">
                    {mistake.quote}
                  </span>
                </p>
                <p className="flex items-start gap-1.5 text-sm">
                  <Lightbulb className="mt-0.5 size-4 shrink-0 text-xp" aria-hidden />
                  {mistake.hint}
                </p>
                {revealed.has(index) ? (
                  <p className="rounded-lg bg-success-soft px-2.5 py-1.5 text-sm">
                    <span className="font-bold">Вариант исправления: </span>
                    <span lang="en">{mistake.correction}</span>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => setRevealed((set) => new Set(set).add(index))}
                    className="flex items-center gap-1.5 self-start rounded-lg px-1 text-sm font-bold text-primary outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  >
                    <Eye className="size-4" aria-hidden />
                    Показать исправление
                  </button>
                )}
              </li>
            ))}
          </ol>
        </div>
      ) : (
        <p className="flex items-center gap-2 font-semibold text-success">
          <CircleCheck className="size-5" aria-hidden />
          Серьёзных ошибок Отти не нашёл.
        </p>
      )}

      {(feedback.strengths.length > 0 || feedback.improvements.length > 0) && (
        <div className="grid gap-3 sm:grid-cols-2">
          {feedback.strengths.length > 0 && (
            <div className="rounded-xl border-2 bg-card p-3">
              <p className="mb-1 font-extrabold">Что получилось</p>
              <ul className="list-disc space-y-1 pl-5 text-sm">
                {feedback.strengths.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}
          {feedback.improvements.length > 0 && (
            <div className="rounded-xl border-2 bg-card p-3">
              <p className="mb-1 font-extrabold">Как поднять балл</p>
              <ul className="list-disc space-y-1 pl-5 text-sm">
                {feedback.improvements.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
