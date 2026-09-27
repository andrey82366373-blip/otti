import type { Metadata } from "next";
import Link from "next/link";
import { Award, Info, PartyPopper } from "lucide-react";

import { LessonMap } from "@/components/course/lesson-map";
import { TodayCard, type TodayTask } from "@/components/dashboard/today-card";
import { GOAL_ICONS } from "@/components/learning/options";
import { Otti } from "@/components/otti";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SECTIONS, getLessonStates, getNextLesson } from "@/content/course";
import { getDailyState } from "@/lib/activity";
import { getCompletedLessonIds } from "@/lib/course-progress";
import { GOAL_INFO, LEVELS_WITH_LESSONS, LEVEL_INFO } from "@/lib/learning";
import { getMistakeStats } from "@/lib/mistake-store";
import { getTutorAvailability } from "@/lib/tutor/availability";
import { CHAT_DAILY_TASK_MESSAGES } from "@/lib/tutor/rules";
import { getChatMessagesToday } from "@/lib/tutor/store";
import { DAILY_FIX_TARGET } from "@/lib/mistakes";
import { LESSONS, MISTAKES, WORDS, withPlural } from "@/lib/plural";
import { getProfile } from "@/lib/profile";
import { requireSession } from "@/lib/session";
import { getWordStats } from "@/lib/word-store";

export const metadata: Metadata = { title: "Обучение" };

