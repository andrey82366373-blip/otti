"use client";

import { useEffect } from "react";
import Link from "next/link";
import { BookA, Flame, Target, Zap } from "lucide-react";

import { SpeakButton } from "@/components/course/speak-button";
import { Confetti } from "@/components/lesson/confetti";
import { AnimatedNumber } from "@/components/motion/animated-number";
import { useFeedbackPrefs } from "@/components/motion/feedback-prefs";
import { NewAchievements } from "@/components/progress/new-achievements";
import { Otti } from "@/components/otti";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Lesson } from "@/content/course/types";
import type { LessonSummary as Summary } from "@/lib/actions/lessons";
import { DAYS, plural, withPlural } from "@/lib/plural";
import { cn } from "@/lib/utils";

function Stat({
  icon: Icon,
  value,
  prefix = "",
  suffix = "",
  label,
  colorClass,
  delay,
}: {
  icon: typeof Zap;
  value: number;
  prefix?: string;
  suffix?: string;
  label: string;
  colorClass: string;
  /** Задержка появления, мс — карточки выезжают по очереди. */
  delay: number;
}) {
  return (
    <div
      className="animate-card-in flex flex-col items-center gap-1 rounded-2xl border-2 bg-card px-3 py-4 text-center"
      style={{ animationDelay: `${delay}ms` }}
    >
      <Icon className={`size-6 ${colorClass}`} aria-hidden />
      <p className="text-2xl font-black">
        <AnimatedNumber value={value} from={0} delay={delay + 150} prefix={prefix} suffix={suffix} />
      </p>
      <p className="text-xs font-bold text-muted-foreground">{label}</p>
    </div>
  );
}

/** Итог урока: опыт, точность, новые слова и что дальше. */
export function LessonSummary({ lesson, summary }: { lesson: Lesson; summary: Summary }) {
  const perfect = summary.firstTryCorrect === summary.total;
  const { play, reduceMotion } = useFeedbackPrefs();
  const streakGrew = summary.goalReachedNow && summary.streak > 0;

  // Праздничный перезвон, затем — достижение (если есть)
  useEffect(() => {
    play("complete");
    const timers: number[] = [];
    if (summary.newAchievements.length > 0) timers.push(window.setTimeout(() => play("achievement"), 1100));
    else if (streakGrew) timers.push(window.setTimeout(() => play("streak"), 1000));
    return () => timers.forEach((timer) => window.clearTimeout(timer));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- звучит один раз при показе итогов
  }, []);

  return (
    <div className="flex flex-col gap-5">
      {!reduceMotion && <Confetti />}
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="relative flex items-center justify-center">
          <span aria-hidden className="animate-ripple absolute size-28 rounded-full border-4 border-river/50" />
          <span
            aria-hidden
            className="animate-ripple absolute size-28 rounded-full border-4 border-primary/40"
            style={{ animationDelay: "0.35s" }}
          />
          <Otti size={112} mood={perfect ? "joy" : "wink"} className="animate-celebrate relative" />
        </div>
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
        <Stat icon={Zap} value={summary.xpEarned} prefix="+" label="XP" colorClass="text-xp" delay={250} />
        <Stat
          icon={Target}
          value={summary.scorePercent}
          suffix="%"
          label="точность"
          colorClass="text-primary"
          delay={380}
        />
        <Stat icon={BookA} value={lesson.words.length} label="новых слов" colorClass="text-river" delay={510} />
      </div>

      <NewAchievements items={summary.newAchievements} />

      <Card className="animate-card-in gap-2" style={{ animationDelay: "640ms" }}>
        <div className="flex items-center gap-3">
          <Flame
            className={cn(
              summary.goalReachedNow || summary.todayXp >= summary.dailyGoalXp
                ? "size-7 fill-streak/30 text-streak"
                : "size-7 text-muted-foreground",
              streakGrew && "animate-flame [animation-delay:1s]",
            )}
            aria-hidden
          />
          <div>
            <p className="font-extrabold">
              {streakGrew ? (
                <>
                  Цель дня выполнена! Серия:{" "}
                  <AnimatedNumber value={summary.streak} from={summary.streak - 1} delay={1100} duration={400} />{" "}
                  {plural(summary.streak, DAYS)}
                </>
              ) : summary.goalReachedNow
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
