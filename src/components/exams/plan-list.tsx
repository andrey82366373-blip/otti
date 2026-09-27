import Link from "next/link";
import { CircleCheck, Circle, ClipboardCheck, Flag } from "lucide-react";

import { SKILL_ICONS } from "@/components/exams/skill-icons";
import type { PlanSession } from "@/lib/exams/types";
import { cn } from "@/lib/utils";

/** Список занятий плана с отметками о выполнении. */
export function PlanList({
  sessions,
  nextKey,
}: {
  sessions: { session: PlanSession; done: boolean }[];
  /** Ключ следующего занятия (неделя-номер) — подсвечивается. */
  nextKey: string | null;
}) {
  return (
    <ol className="flex flex-col gap-2">
      {sessions.map(({ session, done: isDone }) => {
        const key = `${session.week}-${session.index}`;
        const Icon =
          session.kind === "diagnostic" ? ClipboardCheck : session.kind === "mock" ? Flag : SKILL_ICONS[session.kind];
        const next = key === nextKey;
        return (
          <li key={key}>
            <Link
              href={session.href}
              className={cn(
                "flex items-center gap-3 rounded-xl border-2 p-3 transition-colors outline-none hover:border-primary/40 focus-visible:ring-[3px] focus-visible:ring-ring/50",
                next ? "border-primary bg-secondary/60" : "border-border bg-card",
                isDone && !next && "bg-muted/40",
              )}
            >
              <Icon className="size-5 shrink-0 text-primary" aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="block font-bold">{session.title}</span>
                <span className="block text-xs text-muted-foreground">
                  {session.focus} · ≈{session.minutes} мин
                </span>
              </span>
              {isDone ? (
                <CircleCheck className="size-5 shrink-0 text-success" aria-label="Выполнено" />
              ) : (
                <Circle className="size-5 shrink-0 text-muted-foreground" aria-label="Не выполнено" />
              )}
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
