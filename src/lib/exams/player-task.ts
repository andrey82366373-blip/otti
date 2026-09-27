/** Задание для страницы выполнения: без ответов и объяснений (их присылает сервер после проверки). */
import "server-only";

import type { ListeningSection, ReadingPassage } from "@/content/ielts/types";
import { toPublicGroups } from "@/lib/exams/ielts";

export function toPlayerTask(task: ReadingPassage | ListeningSection) {
  return {
    id: task.id,
    title: task.title,
    about: task.about,
    level: task.level,
    minutes: task.minutes,
    ...("paragraphs" in task ? { paragraphs: task.paragraphs } : { script: task.script }),
    groups: toPublicGroups(task.groups),
  };
}
