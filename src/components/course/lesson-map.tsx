import Link from "next/link";
import { Check, ChevronRight, Lock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { LessonState } from "@/content/course";
import type { Lesson, Section } from "@/content/course/types";
import { cn } from "@/lib/utils";

type LessonMapProps = {
  section: Section;
  states: Map<string, LessonState>;
};

/** Учебная карта раздела: уроки идут друг за другом, как по реке. */
export function LessonMap({ section, states }: LessonMapProps) {
  const total = section.lessons.length;
  const done = section.lessons.filter((lesson) => states.get(lesson.id) === "completed").length;

  return (
    <Card>
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-xs font-extrabold tracking-wide text-river uppercase">
              {section.level} · Раздел {section.number}
            </p>
            <h2 className="text-xl font-black">{section.title}</h2>
            <p className="text-sm text-muted-foreground">{section.description}</p>
          </div>
          <Badge variant={done === total ? "river" : "muted"}>
            {done} из {total} уроков
          </Badge>
        </div>
        <Progress value={done} max={total} label={`Пройдено уроков в разделе: ${done} из ${total}`} barClassName="bg-river" />
      </div>

      <ol className="relative flex flex-col gap-1">
        <span
          aria-hidden
          className="absolute top-8 bottom-8 left-[1.875rem] border-l-2 border-dashed border-river/40"
        />
        {section.lessons.map((lesson, index) => (
          <LessonNode
            key={lesson.id}
            lesson={lesson}
            state={states.get(lesson.id) ?? "locked"}
            previous={section.lessons[index - 1]}
          />
        ))}
      </ol>
    </Card>
  );
}

function LessonNode({
  lesson,
  state,
  previous,
}: {
  lesson: Lesson;
  state: LessonState;
  previous?: Lesson;
}) {
  const circle = (
    <span
      className={cn(
        "relative z-10 flex size-11 shrink-0 items-center justify-center rounded-full text-lg font-black",
        state === "completed" && "bg-success text-white",
        state === "current" &&
          "bg-primary text-primary-foreground shadow-[0_3px_0_0_color-mix(in_oklab,var(--primary)_70%,black)] ring-4 ring-primary/20",
        state === "locked" && "bg-muted text-muted-foreground",
      )}
    >
      {state === "completed" && <Check className="size-5" strokeWidth={3} aria-hidden />}
      {state === "current" && lesson.number}
      {state === "locked" && <Lock className="size-4" aria-hidden />}
    </span>
  );

  const details = (
    <span className="min-w-0 flex-1">
      <span className="block font-extrabold">
        Урок {lesson.number}. {lesson.title}
      </span>
      <span className="block text-sm text-muted-foreground">
        {state === "locked" && previous
          ? `Откроется после урока ${previous.number}`
          : `≈${lesson.durationMin} мин · ${lesson.exercises.length} заданий`}
      </span>
      {state === "completed" && <span className="sr-only">Урок пройден, можно повторить.</span>}
    </span>
  );

  if (state === "locked") {
    return (
      <li className="relative flex items-center gap-4 rounded-2xl p-2 text-muted-foreground">
        <span className="opacity-60">{circle}</span>
        {details}
      </li>
    );
  }

  return (
    <li className="relative">
      <Link
        href={`/lesson/${lesson.id}`}
        className={cn(
          "flex items-center gap-4 rounded-2xl p-2 transition-colors outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50",
          state === "current" && "bg-secondary/70 hover:bg-secondary",
        )}
      >
        {circle}
        {details}
        <span className="flex items-center gap-1 text-sm font-bold text-primary">
          {state === "completed" ? "Повторить" : "Начать"}
          <ChevronRight className="size-4" aria-hidden />
        </span>
      </Link>
    </li>
  );
}