export default async function LearnPage() {
  const { user } = await requireSession();
  const [profile, completed] = await Promise.all([
    getProfile(user.id),
    getCompletedLessonIds(user.id),
  ]);
  const tutor = getTutorAvailability();
  const [daily, words, mistakeStats, chatToday] = await Promise.all([
    getDailyState(user.id),
    getWordStats(user.id),
    getMistakeStats(user.id),
    tutor.available ? getChatMessagesToday(user.id) : Promise.resolve(0),
  ]);
  const states = getLessonStates(completed);
  const nextLesson = getNextLesson(completed);
  const GoalIcon = GOAL_ICONS[profile.goal];
  const hasLessonsForLevel = LEVELS_WITH_LESSONS.includes(profile.level);

  // Сколько ошибок исправить сегодня: до 3, но не больше, чем их есть
  const fixTarget = Math.min(DAILY_FIX_TARGET, mistakeStats.open + mistakeStats.fixedToday);

  // Задачи на сегодня
  const tasks: TodayTask[] = [
    {
      id: "lesson",
      title: nextLesson ? "Пройти урок" : "Повторить любой урок",
      hint:
        daily.lessonsToday > 0
          ? `Сегодня: ${withPlural(daily.lessonsToday, LESSONS)}`
          : nextLesson
            ? `Урок ${nextLesson.number}. ${nextLesson.title}`
            : "Все уроки раздела пройдены",
      done: daily.lessonsToday > 0,
      href: nextLesson ? `/lesson/${nextLesson.id}` : "/learn#map",
    },
    ...(words.total > 0
      ? [
          {
            id: "words",
            title: "Повторить слова",
            hint:
              words.due > 0
                ? `Ждут повторения: ${withPlural(words.due, WORDS)}`
                : "Все слова повторены",
            done: words.due === 0,
            href: "/words/review",
          },
        ]
      : []),
    ...(fixTarget > 0
      ? [
          {
            id: "mistakes",
            title: fixTarget === 1 ? "Исправить ошибку" : `Исправить ${withPlural(fixTarget, MISTAKES)}`,
            hint:
              mistakeStats.fixedToday >= fixTarget
                ? `Сегодня исправлено: ${mistakeStats.fixedToday}`
                : mistakeStats.fixedToday > 0
                  ? `Исправлено ${mistakeStats.fixedToday} из ${fixTarget}`
                  : `Ждут исправления: ${withPlural(mistakeStats.open, MISTAKES)}`,
            done: mistakeStats.fixedToday >= fixTarget,
            href: "/mistakes/train",
          },
        ]
      : []),
    ...(tutor.available
      ? [
          {
            id: "tutor",
            title: "Поговорить с Отти",
            hint:
              chatToday >= CHAT_DAILY_TASK_MESSAGES
                ? `Сегодня сообщений: ${chatToday}`
                : `Напиши ${CHAT_DAILY_TASK_MESSAGES} сообщения на английском · сейчас ${chatToday}`,
            done: chatToday >= CHAT_DAILY_TASK_MESSAGES,
            href: "/tutor",
          },
        ]
      : []),
    {
      id: "goal",
      title: `Набрать ${profile.dailyGoalXp} XP`,
      hint: daily.goalMet ? "Цель дня выполнена" : `Осталось ${profile.dailyGoalXp - daily.todayXp} XP`,
      done: daily.goalMet,
    },
  ];

  return (
    <>
      <PageHeader title={`Привет, ${user.name}!`} description="Твой маршрут от простого к сложному." />

      <div className="flex flex-col gap-4">
        {nextLesson ? (
          <Card className="flex-row items-center gap-4 border-primary/30 bg-linear-to-br from-secondary to-card">
            <Otti size={64} mood="happy" className="hidden sm:block" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-extrabold tracking-wide text-primary uppercase">
                {completed.size === 0 ? "Первый урок" : "Следующий урок"}
              </p>
              <p className="text-lg leading-tight font-black">
                Урок {nextLesson.number}. {nextLesson.title}
              </p>
              <p className="text-sm text-muted-foreground">
                ≈{nextLesson.durationMin} мин · {nextLesson.exercises.length} заданий
              </p>
            </div>
            <Button asChild>
              <Link href={`/lesson/${nextLesson.id}`}>
                {completed.size === 0 ? "Начать" : "Продолжить"}
              </Link>
            </Button>
          </Card>
        ) : (
          <Card className="flex-row items-center gap-4">
            <PartyPopper className="size-10 shrink-0 text-streak" aria-hidden />
            <div>
              <p className="text-lg font-black">Раздел пройден!</p>
              <p className="text-sm text-muted-foreground">
                Новые уроки появятся в следующих версиях. А пока — повторяй и болтай с Отти.
              </p>
            </div>
          </Card>
        )}

        {profile.goal === "exam" && (
          <Card className="animate-card-in flex-row flex-wrap items-center gap-3 border-primary/30">
            <Award className="size-7 shrink-0 text-primary" aria-hidden />
            <div className="min-w-0 flex-1 basis-56">
              <p className="font-extrabold">Подготовка к IELTS</p>
              <p className="text-sm text-muted-foreground">Учебный план, задания в формате экзамена и примерный балл.</p>
            </div>
            <Button asChild className="w-full sm:w-auto">
              <Link href="/exams/ielts">Открыть</Link>
            </Button>
          </Card>
        )}

        <TodayCard
          xp={daily.todayXp}
          goalXp={daily.goalXp}
          streak={daily.streak}
          goalMet={daily.goalMet}
          tasks={tasks}
        />

        <div className="flex flex-wrap gap-2">
          <Badge>
            Уровень {profile.level} · {LEVEL_INFO[profile.level].title}
          </Badge>
          <Badge variant="river">
            <GoalIcon aria-hidden />
            {GOAL_INFO[profile.goal].title}
          </Badge>
          <Badge variant="muted">
            {profile.dailyMinutes} мин в день · цель {profile.dailyGoalXp} XP
          </Badge>
        </div>
        {!hasLessonsForLevel && (
          <p className="flex gap-2 text-sm text-muted-foreground">
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>
              Уроки уровня {profile.level} появятся в следующих версиях. Пока — вводный раздел A1
              для разминки.
            </span>
          </p>
        )}

        <div id="map" className="flex scroll-mt-20 flex-col gap-4">
          {SECTIONS.map((section) => (
            <LessonMap key={section.id} section={section} states={states} />
          ))}
        </div>
      </div>
    </>
  );
}
