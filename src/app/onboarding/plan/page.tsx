import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarCheck, Check, Info, Zap } from "lucide-react";

import { GOAL_ICONS } from "@/components/learning/options";
import { Logo } from "@/components/logo";
import { Otti } from "@/components/otti";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  GOAL_INFO,
  LEVELS_WITH_LESSONS,
  LEVEL_INFO,
  MINUTES_INFO,
  isDailyMinutes,
} from "@/lib/learning";
import { getProfile } from "@/lib/profile";
import { requireSession } from "@/lib/session";

export const metadata: Metadata = { title: "Маршрут готов" };

export default async function PlanPage() {
  const { user } = await requireSession();
  const profile = await getProfile(user.id);
  if (!profile.onboardingCompleted) {
    redirect("/onboarding");
  }

  const level = LEVEL_INFO[profile.level];
  const goal = GOAL_INFO[profile.goal];
  const GoalIcon = GOAL_ICONS[profile.goal];
  const dailyPlan = isDailyMinutes(profile.dailyMinutes)
    ? MINUTES_INFO[profile.dailyMinutes].plan
    : MINUTES_INFO[10].plan;
  const hasLessonsForLevel = LEVELS_WITH_LESSONS.includes(profile.level);

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex h-16 w-full max-w-xl items-center justify-between px-4">
        <Logo href="/learn" />
        <ThemeToggle />
      </header>

      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-5 px-4 pt-2 pb-16">
        <div className="flex flex-col items-center gap-3 text-center">
          <Otti size={96} mood="happy" />
          <h1 className="text-3xl font-black tracking-tight">Маршрут готов!</h1>
          <p className="text-muted-foreground">Вот как мы будем заниматься, {user.name}.</p>
        </div>

        <Card>
          <div className="flex items-center gap-3">
            <span className="flex h-12 min-w-12 items-center justify-center rounded-xl bg-primary px-2 text-lg font-black text-primary-foreground">
              {profile.level}
            </span>
            <div>
              <p className="text-sm font-bold text-muted-foreground">Уровень</p>
              <p className="font-extrabold">
                {level.title} — {level.description.toLowerCase()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-river-soft text-river">
              <GoalIcon className="size-6" aria-hidden />
            </span>
            <div>
              <p className="text-sm font-bold text-muted-foreground">Цель</p>
              <p className="font-extrabold">{goal.title}</p>
              <p className="text-sm text-muted-foreground">{goal.tutorFocus}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-xp/15 text-xp">
              <Zap className="size-6" aria-hidden />
            </span>
            <div>
              <p className="text-sm font-bold text-muted-foreground">Каждый день</p>
              <p className="font-extrabold">
                {profile.dailyMinutes} минут · цель {profile.dailyGoalXp} XP
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="flex items-center gap-2 text-lg font-extrabold">
            <CalendarCheck className="size-5 text-primary" aria-hidden />
            План на день
          </h2>
          <ul className="flex flex-col gap-2">
            {dailyPlan.map((item) => (
              <li key={item} className="flex gap-2.5">
                <Check className="mt-0.5 size-5 shrink-0 text-success" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-extrabold">Первый урок</h2>
            <Badge variant="river">A1 · Раздел 1 «Первые шаги»</Badge>
          </div>
          <p>Урок 1. Приветствие и знакомство</p>
          {!hasLessonsForLevel && (
            <p className="flex gap-2 rounded-xl bg-muted p-3 text-sm text-muted-foreground">
              <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>
                Готовые уроки уровня {profile.level} появятся в следующих версиях. Пока можно
                пройти вводный раздел A1 для разминки, а Отти будет говорить с тобой на уровне{" "}
                {profile.level}.
              </span>
            </p>
          )}
        </Card>

        <Button asChild size="lg">
          <Link href="/learn">Начать обучение</Link>
        </Button>
      </main>
    </div>
  );
}
