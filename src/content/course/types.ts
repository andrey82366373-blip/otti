/**
 * Формат учебного курса: уровень → раздел → урок → задания.
 * Уроки лежат в файлах проекта. В базе хранится только прогресс по ним (по id).
 */
import type { CefrLevel } from "@/lib/learning";
import type { TopicId } from "@/content/course/topics";

/** Навык, который тренирует задание. Нужен для «Работы над ошибками» и статистики. */
export type Skill = "vocabulary" | "grammar" | "word-order" | "translation" | "speaking";

type ExerciseBase = {
  /** Постоянный id, например a1-intro-l1-ex3. Не менять после публикации! */
  id: string;
  topic: TopicId;
  skill: Skill;
  /** Задание для ученика на русском: «Выбери перевод». */
  prompt: string;
  /** Короткое объяснение на русском — показывается после ответа. */
  explanation: string;
};

/** Выбор одного варианта: перевод, слово или грамматическая форма. */
export type ChoiceExercise = ExerciseBase & {
  type: "choose-translation" | "choose-word" | "grammar-choice";
  /** Фраза, слово или предложение с пропуском «___». */
  text: string;
  textLang: "en" | "ru";
  options: string[];
  optionsLang: "en" | "ru";
  /** Номер правильного варианта (с нуля). */
  answer: number;
  /** Перевод английского предложения — показывается после ответа. */
  translation?: string;
};

/** Вписать пропущенное слово. */
export type FillBlankExercise = ExerciseBase & {
  type: "fill-blank";
  /** Предложение с пропуском «___». */
  sentence: string;
  /** Правильные варианты (регистр и знаки препинания не важны). */
  accepted: string[];
  hint?: string;
  translation: string;
};

/** Собрать предложение из слов. */
export type BuildSentenceExercise = ExerciseBase & {
  type: "build-sentence";
  /** Что нужно сказать по-английски (на русском). */
  source: string;
  /** Слова-карточки, включая лишние. Перемешиваются при показе. */
  tiles: string[];
  accepted: string[];
};

/** Соединить слово и перевод. */
export type MatchPairsExercise = ExerciseBase & {
  type: "match-pairs";
  pairs: { en: string; ru: string }[];
};

/** Перевести короткую фразу с русского на английский. */
export type TranslatePhraseExercise = ExerciseBase & {
  type: "translate-phrase";
  source: string;
  accepted: string[];
};

/**
 * Написать ответ своими словами: на вопрос или на реплику Отти.
 * Ответ проверяется по шаблонам, позже — ещё и ИИ-репетитором.
 */
export type OpenAnswerExercise = ExerciseBase & {
  type: "short-answer" | "tutor-reply";
  /** Вопрос или реплика Отти на английском. */
  question: string;
  questionTranslation: string;
  /**
   * Шаблоны правильного ответа (регулярные выражения).
   * Применяются к ответу в «каноническом» виде: строчные буквы, без знаков препинания,
   * сокращения раскрыты (I'm → i am, don't → do not).
   */
  patterns: string[];
  /** Пример хорошего ответа. */
  sample: string;
  sampleTranslation: string;
};

export type Exercise =
  | ChoiceExercise
  | FillBlankExercise
  | BuildSentenceExercise
  | MatchPairsExercise
  | TranslatePhraseExercise
  | OpenAnswerExercise;

export type ExerciseType = Exercise["type"];

export type Word = {
  en: string;
  ru: string;
  example: string;
  exampleRu: string;
};

export type Example = { en: string; ru: string };

/** Блок теории: абзац, таблица или подсказка. В тексте **так** выделяется жирным. */
export type TheoryBlock =
  | { kind: "text"; text: string }
  | { kind: "table"; headers: string[]; rows: string[][] }
  | { kind: "tip"; text: string };

export type Lesson = {
  /** Постоянный id, например a1-intro-l1. Не менять после публикации! */
  id: string;
  number: number;
  title: string;
  description: string;
  topic: TopicId;
  durationMin: number;
  theory: { title: string; blocks: TheoryBlock[] };
  words: Word[];
  examples: Example[];
  exercises: Exercise[];
};

export type Section = {
  id: string;
  level: CefrLevel;
  number: number;
  title: string;
  description: string;
  lessons: Lesson[];
};
