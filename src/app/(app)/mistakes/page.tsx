import type { Metadata } from "next";
import Link from "next/link";
import { Wrench } from "lucide-react";

import { MistakeList, type MistakeView } from "@/components/mistakes/mistake-list";
import { Otti } from "@/components/otti";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDayLong, todayInTimezone } from "@/lib/dates";
import { getMistakeStats, getMistakes } from "@/lib/mistake-store";
import { MISTAKE_TRAINING_SIZE, getAnswerLang, getErrorTypeInfo, getExerciseQuestion } from "@/lib/mistakes";
import { MISTAKES, plural, withPlural } from "@/lib/plural";
import { getProfile } from "@/lib/profile";
import { requireSession } from "@/lib/session";

export const metadata: Metadata = { title: "Работа над ошибками" };

export default async function MistakesPage() {
  const { user } = await requireSession();
  const [profile, records, stats] = await Promise.all([
    getProfile(user.id),
    getMistakes(user.id),
    getMistakeStats(user.id),
  ]);

  const dayLabel = (date: Date) => formatDayLong(todayInTimezone(profile.timezone, date));

  const mistakes: MistakeView[] = records.map((record) => {
    const { exercise } = record;
    const resolvedAt = record.resolved ? (record.resolvedAt ?? record.lastWrongAt) : null;
    return {
      id: record.id,
      prompt: exercise.prompt,
      question: getExerciseQuestion(exercise),
      kind:
        exercise.type === "match-pairs"
          ? "pairs"
          : exercise.type === "short-answer" || exercise.type === "tutor-reply"
            ? "open"
            : "other",
      userAnswer: record.userAnswer,
      correctAnswer: record.correctAnswer,
      answerLang: getAnswerLang(exercise),
      errorTitle: getErrorTypeInfo(record.errorType).title,
      topic: record.topic,
      topicTitle: record.topicTitle,
      lessonId: record.lessonId,
      lessonNumber: record.lessonNumber,
      timesWrong: record.timesWrong,
      dateLabel: resolvedAt ? `исправлено ${dayLabel(resolvedAt)}` : dayLabel(record.lastWrongAt),
      resolved: record.resolved,
      time: (resolvedAt ?? record.lastWrongAt).getTime(),
    };
  });

  // Какие ошибки встречаются чаще (среди неисправленных)
  const byType = new Map<string, number>();
  for (const record of records) {
    if (!record.resolved) byType.set(record.errorType, (byType.get(record.errorType) ?? 0) + 1);
  }
  const frequent = [...byType.entries()].sort((a, b) => b[1] - a[1]);

  return (
    <>
      <PageHeader
        title="Работа над ошибками"
        description="Задания, в которых ты ошибся. Реши их правильно — и они уйдут из списка."
      />

      {records.length === 0 ? (
        <Card className="items-center text-center">
          <Otti size={96} mood="wink" />
          <p className="text-lg font-extrabold">Ошибок пока нет</p>
          <p className="max-w-sm text-muted-foreground">
            Если ошибёшься в уроке, задание появится здесь — чтобы потренировать его ещё раз.
          </p>
          <Button asChild>
            <Link href="/learn">К урокам</Link>
          </Button>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          <Card className="flex-row flex-wrap items-center gap-4 border-primary/30 bg-linear-to-br from-secondary to-card">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <Wrench className="size-6" aria-hidden />
            </span>
            <div className="min-w-0 flex-1 basis-56">
              <p className="text-lg leading-tight font-black">
                {stats.open > 0
                  ? `Ждут исправления: ${withPlural(stats.open, MISTAKES)}`
                  : "Все ошибки исправлены!"}
              </p>
              <p className="text-sm text-muted-foreground">
                {stats.open > 0
                  ? `До ${MISTAKE_TRAINING_SIZE} заданий за раз. За каждое исправление +1 XP.`
                  : `Исправлено за всё время: ${stats.resolved}. Новые ошибки появятся здесь сами.`}
              </p>
            </div>
            {stats.open > 0 && (
              <Button asChild className="w-full sm:w-auto">
                <Link href="/mistakes/train">Тренировать</Link>
              </Button>
            )}
          </Card>

          {frequent.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Чаще всего</CardTitle>
                <CardDescription>Типы неисправленных ошибок и что с ними делать.</CardDescription>
              </CardHeader>
              <ul className="flex flex-col gap-3">
                {frequent.map(([type, count]) => {
                  const info = getErrorTypeInfo(type);
                  return (
                    <li key={type} className="flex items-start justify-between gap-3">
                      <span className="min-w-0">
                        <span className="block font-bold">{info.title}</span>
                        {info.hint && (
                          <span className="block text-sm text-muted-foreground">{info.hint}</span>
                        )}
                      </span>
                      <span className="shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-sm font-black tabular-nums">
                        {count}
                        <span className="sr-only"> {plural(count, MISTAKES)}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}

          <MistakeList mistakes={mistakes} />
        </div>
      )}
    </>
  );
}
