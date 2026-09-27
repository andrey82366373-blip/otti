/** Учебный курс и правила открытия уроков. Здесь нет обращений к базе. */
import { a1Intro } from "@/content/course/a1-intro";
import type { Exercise, Lesson, Section } from "@/content/course/types";

export const SECTIONS: Section[] = [a1Intro];

/** Все уроки курса по порядку. */
export const ALL_LESSONS: Lesson[] = SECTIONS.flatMap((section) => section.lessons);

export function getLesson(lessonId: string): Lesson | undefined {
  return ALL_LESSONS.find((lesson) => lesson.id === lessonId);
}

const EXERCISES = new Map<string, { exercise: Exercise; lesson: Lesson }>(
  ALL_LESSONS.flatMap((lesson) =>
    lesson.exercises.map((exercise) => [exercise.id, { exercise, lesson }] as const),
  ),
);

/** Задание по его id вместе с уроком, в котором оно встречается. */
export function getExercise(exerciseId: string): { exercise: Exercise; lesson: Lesson } | undefined {
  return EXERCISES.get(exerciseId);
}

export function getSectionOfLesson(lessonId: string): Section | undefined {
  return SECTIONS.find((section) => section.lessons.some((lesson) => lesson.id === lessonId));
}

/**
 * Состояние урока на карте:
 * - completed — пройден, можно повторить;
 * - current — следующий урок, открыт;
 * - locked — откроется после предыдущего.
 */
export type LessonState = "completed" | "current" | "locked";

/** Урок открывается, когда пройден предыдущий. Первый урок открыт всегда. */
export function getLessonStates(completedIds: ReadonlySet<string>): Map<string, LessonState> {
  const states = new Map<string, LessonState>();
  ALL_LESSONS.forEach((lesson, index) => {
    if (completedIds.has(lesson.id)) {
      states.set(lesson.id, "completed");
      return;
    }
    const previous = ALL_LESSONS[index - 1];
    const unlocked = index === 0 || (previous !== undefined && completedIds.has(previous.id));
    states.set(lesson.id, unlocked ? "current" : "locked");
  });
  return states;
}

/** Следующий урок для кнопки «Продолжить». undefined — всё пройдено. */
export function getNextLesson(completedIds: ReadonlySet<string>): Lesson | undefined {
  const states = getLessonStates(completedIds);
  return ALL_LESSONS.find((lesson) => states.get(lesson.id) === "current");
}

/** Урок, после которого откроется указанный. */
export function getPreviousLesson(lessonId: string): Lesson | undefined {
  const index = ALL_LESSONS.findIndex((lesson) => lesson.id === lessonId);
  return index > 0 ? ALL_LESSONS[index - 1] : undefined;
}
