import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarDays, ChartLine, ClipboardCheck, Settings, Target } from "lucide-react";

import { BandBadge, InfoNote } from "@/components/exams/exam-ui";
import { IeltsSetupForm } from "@/components/exams/ielts-setup-form";
import { PlanList } from "@/components/exams/plan-list";
import { SkillCards } from "@/components/exams/skill-cards";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { QUESTION_KIND_TITLES } from "@/content/ielts/types";
import { formatDayLong, todayInTimezone } from "@/lib/dates";
import { AI_ESTIMATE_DISCLAIMER, IELTS_MODULE_INFO, IELTS_SKILLS, formatBand } from "@/lib/exams/ielts";
import { daysUntilExam, planProgress, readiness } from "@/lib/exams/plan";
import { estimateSkills, getIeltsAttempts, getIeltsProfile, mistakeStats } from "@/lib/exams/store";
import type { IeltsSkill } from "@/lib/exams/types";
import { getProfile } from "@/lib/profile";
import { requireSession } from "@/lib/session";

export const metadata: Metadata = { title: "IELTS" };

function daysWord(count: number) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return "день";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "дня";
  return "дней";
}

export default async function IeltsPage() {
  const { user } = await requireSession();
  const [examProfile, profile] = await Promise.all([getIeltsProfile(user.id), getProfile(user.id)]);
  const today = todayInTimezone(profile.timezone);

  if (!examProfile) {
    return (
      <>
        <PageHeader
          title="Подготовка к IELTS"
          description="Ответь на шесть вопросов — Отти составит учебный план. Всё можно изменить позже."
        />
        <Card>
          <IeltsSetupForm initial={{}} today={today} isEdit={false} />
        </Card>
      </>
    );
  }

  const attempts = await getIeltsAttempts(user.id);
  const estimates = estimateSkills(attempts, examProfile.module);
  const plan = examProfile.plan;
  const progress = plan ? planProgress(plan, attempts, Boolean(examProfile.diagnostic), today) : null;
  const ready = readiness(estimates.overall, examProfile.targetBand, progress);
  const days = daysUntilExam(examProfile.examDate, today);
  const counts = Object.fromEntries(
    IELTS_SKILLS.map((skill) => [skill, attempts.filter((attempt) => attempt.skill === skill).length]),
  ) as Record<IeltsSkill, number>;
  const weak = mistakeStats(attempts)
    .filter((stat) => stat.total >= 3 && stat.correct / stat.total < 0.7)
    .slice(0, 3);
  const weekSessions = plan && progress
    ? plan.sessions
        .map((session, index) => ({ session, done: progress.done[index] }))
        .filter(({ session }) => session.week === progress.week)
    : [];
  const hasAiEstimates = Boolean(estimates.writing || estimates.speaking);

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight md:text-3xl">{IELTS_MODULE_INFO[examProfile.module].title}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground">
            <span className="flex items-center gap-1">
              <Target className="size-4" aria-hidden />
              Цель: {formatBand(examProfile.targetBand)}
            </span>
            <span className="flex items-center gap-1">
              <CalendarDays className="size-4" aria-hidden />
              {examProfile.examDate && days !== null
                ? days > 0
                  ? `Экзамен ${formatDayLong(examProfile.examDate)} — через ${days} ${daysWord(days)}`
                  : days === 0
                    ? "Экзамен сегодня — удачи!"
                    : "Дата экзамена прошла — обнови её в настройках"
                : "Дата экзамена не указана"}
            </span>
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/exams/ielts/settings">
            <Settings aria-hidden />
            Настройки
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-5">
        {!examProfile.diagnostic && (
          <Card className="animate-card-in gap-3 border-primary/40 bg-secondary/50">
            <div className="flex items-start gap-3">
              <ClipboardCheck className="mt-0.5 size-6 shrink-0 text-primary" aria-hidden />
              <div>
                <h2 className="text-lg font-black">Начни с диагностики</h2>
                <p className="text-sm text-muted-foreground">
                  25–30 минут: короткие задания Reading и Listening, небольшой текст и три устных вопроса. Отти
                  оценит стартовый уровень и уточнит план.
                </p>
              </div>
            </div>
            <Button asChild className="sm:self-start">
              <Link href="/exams/ielts/diagnostic">
                Пройти диагностику
                <ArrowRight aria-hidden />
              </Link>
            </Button>
          </Card>
        )}

        <Card className="animate-card-in gap-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-extrabold tracking-wide text-muted-foreground uppercase">Примерный текущий балл</p>
              {estimates.overall ? (
                <BandBadge estimate={estimates.overall} size="lg" />
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">
                  Появится после заданий хотя бы по двум навыкам. Один ответ — не повод для оценки.
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs font-extrabold tracking-wide text-muted-foreground uppercase">Цель</p>
              <p className="text-4xl font-black">{formatBand(examProfile.targetBand)}</p>
            </div>
          </div>
          {ready ? (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-sm font-bold">
                <span>Готовность к экзамену: {ready.title}</span>
                <span className="tabular-nums">{ready.percent}%</span>
              </div>
              <Progress value={ready.percent} label={`Готовность к экзамену: ${ready.percent}%`} barClassName="bg-success" />
              <p className="text-sm text-muted-foreground">{ready.note}</p>
            </div>
          ) : null}
          <InfoNote>
            Оценка приблизительная: по нашим заданиям, а не по официальному тесту.
            {hasAiEstimates ? ` Writing и Speaking: ${AI_ESTIMATE_DISCLAIMER.toLowerCase()}` : ""}
          </InfoNote>
        </Card>

        {progress?.next && (
          <Card className="animate-card-in gap-3">
            <p className="text-xs font-extrabold tracking-wide text-muted-foreground uppercase">Следующее занятие</p>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-lg font-black">{progress.next.title}</p>
                <p className="text-sm text-muted-foreground">
                  {progress.next.focus} · ≈{progress.next.minutes} мин
                </p>
              </div>
              <Button asChild>
                <Link href={progress.next.href}>
                  Начать
                  <ArrowRight aria-hidden />
                </Link>
              </Button>
            </div>
          </Card>
        )}

        <section>
          <h2 className="mb-3 text-lg font-black">Навыки</h2>
          <SkillCards estimates={estimates} target={examProfile.targetBand} counts={counts} />
        </section>

        {plan && progress && (
          <section>
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg font-black">
                План: неделя {progress.week} из {plan.weeks}
              </h2>
              <span className="text-sm font-bold text-muted-foreground">
                Выполнено {progress.doneCount} из {plan.sessions.length}
              </span>
            </div>
            {plan.note && <InfoNote className="mb-3">{plan.note}</InfoNote>}
            <PlanList
              sessions={weekSessions}
              nextKey={progress.next ? `${progress.next.week}-${progress.next.index}` : null}
            />
          </section>
        )}

        {weak.length > 0 && (
          <Card className="gap-2">
            <h2 className="font-black">Где чаще всего ошибки</h2>
            <ul className="flex flex-col gap-1 text-sm">
              {weak.map((stat) => (
                <li key={stat.kind}>
                  {QUESTION_KIND_TITLES[stat.kind]}: верно {stat.correct} из {stat.total}
                </li>
              ))}
            </ul>
          </Card>
        )}

        <Button asChild variant="outline" size="lg" className="sm:self-start">
          <Link href="/exams/ielts/progress">
            <ChartLine aria-hidden />
            Подробный прогресс и весь план
          </Link>
        </Button>
      </div>
    </>
  );
}
