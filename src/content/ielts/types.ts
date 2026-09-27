/**
 * Типы материалов для подготовки к IELTS.
 * Все тексты, записи и задания — оригинальные, написаны для Otti в формате экзамена.
 * Материалы настоящих экзаменов не используются.
 */

export type IeltsModule = "academic" | "general";
export type IeltsSkill = "reading" | "listening" | "writing" | "speaking";

/** Тип вопроса — для статистики «на чём чаще ошибаешься». */
export type QuestionKind =
  | "mcq"
  | "tfng"
  | "ynng"
  | "heading"
  | "sentence"
  | "summary"
  | "gap"
  | "match";

export const QUESTION_KIND_TITLES: Record<QuestionKind, string> = {
  mcq: "Multiple Choice",
  tfng: "True / False / Not Given",
  ynng: "Yes / No / Not Given",
  heading: "Matching Headings",
  sentence: "Sentence Completion",
  summary: "Summary Completion",
  gap: "Заполнение пропусков (форма, заметки)",
  match: "Matching (сопоставление)",
};

type QuestionBase = {
  /** Уникальный в пределах задания номер, например "r1-q3". */
  id: string;
  /** Подробное объяснение по-русски: почему этот ответ верный и где он в тексте. */
  explanation: string;
  /** Цитата из текста или записи, на которой основан ответ. */
  evidence?: string;
};

export type ChoiceQuestion = QuestionBase & {
  kind: "mcq";
  prompt: string;
  options: string[];
  /** Номер правильного варианта (с нуля). */
  answer: number;
};

export type JudgementQuestion = QuestionBase & {
  kind: "tfng" | "ynng";
  statement: string;
  answer: "TRUE" | "FALSE" | "YES" | "NO" | "NOT GIVEN";
};

export type HeadingQuestion = QuestionBase & {
  kind: "heading";
  /** Буква абзаца, к которому нужно подобрать заголовок. */
  paragraph: string;
  /** Номер правильного заголовка из списка группы (i, ii, …). */
  answer: string;
};

export type GapQuestion = QuestionBase & {
  kind: "sentence" | "gap";
  /** Текст с пропуском: «___» обозначает место ответа. */
  prompt: string;
  /** Допустимые ответы (без учёта регистра и лишних пробелов). */
  answers: string[];
  /** Сколько слов (и/или число) можно вписать. */
  maxWords: number;
};

export type SummaryQuestion = QuestionBase & {
  kind: "summary";
  /** Буква правильного слова из списка группы (A, B, …). */
  answer: string;
};

export type MatchQuestion = QuestionBase & {
  kind: "match";
  prompt: string;
  /** Буква правильного варианта из списка группы. */
  answer: string;
};

export type Question =
  | ChoiceQuestion
  | JudgementQuestion
  | HeadingQuestion
  | GapQuestion
  | SummaryQuestion
  | MatchQuestion;

export type QuestionGroup = {
  id: string;
  kind: QuestionKind;
  /** Инструкция к группе (по-английски, как на экзамене). */
  instructions: string;
  /** Короткая подсказка по-русски: как решать этот тип заданий. */
  tip: string;
  questions: Question[];
  /** Список заголовков (Matching Headings): { id: "i", text }. */
  headings?: { id: string; text: string }[];
  /** Варианты для Summary Completion и Matching: { id: "A", text }. */
  options?: { id: string; text: string }[];
  /** Текст краткого содержания с пропусками {id вопроса}. */
  summary?: string;
};

export type ReadingPassage = {
  id: string;
  module: IeltsModule;
  title: string;
  /** Короткое описание по-русски. */
  about: string;
  /** Примерный уровень сложности, например «Band 5–6». */
  level: string;
  /** Время на выполнение в режиме экзамена, минут. */
  minutes: number;
  paragraphs: { label: string; text: string }[];
  groups: QuestionGroup[];
};

export type ScriptLine = {
  speaker: string;
  /** Голос: чтобы реплики разных людей звучали по-разному. */
  voice: "female" | "male";
  text: string;
};

export type ListeningSection = {
  id: string;
  /** Часть экзамена (1–4). */
  part: 1 | 2 | 3 | 4;
  title: string;
  /** Ситуация по-русски: кто говорит и о чём. */
  about: string;
  level: string;
  minutes: number;
  script: ScriptLine[];
  groups: QuestionGroup[];
};

export type ChartSpec =
  | {
      type: "bar";
      title: string;
      unit: string;
      categories: string[];
      series: { name: string; values: number[] }[];
    }
  | {
      type: "line";
      title: string;
      unit: string;
      categories: string[];
      series: { name: string; values: number[] }[];
    }
  | {
      type: "table";
      title: string;
      columns: string[];
      rows: string[][];
    };

export type WritingTask = {
  id: string;
  task: 1 | 2;
  /** Для какого модуля: у Task 1 Academic и General Training разные задания, Task 2 — общий формат. */
  module: IeltsModule | "both";
  title: string;
  /** Вид задания по-русски: «Столбчатая диаграмма», «Письмо-жалоба», «Эссе-мнение». */
  kindTitle: string;
  prompt: string;
  chart?: ChartSpec;
  minWords: number;
  minutes: number;
  /** Пример структуры ответа — по шагам. */
  structure: { title: string; text: string }[];
  /** Полезные фразы для этого типа задания. */
  phrases: string[];
};

export type SpeakingTask = {
  id: string;
  part: 1 | 2 | 3;
  topic: string;
  /** Вопросы экзаменатора (Part 1 и 3). */
  questions: string[];
  /** Карточка темы (Part 2). */
  cueCard?: { prompt: string; points: string[]; closing: string };
  /** Время на подготовку, секунд (Part 2 — 60). */
  prepSeconds: number;
  /** Рекомендуемое время ответа на один вопрос или карточку, секунд. */
  answerSeconds: number;
  /** Идеи и полезные фразы для подготовки. */
  ideas: string[];
};
