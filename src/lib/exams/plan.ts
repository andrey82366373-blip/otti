/**
 * Учебный план подготовки к IELTS и готовность к экзамену. Без ИИ: одинаковые данные — одинаковый план.
 * Использует список заданий, поэтому подключается только на сервере (не попадает в код для браузера).
 */
import "server-only";

import { LISTENING_SECTIONS } from "@/content/ielts/listening";
import { READING_PASSAGES } from "@/content/ielts/reading";
import { SPEAKING_TASKS } from "@/content/ielts/speaking";
import type { IeltsModule, IeltsSkill } from "@/content/ielts/types";
import { WRITING_TASKS } from "@/content/ielts/writing";
import { IELTS_SKILLS, LEVEL_BAND, daysBetween, formatBand } from "@/lib/exams/ielts";
import type { BandEstimate, IeltsLevel, PlanSession, StudyPlan, WeakestSkill } from "@/lib/exams/types";

const READING_FOCUS = ["Matching Headings", "True / False / Not Given", "Multiple Choice", "Sentence Completion", "Summary Completion", "Yes / No / Not Given"];
const LISTENING_FOCUS = ["Part 1 — форма", "Part 2 — монолог", "Part 3 — обсуждение", "Part 4 — лекция"];
const SPEAKING_FOCUS = ["Part 1 — вопросы о себе", "Part 2 — монолог по карточке", "Part 3 — обсуждение"];

export type PlanInput = {
  module: IeltsModule;
  targetBand: number;
  examDate: string | null;
  currentLevel: IeltsLevel;
  sessionsPerWeek: number;
  weakestSkill: WeakestSkill;
  /** Сегодня (YYYY-MM-DD). */
  today: string;
  /** Диагностика уже пройдена. */
  diagnosticDone: boolean;
  /** Оценка по диагностике, если есть. */
  estimateMid?: number | null;
};

/** Порядок навыков: слабый навык встречается в два раза чаще остальных. */
function skillCycle(weakest: WeakestSkill): IeltsSkill[] {
  if (weakest === "unsure") return [...IELTS_SKILLS];
  const others = IELTS_SKILLS.filter((skill) => skill !== weakest);
  return [weakest, others[0], others[1], weakest, others[2]];
}

/** Составляет понятный план по неделям. Без ИИ — одинаковые данные дают одинаковый план. */
export function generatePlan(input: PlanInput): StudyPlan {
  const sessionsPerWeek = Math.min(7, Math.max(1, Math.round(input.sessionsPerWeek)));
  const daysLeft = input.examDate ? daysBetween(input.today, input.examDate) : null;
  const weeks = daysLeft !== null && daysLeft > 0 ? Math.min(16, Math.max(1, Math.ceil(daysLeft / 7))) : 8;

  const readings = READING_PASSAGES.filter((passage) => passage.module === input.module);
  const listenings = LISTENING_SECTIONS;
  const task1 = WRITING_TASKS.filter((task) => task.task === 1 && task.module === input.module);
  const task2 = WRITING_TASKS.filter((task) => task.task === 2);
  const speakings = SPEAKING_TASKS;

  const cycle = skillCycle(input.weakestSkill);
  const counters: Record<IeltsSkill, number> = { reading: 0, listening: 0, writing: 0, speaking: 0 };
  const sessions: PlanSession[] = [];
  let cycleIndex = 0;

  for (let week = 1; week <= weeks; week += 1) {
    for (let index = 1; index <= sessionsPerWeek; index += 1) {
      if (week === 1 && index === 1 && !input.diagnosticDone) {
        sessions.push({
          week,
          index,
          kind: "diagnostic",
          title: "Диагностика",
          focus: "Мини-тест по всем навыкам: узнаем стартовый уровень",
          minutes: 30,
          href: "/exams/ielts/diagnostic",
        });
        continue;
      }
      if (week === weeks && index === sessionsPerWeek && weeks > 1) {
        sessions.push({
          week,
          index,
          kind: "mock",
          title: "Пробный экзамен",
          focus: "Reading и Listening в режиме экзамена, затем эссе Task 2",
          minutes: 90,
          href: "/exams/ielts",
        });
        continue;
      }
      const skill = cycle[cycleIndex % cycle.length];
      cycleIndex += 1;
      const n = counters[skill];
      counters[skill] += 1;
      if (skill === "reading") {
        const passage = readings[n % readings.length];
        sessions.push({
          week,
          index,
          kind: skill,
          title: `Reading: ${passage.title}`,
          focus: READING_FOCUS[n % READING_FOCUS.length],
          minutes: passage.minutes + 5,
          href: `/exams/ielts/reading/${passage.id}`,
        });
      } else if (skill === "listening") {
        const section = listenings[n % listenings.length];
        sessions.push({
          week,
          index,
          kind: skill,
          title: `Listening: ${section.title}`,
          focus: LISTENING_FOCUS[(section.part - 1) % LISTENING_FOCUS.length],
          minutes: section.minutes + 7,
          href: `/exams/ielts/listening/${section.id}`,
        });
      } else if (skill === "writing") {
        const useTask2 = n % 2 === 1;
        const list = useTask2 ? task2 : task1;
        const task = list[Math.floor(n / 2) % list.length];
        sessions.push({
          week,
          index,
          kind: skill,
          title: `Writing Task ${task.task}: ${task.title}`,
          focus: task.kindTitle,
          minutes: task.minutes + 10,
          href: `/exams/ielts/writing/${task.id}`,
        });
      } else {
        const task = speakings[n % speakings.length];
        sessions.push({
          week,
          index,
          kind: skill,
          title: `Speaking Part ${task.part}: ${task.topic}`,
          focus: SPEAKING_FOCUS[task.part - 1],
          minutes: 15,
          href: `/exams/ielts/speaking/${task.id}`,
        });
      }
    }
  }

  // Предупреждение, если до цели далеко, а времени мало
  const startBand = input.estimateMid ?? LEVEL_BAND[input.currentLevel];
  let note: string | null = null;
  if (daysLeft !== null && daysLeft <= 0) {
    note = "Дата экзамена уже прошла или сегодня — план составлен на 8 недель. Обнови дату в настройках.";
  } else if (startBand !== null && startBand !== undefined) {
    const gap = input.targetBand - startBand;
    if (gap >= 1.5 && weeks <= 8) {
      note = `До цели около ${gap.toFixed(1)} балла, а до экзамена ${weeks} нед. Это амбициозно: если есть возможность, добавь занятий в неделю или перенеси экзамен.`;
    } else if (gap >= 1 && sessionsPerWeek <= 2) {
      note = "Для такой цели 1–2 занятий в неделю может не хватить. Попробуй заниматься хотя бы 3 раза в неделю.";
    }
  }

  return { weeks, sessionsPerWeek, startDate: input.today, sessions, note };
}

