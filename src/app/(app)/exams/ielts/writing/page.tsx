import type { Metadata } from "next";

import { TaskList, rangeText } from "@/components/exams/task-list";
import { WRITING_TASKS } from "@/content/ielts/writing";
import { getAiConfig } from "@/lib/ai/config";
import { IELTS_MODULE_INFO } from "@/lib/exams/ielts";
import { requireIelts } from "@/lib/exams/require";
import { countChecksToday, getIeltsAttempts } from "@/lib/exams/store";

export const metadata: Metadata = { title: "IELTS Writing" };

export default async function WritingListPage() {
  const { userId, profile } = await requireIelts();
  const [attempts, used] = await Promise.all([getIeltsAttempts(userId), countChecksToday(userId, "writing")]);
  const limit = getAiConfig().limits.examWritingDaily;
  const latest = (taskId: string) => attempts.find((attempt) => attempt.taskId === taskId);
  const toItem = (task: (typeof WRITING_TASKS)[number]) => {
    const attempt = latest(task.id);
    return {
      id: task.id,
      title: task.title,
      subtitle: task.kindTitle,
      meta: `Task ${task.task} · от ${task.minWords} слов · ${task.minutes} мин`,
      result: attempt ? rangeText(attempt.bandLow, attempt.bandHigh) : null,
      attempts: attempts.filter((item) => item.taskId === task.id).length,
    };
  };

  return (
    <TaskList
      skill="writing"
      title="Writing"
      description={`Эссе и письма с проверкой ИИ. Проверок сегодня: ${Math.max(0, limit - used)} из ${limit}.`}
      tips={[
        "Task 1 — 20 минут, от 150 слов; Task 2 — 40 минут, от 250 слов. Task 2 весит в два раза больше.",
        "Черновик сохраняется автоматически. Отти сначала покажет ошибки и подсказки, а исправленные варианты — только если ты попросишь.",
        "Оценка ИИ примерная и не является официальным результатом IELTS.",
      ]}
      sections={[
        {
          title: `Task 1 · ${IELTS_MODULE_INFO[profile.module].title}`,
          items: WRITING_TASKS.filter((task) => task.task === 1 && task.module === profile.module).map(toItem),
        },
        { title: "Task 2 · эссе", items: WRITING_TASKS.filter((task) => task.task === 2).map(toItem) },
      ]}
    />
  );
}
