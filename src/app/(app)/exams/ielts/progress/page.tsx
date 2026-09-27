import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Clock } from "lucide-react";

import { BandBadge, InfoNote } from "@/components/exams/exam-ui";
import { PlanList } from "@/components/exams/plan-list";
import { SKILL_ICONS } from "@/components/exams/skill-icons";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { QUESTION_KIND_TITLES } from "@/content/ielts/types";
import { formatDayLong, todayInTimezone } from "@/lib/dates";
import { AI_ESTIMATE_DISCLAIMER, IELTS_SKILLS, SKILL_TITLES, formatBand, formatRange } from "@/lib/exams/ielts";
import { planProgress, readiness } from "@/lib/exams/plan";
import { requireIelts } from "@/lib/exams/require";
import { estimateSkills, getIeltsAttempts, getRecentChecks, mistakeStats } from "@/lib/exams/store";
import { taskTitle } from "@/lib/exams/titles";
import type { IeltsSkill } from "@/lib/exams/types";
import { getProfile } from "@/lib/profile";

export const metadata: Metadata = { title: "Прогресс IELTS" };

const MISTAKE_TYPE_TITLES: Record<string, string> = {
  grammar: "Грамматика",
  vocabulary: "Слова",
  spelling: "Орфография",
  punctuation: "Пунктуация",
  coherence: "Связность",
  task: "Выполнение задания",
};

function formatMinutes(seconds: number) {
  const minutes = Math.round(seconds / 60);
  return minutes < 60 ? `${minutes} мин` : `${Math.floor(minutes / 60)} ч ${minutes % 60} мин`;
}

