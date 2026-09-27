/** «Работа над ошибками»: типы ошибок и правила тренировки. Без обращений к базе. */
import type { Exercise } from "@/content/course/types";
import type { ErrorType } from "@/lib/exercise-check";

/** Сколько ошибок в одной тренировке. */
export const MISTAKE_TRAINING_SIZE = 10;

/** XP за исправленную ошибку. Небольшой — чтобы ошибаться нарочно было невыгодно. */
export const MISTAKE_FIX_XP = 1;

/** За сколько исправлений в день начисляется опыт. */
export const MISTAKE_FIX_XP_DAILY_CAP = 20;

/** Сколько ошибок исправить за день, чтобы задача «Исправить ошибки» была выполнена. */
export const DAILY_FIX_TARGET = 3;

export const ERROR_TYPE_INFO: Record<ErrorType, { title: string; hint: string }> = {
  vocabulary: {
    title: "Слова",
    hint: "Путаешь значения слов — повтори их в словаре.",
  },
  grammar: {
    title: "Грамматика",
    hint: "Перечитай правило в уроке, а потом реши задание ещё раз.",
  },
  "word-order": {
    title: "Порядок слов",
    hint: "В английском порядок строгий: кто → что делает → всё остальное.",
  },
  translation: {
    title: "Перевод",
    hint: "Переводи по смыслу, а не слово в слово.",
  },
  speaking: {
    title: "Ответы на вопросы",
    hint: "Отвечай коротким полным предложением.",
  },
  spelling: {
    title: "Опечатки",
    hint: "Ответ был почти верным — проверь, как пишется слово.",
  },
};

export function getErrorTypeInfo(errorType: string) {
  return Object.hasOwn(ERROR_TYPE_INFO, errorType)
    ? ERROR_TYPE_INFO[errorType as ErrorType]
    : { title: "Другое", hint: "" };
}

/** Текст задания для списка ошибок: что было дано ученику. */
export function getExerciseQuestion(exercise: Exercise): { text: string; lang: "en" | "ru" } {
  switch (exercise.type) {
    case "choose-translation":
    case "choose-word":
    case "grammar-choice":
      return { text: exercise.text, lang: exercise.textLang };
    case "fill-blank":
      return { text: exercise.sentence, lang: "en" };
    case "build-sentence":
    case "translate-phrase":
      return { text: exercise.source, lang: "ru" };
    case "match-pairs":
      return { text: exercise.pairs.map((pair) => pair.en).join(", "), lang: "en" };
    case "short-answer":
    case "tutor-reply":
      return { text: exercise.question, lang: "en" };
  }
}

/** На каком языке ответ ученика (для правильного произношения экранным диктором). */
export function getAnswerLang(exercise: Exercise): "en" | "ru" | undefined {
  if ("optionsLang" in exercise) return exercise.optionsLang;
  if (exercise.type === "match-pairs") return undefined;
  return "en";
}
