import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookA, CircleCheck, Clock, Lightbulb, ListChecks, Lock } from "lucide-react";

import { RichText } from "@/components/course/rich-text";
import { SpeakButton } from "@/components/course/speak-button";
import { Otti } from "@/components/otti";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  getLesson,
  getLessonStates,
  getPreviousLesson,
  getSectionOfLesson,
} from "@/content/course";
import type { Lesson, TheoryBlock } from "@/content/course/types";
import { getCompletedLessonIds } from "@/lib/course-progress";
import { requireSession } from "@/lib/session";
import { XP_RULES, maxLessonXp } from "@/lib/xp";

type PageParams = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { id } = await params;
  const lesson = getLesson(id);
  return { title: lesson ? `Урок ${lesson.number}. ${lesson.title}` : "Урок" };
}

export default async function LessonPage({ params }: PageParams) {
  const { id } = await params;
  const lesson = getLesson(id);
  if (!lesson) notFound();

  const { user } = await requireSession();
  const completed = await getCompletedLessonIds(user.id);
  const state = getLessonStates(completed).get(lesson.id);
  const section = getSectionOfLesson(lesson.id);

  if (state === "locked") {
    return <LockedLesson lesson={lesson} previous={getPreviousLesson(lesson.id)} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <BackToMap />

      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-2">
          <Badge variant="river">
            {section?.level} · Раздел {section?.number} · Урок {lesson.number}
          </Badge>
          {state === "completed" && (
            <Badge>
              <CircleCheck aria-hidden />
              Пройден
            </Badge>
          )}
        </div>
        <h1 className="text-2xl font-black tracking-tight md:text-3xl">{lesson.title}</h1>
        <p className="text-muted-foreground md:text-lg">{lesson.description}</p>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm font-bold text-muted-foreground">
          <li className="flex items-center gap-1.5">
            <Clock className="size-4" aria-hidden />≈{lesson.durationMin} минут
          </li>
          <li className="flex items-center gap-1.5">
            <ListChecks className="size-4" aria-hidden />
            {lesson.exercises.length} заданий
          </li>
          <li className="flex items-center gap-1.5">
            <BookA className="size-4" aria-hidden />
            {lesson.words.length} новых слов
          </li>
        </ul>
      </header>

      <Card>
        <h2 className="text-lg font-extrabold">{lesson.theory.title}</h2>
        <div className="flex flex-col gap-4 leading-relaxed text-muted-foreground">
          {lesson.theory.blocks.map((block, index) => (
            <TheoryBlockView key={index} block={block} />
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-extrabold">Новые слова</h2>
        <ul className="grid gap-3 md:grid-cols-2">
          {lesson.words.map((word) => (
            <li key={word.en} className="flex gap-3 rounded-xl bg-muted/60 p-3">
              <SpeakButton text={word.en} />
              <div className="min-w-0">
                <p>
                  <span lang="en" className="font-extrabold">
                    {word.en}
                  </span>{" "}
                  <span className="text-muted-foreground">— {word.ru}</span>
                </p>
                <p lang="en" className="mt-1 text-sm">
                  {word.example}
                </p>
                <p className="text-sm text-muted-foreground">{word.exampleRu}</p>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <h2 className="text-lg font-extrabold">Примеры</h2>
        <ul className="flex flex-col gap-3">
          {lesson.examples.map((example) => (
            <li key={example.en} className="flex items-start gap-3">
              <SpeakButton text={example.en} />
              <div>
                <p lang="en" className="font-bold">
                  {example.en}
                </p>
                <p className="text-sm text-muted-foreground">{example.ru}</p>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="items-center text-center">
        <p className="font-extrabold">Готов? Дальше — {lesson.exercises.length} заданий по уроку.</p>
        <p className="text-sm text-muted-foreground">
          {state === "completed"
            ? `Повторное прохождение: до ${XP_RULES.replay + lesson.exercises.length} XP.`
            : `За урок — до ${maxLessonXp(lesson.exercises.length)} XP.`}
        </p>
        <Button asChild size="lg" className="w-full sm:w-auto">
          <Link href={`/lesson/${lesson.id}/play`}>
            {state === "completed" ? "Пройти ещё раз" : "Начать задания"}
          </Link>
        </Button>
      </Card>
    </div>
  );
}

function BackToMap() {
  return (
    <Link
      href="/learn"
      className="flex w-fit items-center gap-1.5 rounded-lg text-sm font-bold text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      <ArrowLeft className="size-4" aria-hidden />
      Учебная карта
    </Link>
  );
}

function TheoryBlockView({ block }: { block: TheoryBlock }) {
  if (block.kind === "text") {
    return (
      <p>
        <RichText text={block.text} />
      </p>
    );
  }

  if (block.kind === "tip") {
    return (
      <p className="flex gap-3 rounded-xl bg-river-soft p-4 text-foreground">
        <Lightbulb className="mt-0.5 size-5 shrink-0 text-river" aria-hidden />
        <span>
          <RichText text={block.text} />
        </span>
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full text-left text-sm">
        <thead className="bg-muted text-foreground">
          <tr>
            {block.headers.map((header, index) => (
              <th key={index} scope="col" className="px-3 py-2 font-extrabold">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {block.rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-t">
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className={cellIndex === 0 ? "px-3 py-2 font-bold text-foreground" : "px-3 py-2"}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LockedLesson({ lesson, previous }: { lesson: Lesson; previous?: Lesson }) {
  return (
    <div className="flex flex-col gap-4">
      <BackToMap />
      <Card className="items-center text-center">
        <Otti size={96} mood="confused" />
        <Badge variant="muted">
          <Lock aria-hidden />
          Урок {lesson.number} пока закрыт
        </Badge>
        <h1 className="text-2xl font-black tracking-tight">{lesson.title}</h1>
        <p className="max-w-md text-muted-foreground">
          Уроки открываются по порядку.
          {previous && ` Сначала пройди урок ${previous.number} «${previous.title}».`}
        </p>
        {previous && (
          <Button asChild>
            <Link href={`/lesson/${previous.id}`}>К уроку {previous.number}</Link>
          </Button>
        )}
      </Card>
    </div>
  );
}
