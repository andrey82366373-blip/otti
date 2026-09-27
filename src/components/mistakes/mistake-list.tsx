"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, CircleCheck, CircleX } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type MistakeView = {
  id: string;
  prompt: string;
  question: { text: string; lang: "en" | "ru" };
  kind: "pairs" | "open" | "other";
  userAnswer: string;
  correctAnswer: string;
  answerLang?: "en" | "ru";
  errorTitle: string;
  topic: string;
  topicTitle: string;
  lessonId: string;
  lessonNumber: number;
  timesWrong: number;
  dateLabel: string;
  resolved: boolean;
  /** Для сортировки: когда ошиблись последний раз или когда исправили. */
  time: number;
};

type Tab = "open" | "resolved";

/** Список ошибок: «Исправить» — по темам, «Исправлено» — последние исправленные. */
export function MistakeList({ mistakes }: { mistakes: MistakeView[] }) {
  const open = useMemo(() => mistakes.filter((item) => !item.resolved), [mistakes]);
  const resolved = useMemo(
    () => mistakes.filter((item) => item.resolved).sort((a, b) => b.time - a.time),
    [mistakes],
  );
  const [tab, setTab] = useState<Tab>(open.length > 0 ? "open" : "resolved");

  // Группы по темам: сначала темы, где ошибок больше
  const groups = useMemo(() => {
    const byTopic = new Map<string, MistakeView[]>();
    for (const item of open) {
      const list = byTopic.get(item.topic) ?? [];
      list.push(item);
      byTopic.set(item.topic, list);
    }
    return [...byTopic.values()]
      .map((list) => list.sort((a, b) => b.time - a.time))
      .sort((a, b) => b.length - a.length || a[0].topicTitle.localeCompare(b[0].topicTitle, "ru"));
  }, [open]);

  return (
    <div className="flex flex-col gap-4">
      <div role="group" aria-label="Показать ошибки" className="flex flex-wrap gap-2">
        {(
          [
            ["open", `Исправить · ${open.length}`],
            ["resolved", `Исправлено · ${resolved.length}`],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            aria-pressed={tab === value}
            onClick={() => setTab(value)}
            className={cn(
              "rounded-full border-2 px-3.5 py-1.5 text-sm font-bold transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
              tab === value
                ? "border-primary bg-secondary text-secondary-foreground"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "open" ? (
        open.length === 0 ? (
          <p className="py-6 text-center text-muted-foreground">
            Все ошибки исправлены. Отличная работа!
          </p>
        ) : (
          groups.map((list) => (
            <section key={list[0].topic} aria-label={list[0].topicTitle} className="flex flex-col gap-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-extrabold">
                  {list[0].topicTitle}{" "}
                  <span className="font-bold text-muted-foreground">· {list.length}</span>
                </h2>
                {groups.length > 1 && (
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/mistakes/train?topic=${encodeURIComponent(list[0].topic)}`}>
                      Тренировать тему
                    </Link>
                  </Button>
                )}
              </div>
              <ul className="flex flex-col gap-2.5">
                {list.map((item) => (
                  <MistakeCard key={item.id} item={item} />
                ))}
              </ul>
            </section>
          ))
        )
      ) : resolved.length === 0 ? (
        <p className="py-6 text-center text-muted-foreground">
          Пока ничего не исправлено. Реши задание из списка правильно — и оно появится здесь.
        </p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {resolved.map((item) => (
            <MistakeCard key={item.id} item={item} />
          ))}
        </ul>
      )}
    </div>
  );
}

function MistakeCard({ item }: { item: MistakeView }) {
  const pairsAnswer = item.kind === "pairs" ? item.userAnswer.replace(/^Ошибки: /, "") : null;

  return (
    <li className="flex flex-col gap-2 rounded-2xl border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-bold text-muted-foreground">{item.prompt}</p>
        <Badge variant={item.resolved ? "river" : "muted"}>
          {item.resolved ? "Исправлено" : item.errorTitle}
        </Badge>
      </div>

      <p lang={item.question.lang} className="text-lg leading-snug font-extrabold break-words">
        {item.question.text}
      </p>

      <div className="flex flex-col gap-1 text-sm">
        {!item.resolved && (
          <p className="flex gap-2">
            <CircleX className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
            <span className="min-w-0 break-words">
              <span className="text-muted-foreground">
                {item.kind === "pairs" ? "Неверные пары: " : "Твой ответ: "}
              </span>
              {pairsAnswer !== null ? (
                pairsAnswer
              ) : item.userAnswer ? (
                <span lang={item.answerLang} className="line-through decoration-destructive/60">
                  {item.userAnswer}
                </span>
              ) : (
                "«Не знаю»"
              )}
            </span>
          </p>
        )}
        <p className="flex gap-2">
          <CircleCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
          <span className="min-w-0 break-words">
            <span className="text-muted-foreground">
              {item.kind === "open" ? "Можно ответить так: " : "Правильно: "}
            </span>
            <span lang={item.answerLang} className="font-bold">
              {item.correctAnswer}
            </span>
          </span>
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span>
          Урок {item.lessonNumber}
          {item.resolved && ` · ${item.topicTitle}`}
          {!item.resolved && item.timesWrong > 1 && ` · ошибок в задании: ${item.timesWrong}`} ·{" "}
          {item.dateLabel}
        </span>
        <Link
          href={`/lesson/${item.lessonId}`}
          className="inline-flex items-center gap-1 rounded font-bold text-primary outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <BookOpen className="size-3.5" aria-hidden />
          Правило в уроке
        </Link>
      </div>
    </li>
  );
}
