/**
 * IELTS: проверка ответов, примерный перевод баллов в Band Score, учебный план и готовность.
 * Здесь нет обращений к базе — только расчёты, поэтому модуль можно использовать и на сервере, и в браузере.
 */
import type {
  IeltsModule,
  IeltsSkill,
  Question,
  QuestionGroup,
  QuestionKind,
} from "@/content/ielts/types";
import type {
  BandEstimate,
  Confidence,
  IeltsLevel,
  ObjectiveReviewItem,
} from "@/lib/exams/types";

/* ─────────────────────────── Справочники ─────────────────────────── */

export const IELTS_MODULE_INFO: Record<IeltsModule, { title: string; description: string }> = {
  academic: {
    title: "IELTS Academic",
    description: "Для поступления в университет и профессиональной регистрации за рубежом.",
  },
  general: {
    title: "IELTS General Training",
    description: "Для работы, переезда и программ, где не нужен академический английский.",
  },
};

export const SKILL_TITLES: Record<IeltsSkill, string> = {
  reading: "Reading",
  listening: "Listening",
  writing: "Writing",
  speaking: "Speaking",
};

export const SKILL_RU: Record<IeltsSkill, string> = {
  reading: "чтение",
  listening: "аудирование",
  writing: "письмо",
  speaking: "говорение",
};

export const IELTS_SKILLS: IeltsSkill[] = ["reading", "listening", "writing", "speaking"];

export const TARGET_BANDS = [4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5] as const;

export const IELTS_LEVELS: { value: IeltsLevel; title: string; description: string }[] = [
  { value: "A2", title: "A2 — начальный", description: "Понимаю простые фразы, говорю с трудом" },
  { value: "B1", title: "B1 — средний", description: "Общаюсь на бытовые темы, понимаю простые тексты" },
  { value: "B2", title: "B2 — выше среднего", description: "Свободно обсуждаю многие темы, читаю статьи" },
  { value: "C1", title: "C1 — продвинутый", description: "Понимаю сложные тексты и лекции" },
  { value: "unknown", title: "Не знаю", description: "Определим по диагностике" },
];

/** Примерное соответствие уровня CEFR и Band Score — только для стартового плана. */
export const LEVEL_BAND: Record<IeltsLevel, number | null> = { A2: 4, B1: 5, B2: 6, C1: 7, unknown: null };

export const CONFIDENCE_TITLES: Record<Confidence, string> = {
  low: "низкая",
  medium: "средняя",
  high: "высокая",
};

/** Обязательная пометка там, где оценку ставит ИИ. */
export const AI_ESTIMATE_DISCLAIMER =
  "Оценка создана ИИ, является приблизительной и не является официальным результатом IELTS.";

/** Пометка для оценок Reading и Listening по нашим заданиям. */
export const OBJECTIVE_ESTIMATE_NOTE =
  "Примерный балл пересчитан по доле верных ответов. Это ориентир, а не официальный результат IELTS.";

/* ───────────────────────── Проверка ответов ───────────────────────── */

