/** Подготовка к экзаменам в базе: профиль IELTS, попытки, оценки по навыкам, черновики и проверки ИИ. */
import "server-only";

import { and, count, desc, eq, ne } from "drizzle-orm";

import { getDb } from "@/db";
import { examAiChecks, examAttempts, examDrafts, examProfiles } from "@/db/schema";
import { aiDay } from "@/lib/ai/limits";
import {
  objectiveEstimate,
  overallEstimate,
  productiveEstimate,
  statsByKind,
} from "@/lib/exams/ielts";
import type { BandEstimate, IeltsSkill } from "@/lib/exams/types";

export type ExamProfile = typeof examProfiles.$inferSelect;
export type ExamAttempt = typeof examAttempts.$inferSelect;
export type ExamCheck = typeof examAiChecks.$inferSelect;

export async function getIeltsProfile(userId: string): Promise<ExamProfile | null> {
  const [row] = await getDb()
    .select()
    .from(examProfiles)
    .where(and(eq(examProfiles.userId, userId), eq(examProfiles.exam, "ielts")))
    .limit(1);
  return row ?? null;
}

/** Последние попытки ученика (новые сверху). */
export async function getIeltsAttempts(userId: string, limit = 300): Promise<ExamAttempt[]> {
  return getDb()
    .select()
    .from(examAttempts)
    .where(and(eq(examAttempts.userId, userId), eq(examAttempts.exam, "ielts")))
    .orderBy(desc(examAttempts.createdAt))
    .limit(limit);
}

/** Сколько вопросов берём для оценки Reading/Listening: примерно один полный экзамен. */
const POOL_QUESTIONS = 40;
/** Сколько последних проверок Writing/Speaking усредняем. */
const POOL_CHECKS = 3;

export type SkillEstimates = Record<IeltsSkill, BandEstimate | null> & { overall: BandEstimate | null };

/** Примерные баллы по навыкам — по последним попыткам (новые важнее старых). */
export function estimateSkills(attempts: ExamAttempt[], module: "academic" | "general"): SkillEstimates {
  const objective = (skill: "reading" | "listening") => {
    let correct = 0;
    let total = 0;
    for (const attempt of attempts) {
      if (attempt.skill !== skill || attempt.total === 0) continue;
      correct += attempt.correct;
      total += attempt.total;
      if (total >= POOL_QUESTIONS) break;
    }
    return objectiveEstimate(correct, total, skill, module);
  };
  const productive = (skill: "writing" | "speaking") => {
    const mids = attempts
      .filter((attempt) => attempt.skill === skill && attempt.bandLow !== null && attempt.bandHigh !== null)
      .slice(0, POOL_CHECKS)
      .map((attempt) => ((attempt.bandLow ?? 0) + (attempt.bandHigh ?? 0)) / 2);
    return productiveEstimate(mids);
  };
  const skills = {
    reading: objective("reading"),
    listening: objective("listening"),
    writing: productive("writing"),
    speaking: productive("speaking"),
  };
  return { ...skills, overall: overallEstimate(skills) };
}

/** Типы вопросов, в которых ученик ошибается чаще всего. */
export function mistakeStats(attempts: ExamAttempt[]) {
  return statsByKind(attempts.filter((attempt) => attempt.review).map((attempt) => attempt.review ?? []));
}

/** Сколько проверок ИИ ученик сделал сегодня (без диагностики). */
export async function countChecksToday(userId: string, kind: "writing" | "speaking"): Promise<number> {
  const [row] = await getDb()
    .select({ total: count() })
    .from(examAiChecks)
    .where(
      and(
        eq(examAiChecks.userId, userId),
        eq(examAiChecks.kind, kind),
        eq(examAiChecks.day, aiDay()),
        ne(examAiChecks.taskId, kind === "writing" ? "wd-diagnostic" : "sd-diagnostic"),
      ),
    );
  return row?.total ?? 0;
}

/** Последняя проверка задания (готовая или идущая). */
export async function getLatestCheck(userId: string, kind: "writing" | "speaking", taskId: string): Promise<ExamCheck | null> {
  const [row] = await getDb()
    .select()
    .from(examAiChecks)
    .where(and(eq(examAiChecks.userId, userId), eq(examAiChecks.kind, kind), eq(examAiChecks.taskId, taskId)))
    .orderBy(desc(examAiChecks.createdAt))
    .limit(1);
  return row ?? null;
}

export async function getDraft(userId: string, taskId: string): Promise<string> {
  const [row] = await getDb()
    .select({ text: examDrafts.text })
    .from(examDrafts)
    .where(and(eq(examDrafts.userId, userId), eq(examDrafts.taskId, taskId)))
    .limit(1);
  return row?.text ?? "";
}

/** Лучший результат по каждому заданию Reading/Listening и последняя оценка Writing/Speaking. */
export function bestByTask(attempts: ExamAttempt[]) {
  const map = new Map<string, { correct: number; total: number; bandLow: number | null; bandHigh: number | null; count: number }>();
  for (const attempt of attempts) {
    const current = map.get(attempt.taskId);
    if (!current) {
      map.set(attempt.taskId, {
        correct: attempt.correct,
        total: attempt.total,
        bandLow: attempt.bandLow,
        bandHigh: attempt.bandHigh,
        count: 1,
      });
      continue;
    }
    current.count += 1;
    if (attempt.total > 0 && attempt.correct / attempt.total > current.correct / Math.max(1, current.total)) {
      current.correct = attempt.correct;
      current.total = attempt.total;
    }
  }
  return map;
}

/** Идущая проверка считается «живой» 3 минуты; готовая — всегда. */
export function isCheckUsable(check: ExamCheck | null): check is ExamCheck {
  if (!check) return false;
  return check.status === "done" || Date.now() - check.createdAt.getTime() < 3 * 60 * 1000;
}

/** Последние готовые проверки Writing/Speaking — для «повторяющихся ошибок». */
export async function getRecentChecks(userId: string, limit = 20): Promise<ExamCheck[]> {
  return getDb()
    .select()
    .from(examAiChecks)
    .where(and(eq(examAiChecks.userId, userId), eq(examAiChecks.status, "done")))
    .orderBy(desc(examAiChecks.createdAt))
    .limit(limit);
}
