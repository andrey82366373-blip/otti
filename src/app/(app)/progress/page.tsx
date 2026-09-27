import type { Metadata } from "next";
import Link from "next/link";
import { BookA, Flame, GraduationCap, ListChecks, Target, Zap, type LucideIcon } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { AchievementGrid } from "@/components/progress/achievement-grid";
import { XpChart, type ChartDay } from "@/components/progress/xp-chart";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ALL_LESSONS, SECTIONS } from "@/content/course";
import { getTopicTitle } from "@/content/course/topics";
import { getDb } from "@/db";
import { getCompletedLessonIds } from "@/lib/course-progress";
import { formatDayLong, lastDays, todayInTimezone, weekdayShort } from "@/lib/dates";
import { ACHIEVEMENTS } from "@/lib/achievements";
import { getDailyState } from "@/lib/activity";
import { LEVEL_INFO } from "@/lib/learning";
import { getMistakes } from "@/lib/mistake-store";
import { getErrorTypeInfo } from "@/lib/mistakes";
import { DAYS, withPlural } from "@/lib/plural";
import { getProfile } from "@/lib/profile";
import { requireSession } from "@/lib/session";
import { getWordStats } from "@/lib/word-store";
import {
  getAchievementStats,
  getActivitySince,
  getEarnedAchievements,
  getTopicAccuracy,
  syncAchievements,
} from "@/lib/stats";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Прогресс" };

function StatTile({
  icon: Icon,
  label,
  value,
  note,
  iconClass,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  note?: string;
  iconClass: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border bg-card p-4">
      <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
        <Icon className={cn("size-4", iconClass)} aria-hidden />
        {label}
      </div>
      <p className="text-2xl font-black">{value}</p>
      {note && <p className="text-xs text-muted-foreground">{note}</p>}
    </div>
  );
}

/** Оценка темы по точности: цвет всегда вместе с текстом. */
function topicGrade(percent: number) {
  if (percent >= 85) return { text: "хорошо", bar: "bg-success", label: "text-success" };
  if (percent >= 60) return { text: "повторить", bar: "bg-xp", label: "text-foreground" };
  return { text: "сложно", bar: "bg-destructive", label: "text-destructive" };
}