/** Для сравнения ответов: без регистра, лишних пробелов, точек и кавычек по краям. */
export function normalizeAnswer(value: string): string {
  return value
    .toLowerCase()
    .replace(/[’`]/g, "'")
    .replace(/[“”«»"]/g, "")
    .replace(/\s+/g, " ")
    .replace(/^[\s.,;:!?-]+|[\s.,;:!?]+$/g, "")
    .trim();
}

export function countWords(text: string): number {
  const words = text.trim().match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu);
  return words ? words.length : 0;
}

export type AnswerValue = string | number | null;

/** Правильный ли ответ на вопрос. Проверка делается на сервере — браузеру не доверяем. */
export function isAnswerCorrect(question: Question, value: AnswerValue): boolean {
  if (value === null || value === "") return false;
  switch (question.kind) {
    case "mcq":
      return Number(value) === question.answer;
    case "tfng":
    case "ynng":
    case "heading":
    case "summary":
    case "match":
      return normalizeAnswer(String(value)) === normalizeAnswer(question.answer);
    case "sentence":
    case "gap": {
      const given = normalizeAnswer(String(value));
      const withoutArticle = given.replace(/^(the|a|an) /, "");
      return question.answers.some((answer) => {
        const expected = normalizeAnswer(answer);
        return given === expected || withoutArticle === expected;
      });
    }
  }
}

/** Правильный ответ в понятном виде — для разбора. */
export function correctAnswerLabel(question: Question, group: QuestionGroup): string {
  switch (question.kind) {
    case "mcq":
      return `${String.fromCharCode(65 + question.answer)}. ${question.options[question.answer]}`;
    case "tfng":
    case "ynng":
      return question.answer;
    case "heading": {
      const heading = group.headings?.find((item) => item.id === question.answer);
      return heading ? `${heading.id}. ${heading.text}` : question.answer;
    }
    case "summary":
    case "match": {
      const option = group.options?.find((item) => item.id === question.answer);
      return option ? `${option.id} — ${option.text}` : question.answer;
    }
    case "sentence":
    case "gap":
      return question.answers[0];
  }
}

/** Ответ ученика в понятном виде. */
export function givenAnswerLabel(question: Question, group: QuestionGroup, value: AnswerValue): string | null {
  if (value === null || value === "") return null;
  if (question.kind === "mcq") {
    const index = Number(value);
    return Number.isInteger(index) && question.options[index]
      ? `${String.fromCharCode(65 + index)}. ${question.options[index]}`
      : null;
  }
  if (question.kind === "heading") {
    const heading = group.headings?.find((item) => item.id === value);
    return heading ? `${heading.id}. ${heading.text}` : String(value);
  }
  if (question.kind === "summary" || question.kind === "match") {
    const option = group.options?.find((item) => item.id === value);
    return option ? `${option.id} — ${option.text}` : String(value);
  }
  return String(value).slice(0, 120);
}

export type ObjectiveTask = { groups: QuestionGroup[] };

/** Все вопросы задания по порядку с номерами (1, 2, 3…) — как на экзамене. */
export function numberedQuestions(task: ObjectiveTask) {
  let number = 0;
  return task.groups.flatMap((group) =>
    group.questions.map((question) => {
      number += 1;
      return { number, question, group };
    }),
  );
}

/** Проверка всего задания: сколько верно и разбор по вопросам. */
export function gradeObjective(task: ObjectiveTask, answers: Record<string, AnswerValue>) {
  const review: ObjectiveReviewItem[] = [];
  let correct = 0;
  for (const { question, group } of numberedQuestions(task)) {
    const value = answers[question.id] ?? null;
    const ok = isAnswerCorrect(question, value);
    if (ok) correct += 1;
    review.push({
      questionId: question.id,
      kind: question.kind,
      correct: ok,
      answer: givenAnswerLabel(question, group, value),
    });
  }
  return { correct, total: review.length, review };
}

/* ─────────────────────── Примерный Band Score ─────────────────────── */

/**
 * Примерные таблицы перевода «верных ответов из 40» в Band Score.
 * Используются только как ориентир: наши задания короче настоящего экзамена.
 */
const LISTENING_TABLE: [number, number][] = [
  [39, 9], [37, 8.5], [35, 8], [32, 7.5], [30, 7], [26, 6.5], [23, 6], [18, 5.5], [16, 5],
  [13, 4.5], [10, 4], [8, 3.5], [6, 3], [4, 2.5], [0, 2],
];
const ACADEMIC_READING_TABLE: [number, number][] = [
  [39, 9], [37, 8.5], [35, 8], [33, 7.5], [30, 7], [27, 6.5], [23, 6], [19, 5.5], [15, 5],
  [13, 4.5], [10, 4], [8, 3.5], [6, 3], [4, 2.5], [0, 2],
];
const GENERAL_READING_TABLE: [number, number][] = [
  [40, 9], [39, 8.5], [37, 8], [36, 7.5], [34, 7], [32, 6.5], [30, 6], [27, 5.5], [23, 5],
  [19, 4.5], [15, 4], [12, 3.5], [9, 3], [6, 2.5], [0, 2],
];

/** Округление Band Score как в IELTS: до ближайшей половины (x.25 → x.5, x.75 → x+1). */
export function roundBand(value: number): number {
  return Math.min(9, Math.max(0, Math.round(value * 2) / 2));
}

export function rawToBand(correct: number, total: number, skill: "reading" | "listening", module: IeltsModule): number {
  if (total <= 0) return 0;
  const raw40 = Math.round((correct / total) * 40);
  const table =
    skill === "listening" ? LISTENING_TABLE : module === "general" ? GENERAL_READING_TABLE : ACADEMIC_READING_TABLE;
  return table.find(([min]) => raw40 >= min)?.[1] ?? 2;
}

/** Меньше этого числа вопросов — оценку не показываем совсем. */
export const MIN_QUESTIONS_FOR_ESTIMATE = 5;

/**
 * Примерный балл Reading/Listening по объёму ответов.
 * Чем меньше вопросов, тем шире диапазон и ниже уверенность.
 */
export function objectiveEstimate(
  correct: number,
  total: number,
  skill: "reading" | "listening",
  module: IeltsModule,
): BandEstimate | null {
  if (total < MIN_QUESTIONS_FOR_ESTIMATE) return null;
  const band = rawToBand(correct, total, skill, module);
  const spread = total < 12 ? 1 : 0.5;
  const confidence: Confidence = total < 25 ? "low" : total < 40 ? "medium" : "high";
  return {
    low: roundBand(Math.max(1, band - spread)),
    high: roundBand(Math.min(9, band + spread)),
    mid: band,
    confidence,
    basis: `по ${total} ${questionsWord(total)}`,
  };
}

function questionsWord(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return "вопросу";
  return "вопросам";
}

/** Оценка Writing/Speaking по нескольким проверкам ИИ: среднее, с шириной по числу проверок. */
export function productiveEstimate(mids: number[], unit: string): BandEstimate | null {
  if (mids.length === 0) return null;
  const mid = roundBand(mids.reduce((sum, value) => sum + value, 0) / mids.length);
  const confidence: Confidence = mids.length === 1 ? "low" : "medium";
  return {
    low: roundBand(Math.max(1, mid - 0.5)),
    high: roundBand(Math.min(9, mid + 0.5)),
    mid,
    confidence,
    basis: `по ${mids.length} ${unit}`,
  };
}

/** Общий балл: среднее по навыкам. Нужны оценки хотя бы по двум навыкам. */
export function overallEstimate(skills: Partial<Record<IeltsSkill, BandEstimate | null>>): BandEstimate | null {
  const list = IELTS_SKILLS.map((skill) => skills[skill]).filter((item): item is BandEstimate => Boolean(item));
  if (list.length < 2) return null;
  const average = (pick: (item: BandEstimate) => number) => list.reduce((sum, item) => sum + pick(item), 0) / list.length;
  const confidence: Confidence =
    list.length < 4 || list.some((item) => item.confidence === "low")
      ? "low"
      : list.every((item) => item.confidence === "high")
        ? "high"
        : "medium";
  return {
    low: roundBand(average((item) => item.low)),
    high: roundBand(average((item) => item.high)),
    mid: roundBand(average((item) => item.mid)),
    confidence,
    basis: list.length < 4 ? `по ${list.length} навыкам из 4` : "по всем четырём навыкам",
  };
}

export function formatBand(value: number): string {
  return Number.isInteger(value) ? `${value}.0` : String(value);
}

export function formatRange(estimate: { low: number; high: number }): string {
  return estimate.low === estimate.high
    ? formatBand(estimate.low)
    : `${formatBand(estimate.low)}–${formatBand(estimate.high)}`;
}

/* ─────────────────────── Статистика ошибок ─────────────────────── */

export type KindStat = { kind: QuestionKind; correct: number; total: number };

/** Точность по типам вопросов — чтобы увидеть, где ошибки повторяются. */
export function statsByKind(reviews: ObjectiveReviewItem[][]): KindStat[] {
  const map = new Map<QuestionKind, KindStat>();
  for (const review of reviews) {
    for (const item of review) {
      const stat = map.get(item.kind) ?? { kind: item.kind, correct: 0, total: 0 };
      stat.total += 1;
      if (item.correct) stat.correct += 1;
      map.set(item.kind, stat);
    }
  }
  return [...map.values()].sort((a, b) => a.correct / a.total - b.correct / b.total);
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((Date.parse(`${toIso}T00:00:00Z`) - Date.parse(`${fromIso}T00:00:00Z`)) / DAY_MS);
}

/* ───────────── Задание для браузера: без ответов и объяснений ───────────── */

export type PublicQuestion =
  | { id: string; kind: "mcq"; prompt: string; options: string[] }
  | { id: string; kind: "tfng" | "ynng"; statement: string }
  | { id: string; kind: "heading"; paragraph: string }
  | { id: string; kind: "sentence" | "gap"; prompt: string; maxWords: number }
  | { id: string; kind: "summary" }
  | { id: string; kind: "match"; prompt: string };

export type PublicGroup = Omit<QuestionGroup, "questions"> & { questions: PublicQuestion[] };

/** Убирает правильные ответы: в браузер уходят только вопросы, ответы проверяет сервер. */
export function toPublicGroups(groups: QuestionGroup[]): PublicGroup[] {
  return groups.map((group) => ({
    ...group,
    questions: group.questions.map((question): PublicQuestion => {
      switch (question.kind) {
        case "mcq":
          return { id: question.id, kind: "mcq", prompt: question.prompt, options: question.options };
        case "tfng":
        case "ynng":
          return { id: question.id, kind: question.kind, statement: question.statement };
        case "heading":
          return { id: question.id, kind: "heading", paragraph: question.paragraph };
        case "sentence":
        case "gap":
          return { id: question.id, kind: question.kind, prompt: question.prompt, maxWords: question.maxWords };
        case "summary":
          return { id: question.id, kind: "summary" };
        case "match":
          return { id: question.id, kind: "match", prompt: question.prompt };
      }
    }),
  }));
}

/** Что считается правильным ответом — приходит в браузер только после проверки. */
export type ExpectedAnswer =
  | { type: "index"; value: number }
  | { type: "label"; value: string }
  | { type: "text"; values: string[] };

/** Подробный разбор вопроса после проверки. */
export type ReviewDetail = {
  questionId: string;
  kind: QuestionKind;
  correct: boolean;
  given: string | null;
  correctLabel: string;
  explanation: string;
  evidence: string | null;
  expected: ExpectedAnswer;
};

export function expectedAnswer(question: Question): ExpectedAnswer {
  switch (question.kind) {
    case "mcq":
      return { type: "index", value: question.answer };
    case "sentence":
    case "gap":
      return { type: "text", values: question.answers };
    default:
      return { type: "label", value: question.answer };
  }
}

/** Проверка в браузере при «работе над ошибками» (после того как сервер уже прислал разбор). */
export function matchesExpected(expected: ExpectedAnswer, value: AnswerValue): boolean {
  if (value === null || value === "") return false;
  if (expected.type === "index") return Number(value) === expected.value;
  if (expected.type === "label") return normalizeAnswer(String(value)) === normalizeAnswer(expected.value);
  const given = normalizeAnswer(String(value));
  const withoutArticle = given.replace(/^(the|a|an) /, "");
  return expected.values.some((answer) => {
    const normalized = normalizeAnswer(answer);
    return given === normalized || withoutArticle === normalized;
  });
}

/** Разбор всех вопросов для показа ученику. */
export function reviewDetails(task: ObjectiveTask, answers: Record<string, AnswerValue>): ReviewDetail[] {
  return numberedQuestions(task).map(({ question, group }) => {
    const value = answers[question.id] ?? null;
    return {
      questionId: question.id,
      kind: question.kind,
      correct: isAnswerCorrect(question, value),
      given: givenAnswerLabel(question, group, value),
      correctLabel: correctAnswerLabel(question, group),
      explanation: question.explanation,
      evidence: question.evidence ?? null,
      expected: expectedAnswer(question),
    };
  });
}
