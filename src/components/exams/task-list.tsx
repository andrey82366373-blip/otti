import Link from "next/link";
import { ArrowLeft, ChevronRight, CircleCheck } from "lucide-react";

import { SKILL_ICONS } from "@/components/exams/skill-icons";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { formatRange } from "@/lib/exams/ielts";
import type { IeltsSkill } from "@/lib/exams/types";

export type TaskListItem = {
  id: string;
  title: string;
  subtitle: string;
  meta: string;
  /** Результат: «9 из 13» или «Band 5.5–6.5». */
  result: string | null;
  attempts: number;
};

export type TaskSection = { title: string; items: TaskListItem[] };

/** Список заданий одного навыка IELTS. */
export function TaskList({
  skill,
  title,
  description,
  sections,
  tips,
}: {
  skill: IeltsSkill;
  title: string;
  description: string;
  sections: TaskSection[];
  tips: string[];
}) {
  const Icon = SKILL_ICONS[skill];
  return (
    <>
      <Link href="/exams/ielts" className="mb-3 flex items-center gap-1.5 text-sm font-bold text-primary hover:underline">
        <ArrowLeft className="size-4" aria-hidden />
        IELTS
      </Link>
      <PageHeader title={title} description={description} />
      <div className="mb-6 rounded-2xl bg-secondary/60 p-4">
        <p className="mb-1.5 font-extrabold">Как устроен этот раздел экзамена</p>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          {tips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </div>
      {sections.map((section) => (
        <section key={section.title} className="mb-6">
          <h2 className="mb-3 text-lg font-black">{section.title}</h2>
          <ul className="flex flex-col gap-2.5">
            {section.items.map((item, index) => (
              <li key={item.id} className="animate-card-in" style={{ animationDelay: `${index * 50}ms` }}>
                <Link
                  href={`/exams/ielts/${skill}/${item.id}`}
                  className="flex items-center gap-3 rounded-2xl border-2 bg-card p-4 transition-colors outline-none hover:border-primary/40 focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                    {item.attempts > 0 ? <CircleCheck className="size-5 text-success" aria-hidden /> : <Icon className="size-5" aria-hidden />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span lang="en" className="block font-extrabold">
                      {item.title}
                    </span>
                    <span className="block text-sm text-muted-foreground">{item.subtitle}</span>
                    <span className="mt-1 flex flex-wrap items-center gap-1.5">
                      <Badge variant="muted">{item.meta}</Badge>
                      {item.result && <Badge variant="river">{item.result}</Badge>}
                    </span>
                  </span>
                  <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}

export function rangeText(low: number | null, high: number | null): string | null {
  return low !== null && high !== null ? `≈ Band ${formatRange({ low, high })}` : null;
}
