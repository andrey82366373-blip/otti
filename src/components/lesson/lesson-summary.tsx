"use client";

import Link from "next/link";
import { BookA, Flame, Target, Zap } from "lucide-react";

import { SpeakButton } from "@/components/course/speak-button";
import { Confetti } from "@/components/lesson/confetti";
import { NewAchievements } from "@/components/progress/new-achievements";
import { Otti } from "@/components/otti";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Lesson } from "@/content/course/types";
import type { LessonSummary as Summary } from "@/lib/actions/lessons";
import { DAYS, withPlural } from "@/lib/plural";

function Stat({
  icon: Icon,
  value,
  label,
  colorClass,
}: {
  icon: typeof Zap;
  value: string;
  label: string;
  colorClass: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl border-2 bg-card px-3 py-4 text-center">
      <Icon className={`size-6 ${colorClass}`} aria-hidden />
      <p className="text-2xl font-black tabular-nums">{value}</p>
      <p className="text-xs font-bold text-muted-foreground">{label}</p>
    </div>
  );
}

/** Итог урока: опыт, точность, новые слова и что дальше. */
export function LessonSummary({ lesson, summary }: { lesson: Lesson; summary: Summary }) {
  const perfect = summary.firstTryCorrect === summary.total;

  return (
    <div className="flex flex-col gap-5">
      <Confetti />
      <div className="animate-pop flex flex-col items-center gap-2 text-center">
        <Otti size={112} mood={perfect ? "wink" : "happy"} />
        <h1 className="text-3xl font-black tracking-tight">
          {summary.isFirstCompletion ? "Урок пройден!" : "Урок повторён!"}
        </h1>
        <p className="text-muted-foreground">
          {perfect
            ? "Без единой ошибки — отличная работа!"
            : `Урок ${lesson.number}. ${lesson.title}`}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        <Stat icon={Zap} value={`+${summary.xpEarned}`} label="XP" colorClass="text-xp" />
        <Stat icon={Target} value={`${summary.scorePercent}%`} label="точность" colorClass="text-primary" />
        <Stat
          icon={BookA}
          value={String(lesson.words.length)}
          label="новых слов"
          colorClass="text-river"
        />
      </div>

      <NewAchievements items={summary.newAchievements} />

      <Card className="gap-2">
        <div className="flex items-center gap-3">
          <Flame
            className={summary.goalReachedNow || summary.todayXp >= summary.dailyGoalXp ? "size-7 fill-streak/30 text-streak" : "size-7 text-muted-foreground"}
            aria-hidden
          />
          <div>
            <p className="font-extrabold">
              {summary.goalReachedNow
                ? `Цель дня выполнена! Серия: ${withPlural(summary.streak, DAYS)}`
                : summary.todayXp >= summary.dailyGoalXp
                  ? `Цель дня уже выполнена. Серия: ${withPlural(summary.streak, DAYS)}`
                  : `Сегодня ${summary.todayXp} из ${summary.dailyGoalXp} XP`}
            </p>
            {summary.todayXp < summary.dailyGoalXp && (
              <p className="text-sm text-muted-foreground">
                До цели дня осталось {summary.dailyGoalXp - summary.todayXp} XP — ещё один урок или повторение.
              </p>
            )}
          </div>
        </div>
      </Card>

      <Card className="gap-3">
        <p className="font-bold">
          С первой попытки: {summary.firstTryCorrect} из {summary.total}
        </p>
        {summary.replayXpLimited && (
          <p className="text-sm text-muted-foreground">
            Опыт за повтор урока даётся один раз в день — сегодня он уже получен. Повторять урок всё
            равно полезно!
          </p>
        )}
        {summary.mistakesCount > 0 ? (
          <p className="text-sm text-muted-foreground">
            Задания с ошибками ({summary.mistakesCount}) сохранены — потренируем их в{" "}
            <Link href="/mistakes" className="font-bold text-primary hover:underline">
              «Работе над ошибками»
            </Link>
            .
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">Ошибок нет — так держать!</p>
        )}
        {summary.mistakesFixed > 0 && (
          <p className="text-sm font-bold text-success">
            Исправлено старых ошибок: {summary.mistakesFixed}
          </p>
        )}
      </Card>

      <Card className="gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-extrabold">Слова урока</h2>
          <Link href="/words" className="text-sm font-bold text-primary hover:underline">
            {summary.newWordsAdded > 0
              ? `+${summary.newWordsAdded} в словаре`
              : "Уже в словаре"}
          </Link>
        </div>
        <ul className="flex flex-wrap gap-2">
          {lesson.words.map((word) => (
            <li key={word.en} className="flex items-center gap-1.5 rounded-full bg-muted py-1 pr-3 pl-1">
              <SpeakButton text={word.en} className="size-7" />
              <span lang="en" className="font-bold">
                {word.en}
              </span>
              <span className="text-sm text-muted-foreground">— {word.ru}</span>
            </li>
          ))}
        </ul>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        {summary.nextLesson ? (
          <Button asChild size="lg">
            <Link href={`/lesson/${summary.nextLesson.id}`}>
              Урок {summary.nextLesson.number}: {summary.nextLesson.title}
            </Link>
          </Button>
        ) : null}
        <Button asChild size="lg" variant={summary.nextLesson ? "outline" : "default"}>
          <Link href="/learn">К учебной карте</Link>
        </Button>
      </div>
    </div>
  );
}