export default async function ProgressPage() {
  const { user } = await requireSession();
  const profile = await getProfile(user.id);
  const today = todayInTimezone(profile.timezone);
  const chartDays = lastDays(today, 14);

  const daily = await getDailyState(user.id);
  const stats = await getAchievementStats(getDb(), user.id, {
    totalXp: profile.totalXp,
    longestStreak: daily.longestStreak,
  });
  // Досчитываем достижения, если какие-то ещё не выданы
  await syncAchievements(getDb(), user.id, stats);

  const [completed, activity, topics, earnedRows, words, mistakeRecords] = await Promise.all([
    getCompletedLessonIds(user.id),
    getActivitySince(user.id, chartDays[0]),
    getTopicAccuracy(user.id),
    getEarnedAchievements(user.id),
    getWordStats(user.id),
    getMistakes(user.id),
  ]);

  const xpByDay = new Map(activity.map((row) => [row.day, row.xp]));
  const days: ChartDay[] = chartDays.map((day) => ({
    day,
    label: String(Number(day.slice(8))),
    fullLabel: `${formatDayLong(day)}, ${weekdayShort(day)}`,
    xp: xpByDay.get(day) ?? 0,
    isToday: day === today,
  }));
  const weekXp = days.slice(-7).reduce((sum, item) => sum + item.xp, 0);

  const totalAnswers = topics.reduce((sum, row) => sum + row.total, 0);
  const correctAnswers = topics.reduce((sum, row) => sum + row.correct, 0);
  const accuracy = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : null;

  const topicRows = topics
    .filter((row) => row.total >= 3)
    .map((row) => ({ ...row, percent: Math.round((row.correct / row.total) * 100) }))
    .sort((a, b) => a.percent - b.percent);

  // Частые ошибки: по типам, сколько всего и сколько уже исправлено
  const errorMap = new Map<string, { total: number; fixed: number }>();
  for (const record of mistakeRecords) {
    const row = errorMap.get(record.errorType) ?? { total: 0, fixed: 0 };
    row.total += 1;
    if (record.resolved) row.fixed += 1;
    errorMap.set(record.errorType, row);
  }
  const errorRows = [...errorMap.entries()]
    .map(([type, row]) => ({ type, title: getErrorTypeInfo(type).title, ...row }))
    .sort((a, b) => b.total - b.fixed - (a.total - a.fixed) || b.total - a.total);

  const levelLessons = SECTIONS.filter((section) => section.level === profile.level).flatMap(
    (section) => section.lessons,
  );
  const levelDone = levelLessons.filter((lesson) => completed.has(lesson.id)).length;
  const streak = daily.streak;
  const earned = new Map(
    earnedRows.map((row) => [row.code, todayInTimezone(profile.timezone, row.earnedAt)]),
  );

  return (
    <>
      <PageHeader title="Прогресс" description="Только реальные цифры — из выполненных заданий." />

      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <StatTile
            icon={GraduationCap}
            label="Уровень"
            value={profile.level}
            note={LEVEL_INFO[profile.level].title}
            iconClass="text-primary"
          />
          <StatTile icon={Zap} label="Опыт" value={`${profile.totalXp} XP`} note={`За неделю: ${weekXp} XP`} iconClass="text-xp" />
          <StatTile
            icon={Flame}
            label="Серия"
            value={withPlural(streak, DAYS)}
            note={`Рекорд: ${withPlural(daily.longestStreak, DAYS)}`}
            iconClass="text-streak"
          />
          <StatTile
            icon={ListChecks}
            label="Уроки"
            value={`${completed.size} из ${ALL_LESSONS.length}`}
            note="пройдено"
            iconClass="text-river"
          />
          <StatTile
            icon={Target}
            label="Точность"
            value={accuracy === null ? "—" : `${accuracy}%`}
            note={totalAnswers > 0 ? `${correctAnswers} из ${totalAnswers} ответов` : "Ответов пока нет"}
            iconClass="text-success"
          />
          <StatTile
            icon={BookA}
            label="Слова"
            value={`${words.learned} из ${words.total}`}
            note="выучено в словаре"
            iconClass="text-primary"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Уровень {profile.level}</CardTitle>
            <CardDescription>
              {levelLessons.length > 0
                ? `Пройдено ${levelDone} из ${levelLessons.length} уроков уровня — примерный прогресс по курсу.`
                : `Уроки уровня ${profile.level} появятся в следующих версиях.`}
            </CardDescription>
          </CardHeader>
          {levelLessons.length > 0 && (
            <Progress
              value={levelDone}
              max={levelLessons.length}
              label={`Прогресс уровня ${profile.level}: ${levelDone} из ${levelLessons.length} уроков`}
              barClassName="bg-river"
            />
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Опыт за 14 дней</CardTitle>
            <CardDescription>
              Линия — дневная цель ({profile.dailyGoalXp} XP). Наведи или нажми на столбик, чтобы
              увидеть число.
            </CardDescription>
          </CardHeader>
          <XpChart days={days} goal={profile.dailyGoalXp} />
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Темы</CardTitle>
            <CardDescription>Сначала — темы, в которых ты чаще ошибаешься.</CardDescription>
          </CardHeader>
          {topicRows.length === 0 ? (
            <div className="flex flex-col items-start gap-3">
              <p className="text-muted-foreground">
                Пока мало данных. Пройди пару уроков — и здесь появятся твои сильные и слабые темы.
              </p>
              <Button asChild variant="outline">
                <Link href="/learn">К урокам</Link>
              </Button>
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {topicRows.map((row) => {
                const grade = topicGrade(row.percent);
                return (
                  <li key={row.topic} className="flex flex-col gap-1.5">
                    <div className="flex items-baseline justify-between gap-2 text-sm">
                      <span className="font-bold">{getTopicTitle(row.topic)}</span>
                      <span className="shrink-0 tabular-nums">
                        <span className={cn("font-bold", grade.label)}>{grade.text}</span>
                        <span className="text-muted-foreground">
                          {" "}
                          · {row.percent}% ({row.correct}/{row.total})
                        </span>
                      </span>
                    </div>
                    <Progress
                      value={row.percent}
                      label={`${getTopicTitle(row.topic)}: ${row.percent}% правильных ответов`}
                      className="h-2"
                      barClassName={grade.bar}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Частые ошибки</CardTitle>
            <CardDescription>Какие ошибки случаются чаще и сколько из них уже исправлено.</CardDescription>
          </CardHeader>
          {errorRows.length === 0 ? (
            <p className="text-muted-foreground">Ошибок пока нет — или ты ещё не проходил уроки.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {errorRows.map((row) => (
                <li key={row.type} className="flex flex-col gap-1.5">
                  <div className="flex items-baseline justify-between gap-2 text-sm">
                    <span className="font-bold">{row.title}</span>
                    <span className="shrink-0 text-muted-foreground tabular-nums">
                      исправлено {row.fixed} из {row.total}
                    </span>
                  </div>
                  <Progress
                    value={row.fixed}
                    max={row.total}
                    label={`${row.title}: исправлено ${row.fixed} из ${row.total}`}
                    className="h-2"
                    barClassName="bg-success"
                  />
                </li>
              ))}
            </ul>
          )}
          {errorRows.length > 0 && (
            <Button asChild variant="outline" className="self-start">
              <Link href="/mistakes">Работа над ошибками</Link>
            </Button>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Достижения</CardTitle>
            <CardDescription>
              Получено {earned.size} из {ACHIEVEMENTS.length}
            </CardDescription>
          </CardHeader>
          <AchievementGrid stats={stats} earned={earned} />
        </Card>
      </div>
    </>
  );
}