export default async function IeltsProgressPage() {
  const { userId, profile: exam } = await requireIelts();
  const [attempts, checks, profile] = await Promise.all([getIeltsAttempts(userId), getRecentChecks(userId), getProfile(userId)]);
  const today = todayInTimezone(profile.timezone);
  const estimates = estimateSkills(attempts, exam.module);
  const progress = exam.plan ? planProgress(exam.plan, attempts, Boolean(exam.diagnostic), today) : null;
  const ready = readiness(estimates.overall, exam.targetBand, progress);
  const kinds = mistakeStats(attempts);
  const totalSeconds = attempts.reduce((sum, attempt) => sum + attempt.durationSec, 0);
  const weekAgo = new Date(`${today}T00:00:00Z`).getTime() - 6 * 24 * 60 * 60 * 1000;
  const weekSeconds = attempts
    .filter((attempt) => attempt.createdAt.getTime() >= weekAgo)
    .reduce((sum, attempt) => sum + attempt.durationSec, 0);
  const mistakeTypes = new Map<string, number>();
  for (const check of checks) {
    for (const mistake of check.writing?.mistakes ?? []) {
      mistakeTypes.set(mistake.type, (mistakeTypes.get(mistake.type) ?? 0) + 1);
    }
    if (check.speaking?.corrections.length) {
      mistakeTypes.set("grammar", (mistakeTypes.get("grammar") ?? 0) + check.speaking.corrections.length);
    }
  }
  const topTypes = [...mistakeTypes.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);

  return (
    <>
      <Link href="/exams/ielts" className="mb-3 flex items-center gap-1.5 text-sm font-bold text-primary hover:underline">
        <ArrowLeft className="size-4" aria-hidden />
        IELTS
      </Link>
      <PageHeader title="Прогресс подготовки" description={`Цель: ${formatBand(exam.targetBand)}. Оценки примерные и обновляются после каждого задания.`} />

      <div className="flex flex-col gap-5">
        <Card className="gap-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-extrabold tracking-wide text-muted-foreground uppercase">Общий примерный балл</p>
              {estimates.overall ? (
                <BandBadge estimate={estimates.overall} size="lg" />
              ) : (
                <p className="text-sm text-muted-foreground">Нужны задания хотя бы по двум навыкам.</p>
              )}
            </div>
            {ready && (
              <div className="min-w-48 flex-1 sm:max-w-xs">
                <p className="mb-1 text-sm font-bold">
                  Готовность: {ready.percent}% · {ready.title}
                </p>
                <Progress value={ready.percent} label={`Готовность ${ready.percent}%`} barClassName="bg-success" />
              </div>
            )}
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {IELTS_SKILLS.map((skill: IeltsSkill) => {
              const Icon = SKILL_ICONS[skill];
              const estimate = estimates[skill];
              return (
                <li key={skill} className="flex flex-col gap-2 rounded-xl border-2 p-3">
                  <p className="flex items-center gap-2 font-black">
                    <Icon className="size-5 text-primary" aria-hidden />
                    {SKILL_TITLES[skill]}
                  </p>
                  {estimate ? (
                    <>
                      <BandBadge estimate={estimate} size="sm" />
                      <Progress
                        value={Math.min(estimate.mid, exam.targetBand)}
                        max={exam.targetBand}
                        label={`${SKILL_TITLES[skill]}: ${formatBand(estimate.mid)} из ${formatBand(exam.targetBand)}`}
                        className="h-2"
                        barClassName={estimate.mid >= exam.targetBand ? "bg-success" : "bg-primary"}
                      />
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">Нет данных</p>
                  )}
                </li>
              );
            })}
          </ul>
          {(estimates.writing || estimates.speaking) && <InfoNote>Writing и Speaking: {AI_ESTIMATE_DISCLAIMER}</InfoNote>}
        </Card>

        <div className="grid gap-3 sm:grid-cols-2">
          <Card className="gap-1">
            <p className="flex items-center gap-2 font-black">
              <Clock className="size-5 text-primary" aria-hidden />
              Время занятий
            </p>
            <p className="text-2xl font-black">{formatMinutes(totalSeconds)}</p>
            <p className="text-sm text-muted-foreground">за последние 7 дней: {formatMinutes(weekSeconds)}</p>
          </Card>
          <Card className="gap-1">
            <p className="font-black">Выполнено заданий</p>
            <p className="text-2xl font-black">{attempts.length}</p>
            <p className="text-sm text-muted-foreground">
              {IELTS_SKILLS.map((skill) => `${SKILL_TITLES[skill]}: ${attempts.filter((item) => item.skill === skill).length}`).join(" · ")}
            </p>
          </Card>
        </div>

        {(kinds.length > 0 || topTypes.length > 0) && (
          <Card className="gap-3">
            <h2 className="text-lg font-black">Повторяющиеся ошибки</h2>
            {kinds.length > 0 && (
              <ul className="flex flex-col gap-2">
                {kinds.map((stat) => {
                  const percent = Math.round((stat.correct / stat.total) * 100);
                  return (
                    <li key={stat.kind} className="flex flex-col gap-1">
                      <div className="flex justify-between gap-2 text-sm">
                        <span className="font-bold">{QUESTION_KIND_TITLES[stat.kind]}</span>
                        <span className="tabular-nums text-muted-foreground">
                          верно {stat.correct} из {stat.total} ({percent}%)
                        </span>
                      </div>
                      <Progress
                        value={stat.correct}
                        max={stat.total}
                        label={`${QUESTION_KIND_TITLES[stat.kind]}: ${percent}% верно`}
                        className="h-2"
                        barClassName={percent >= 70 ? "bg-success" : percent >= 50 ? "bg-xp" : "bg-destructive"}
                      />
                    </li>
                  );
                })}
              </ul>
            )}
            {topTypes.length > 0 && (
              <p className="text-sm">
                <span className="font-bold">В Writing и Speaking чаще всего:</span>{" "}
                {topTypes.map(([type, count]) => `${MISTAKE_TYPE_TITLES[type] ?? type} (${count})`).join(", ")}
              </p>
            )}
          </Card>
        )}

        {exam.diagnostic && (
          <Card className="gap-2">
            <h2 className="text-lg font-black">Диагностика</h2>
            <p className="text-sm text-muted-foreground">Пройдена {formatDayLong(exam.diagnostic.completedAt.slice(0, 10))}</p>
            <p className="text-sm">
              Reading {exam.diagnostic.reading.correct}/{exam.diagnostic.reading.total} · Listening{" "}
              {exam.diagnostic.listening.correct}/{exam.diagnostic.listening.total}
              {exam.diagnostic.writing ? ` · Writing ≈ ${formatRange(exam.diagnostic.writing)}` : ""}
              {exam.diagnostic.speaking ? ` · Speaking ≈ ${formatRange(exam.diagnostic.speaking)}` : ""}
              {exam.diagnostic.estimate ? ` · итог ≈ ${formatRange(exam.diagnostic.estimate)}` : ""}
            </p>
          </Card>
        )}

        <Card className="gap-3">
          <h2 className="text-lg font-black">История заданий</h2>
          {attempts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Пока пусто — начни с диагностики или любого задания.</p>
          ) : (
            <ul className="divide-y">
              {attempts.slice(0, 40).map((attempt) => (
                <li key={attempt.id} className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 py-2 text-sm">
                  <span className="min-w-0">
                    <span className="font-bold">{SKILL_TITLES[attempt.skill as IeltsSkill] ?? attempt.skill}</span>{" "}
                    <span lang="en">{taskTitle(attempt.taskId)}</span>
                    {attempt.mode === "exam" && <span className="text-muted-foreground"> · режим экзамена</span>}
                  </span>
                  <span className="text-muted-foreground tabular-nums">
                    {attempt.total > 0 ? `${attempt.correct}/${attempt.total}` : ""}
                    {attempt.bandLow !== null && attempt.bandHigh !== null
                      ? ` ≈ ${formatRange({ low: attempt.bandLow, high: attempt.bandHigh })}`
                      : ""}
                    {attempt.durationSec > 0 ? ` · ${formatMinutes(attempt.durationSec)}` : ""} ·{" "}
                    {formatDayLong(attempt.createdAt.toISOString().slice(0, 10))}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {exam.plan && progress && (
          <section>
            <h2 className="mb-3 text-lg font-black">
              Учебный план: {exam.plan.weeks} нед., {exam.plan.sessionsPerWeek} занятия в неделю
            </h2>
            {exam.plan.note && <InfoNote className="mb-3">{exam.plan.note}</InfoNote>}
            <div className="flex flex-col gap-4">
              {Array.from({ length: exam.plan.weeks }, (_, weekIndex) => weekIndex + 1).map((week) => (
                <div key={week}>
                  <p className="mb-2 text-sm font-extrabold text-muted-foreground">
                    Неделя {week}
                    {week === progress.week ? " — сейчас" : ""}
                  </p>
                  <PlanList
                    sessions={exam
                      .plan!.sessions.map((session, index) => ({ session, done: progress.done[index] }))
                      .filter(({ session }) => session.week === week)}
                    nextKey={progress.next ? `${progress.next.week}-${progress.next.index}` : null}
                  />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
