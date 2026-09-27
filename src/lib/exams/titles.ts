/** Названия заданий по их коду — для истории попыток. */
import "server-only";

import { DIAGNOSTIC_LISTENING, LISTENING_SECTIONS } from "@/content/ielts/listening";
import { DIAGNOSTIC_READING, READING_PASSAGES } from "@/content/ielts/reading";
import { SPEAKING_TASKS } from "@/content/ielts/speaking";
import { WRITING_TASKS } from "@/content/ielts/writing";

const TITLES = new Map<string, string>([
  ...READING_PASSAGES.map((item) => [item.id, item.title] as const),
  ...LISTENING_SECTIONS.map((item) => [item.id, `Part ${item.part}: ${item.title}`] as const),
  ...WRITING_TASKS.map((item) => [item.id, `Task ${item.task}: ${item.title}`] as const),
  ...SPEAKING_TASKS.map((item) => [item.id, `Part ${item.part}: ${item.topic}`] as const),
  [DIAGNOSTIC_READING.id, "Диагностика"],
  [DIAGNOSTIC_LISTENING.id, "Диагностика"],
  ["wd-diagnostic", "Диагностика"],
  ["sd-diagnostic", "Диагностика"],
]);

export function taskTitle(taskId: string): string {
  return TITLES.get(taskId) ?? taskId;
}
