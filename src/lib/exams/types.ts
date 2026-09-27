/** Общие типы раздела «Подготовка к экзаменам» — для базы, сервера и страниц. */
import type { IeltsModule, IeltsSkill, QuestionKind } from "@/content/ielts/types";

export type { IeltsModule, IeltsSkill };

/** Насколько можно доверять оценке: зависит от объёма выполненных заданий. */
export type Confidence = "low" | "medium" | "high";

export type BandEstimate = {
  low: number;
  high: number;
  mid: number;
  confidence: Confidence;
  /** На чём основана оценка, например «по 24 вопросам». */
  basis: string;
};

export type IeltsLevel = "A2" | "B1" | "B2" | "C1" | "unknown";
export type WeakestSkill = IeltsSkill | "unsure";

export type PlanSessionKind = IeltsSkill | "diagnostic" | "mock";

export type PlanSession = {
  week: number;
  /** Порядковый номер занятия в неделе (с 1). */
  index: number;
  kind: PlanSessionKind;
  title: string;
  /** Что именно тренировать: тип вопросов, часть экзамена, тип эссе. */
  focus: string;
  minutes: number;
  href: string;
};

export type StudyPlan = {
  weeks: number;
  sessionsPerWeek: number;
  /** Дата начала плана (YYYY-MM-DD). */
  startDate: string;
  sessions: PlanSession[];
  /** Предупреждение, если цель амбициозная для оставшегося времени. */
  note: string | null;
};

export type DiagnosticResult = {
  completedAt: string;
  reading: { correct: number; total: number };
  listening: { correct: number; total: number };
  writing: { low: number; high: number } | null;
  speaking: { low: number; high: number } | null;
  estimate: BandEstimate | null;
};

/** Разбор одного вопроса Reading/Listening после проверки. */
export type ObjectiveReviewItem = {
  questionId: string;
  kind: QuestionKind;
  correct: boolean;
  /** Ответ ученика в понятном виде (или null — пропущен). */
  answer: string | null;
};

export type CriterionScore = { band: number; comment: string };

export type WritingMistake = {
  /** Точная цитата из текста ученика. */
  quote: string;
  type: "grammar" | "vocabulary" | "spelling" | "punctuation" | "coherence" | "task";
  /** Подсказка без готового ответа — чтобы ученик исправил сам. */
  hint: string;
  /** Исправленный вариант — показывается только по кнопке. */
  correction: string;
};

export type WritingFeedback = {
  /** Task Achievement (Task 1) или Task Response (Task 2). */
  task: CriterionScore;
  coherence: CriterionScore;
  lexical: CriterionScore;
  grammar: CriterionScore;
  /** null — текст слишком короткий, балл не выставляется. */
  overall: BandEstimate | null;
  taskCheck: string;
  mistakes: WritingMistake[];
  strengths: string[];
  improvements: string[];
  wordCount: number;
};

export type SpeakingCorrection = { quote: string; correction: string; explanation: string };

export type SpeakingFeedback = {
  fluency: CriterionScore;
  lexical: CriterionScore;
  grammar: CriterionScore;
  /** Подсказки о произношении — только если ответ был голосом и данных достаточно. */
  pronunciationNote: string | null;
  structure: string;
  corrections: SpeakingCorrection[];
  improvedAnswer: string;
  followUp: string[];
  tips: string[];
  overall: BandEstimate | null;
  wordCount: number;
  mode: "voice" | "text";
};