/** Текущая неделя плана (с 1). */
export function currentPlanWeek(plan: StudyPlan, today: string): number {
  const days = daysBetween(plan.startDate, today);
  return Math.min(plan.weeks, Math.max(1, Math.floor(days / 7) + 1));
}

export type PlanProgress = {
  /** Выполнено ли каждое занятие плана (по порядку). */
  done: boolean[];
  doneCount: number;
  /** Сколько занятий должно быть выполнено к концу текущей недели. */
  dueCount: number;
  week: number;
  next: PlanSession | null;
};

/**
 * Какие занятия плана выполнены. Каждая попытка засчитывается одному занятию:
 * берём занятия по порядку и ищем подходящую попытку того же навыка после начала плана.
 */
export function planProgress(
  plan: StudyPlan,
  attempts: { skill: string; mode: string; createdAt: Date }[],
  diagnosticDone: boolean,
  today: string,
): PlanProgress {
  const start = Date.parse(`${plan.startDate}T00:00:00Z`);
  const pool = attempts
    .filter((attempt) => attempt.createdAt.getTime() >= start && attempt.mode !== "diagnostic")
    .map((attempt) => ({ skill: attempt.skill, used: false }));
  const done = plan.sessions.map((session) => {
    if (session.kind === "diagnostic") return diagnosticDone;
    if (session.kind === "mock") {
      const found = pool.find((item) => !item.used && item.skill === "reading");
      if (!found) return false;
      found.used = true;
      return true;
    }
    const found = pool.find((item) => !item.used && item.skill === session.kind);
    if (!found) return false;
    found.used = true;
    return true;
  });
  const week = currentPlanWeek(plan, today);
  const dueCount = plan.sessions.filter((session) => session.week <= week).length;
  const nextIndex = done.findIndex((value) => !value);
  return {
    done,
    doneCount: done.filter(Boolean).length,
    dueCount,
    week,
    next: nextIndex === -1 ? null : plan.sessions[nextIndex],
  };
}

export type Readiness = { percent: number; title: string; note: string } | null;

/**
 * Готовность к экзамену: на 75% — насколько примерный балл близок к цели,
 * на 25% — насколько регулярно выполняется план. Без оценки готовность не считаем.
 * При низкой уверенности берём нижнюю границу диапазона и не показываем больше 70%:
 * по нескольким заданиям нельзя честно сказать «почти готов».
 */
export function readiness(estimate: BandEstimate | null, target: number, progress: PlanProgress | null): Readiness {
  if (!estimate) return null;
  const cautious = estimate.confidence === "low";
  const basis = cautious ? estimate.low : estimate.mid;
  const scorePart = Math.min(1, Math.max(0, (basis - (target - 2)) / 2));
  const practicePart = progress && progress.dueCount > 0 ? Math.min(1, progress.doneCount / progress.dueCount) : 0;
  let percent = Math.round(100 * (0.75 * scorePart + 0.25 * practicePart));
  if (cautious) percent = Math.min(percent, 70);
  const title = percent >= 85 ? "Почти готов" : percent >= 60 ? "Хороший темп" : percent >= 35 ? "В процессе" : "Начало пути";
  const note = cautious
    ? "Данных пока мало, поэтому оценка осторожная. Выполни задания по всем четырём навыкам — она станет точнее."
    : basis >= target
      ? "Примерный балл уже на уровне цели — закрепляй результат пробными экзаменами."
      : `До цели примерно ${formatBand(target - basis)} балла.`;
  return { percent, title, note };
}

/** Сколько дней до экзамена (null — дата не указана). */
export function daysUntilExam(examDate: string | null, today: string): number | null {
  return examDate ? daysBetween(today, examDate) : null;
}

