import type { Metadata } from "next";

import { TaskList, rangeText } from "@/components/exams/task-list";
import { SPEAKING_TASKS } from "@/content/ielts/speaking";
import { getAiConfig } from "@/lib/ai/config";
import { requireIelts } from "@/lib/exams/require";
import { countChecksToday, getIeltsAttempts } from "@/lib/exams/store";

export const metadata: Metadata = { title: "IELTS Speaking" };

const PART_TITLES = {
  1: "Part 1 · вопросы о себе (4–5 минут)",
  2: "Part 2 · монолог по карточке (1 минута на подготовку, до 2 минут речи)",
  3: "Part 3 · обсуждение (4–5 минут)",
} as const;

export default async function SpeakingListPage() {
  const { userId } = await requireIelts();
  const [attempts, used] = await Promise.all([getIeltsAttempts(userId), countChecksToday(userId, "speaking")]);
  const limit = getAiConfig().limits.examSpeakingDaily;

  return (
    <TaskList
      skill="speaking"
      title="Speaking"
      description={`Отвечай голосом или текстом — Отти разберёт ответ. Проверок сегодня: ${Math.max(0, limit - used)} из ${limit}.`}
      tips={[
        "Экзамен идёт 11–14 минут и состоит из трёх частей: вопросы о себе, монолог по карточке и обсуждение.",
        "Голосовой режим работает в Chrome, Edge и Safari. Произношение по расшифровке точно оценить нельзя — Отти даст только осторожные подсказки.",
        "Оценка ИИ примерная и не является официальным результатом IELTS.",
      ]}
      sections={([1, 2, 3] as const).map((part) => ({
        title: PART_TITLES[part],
        items: SPEAKING_TASKS.filter((task) => task.part === part).map((task) => {
          const attempt = attempts.find((item) => item.taskId === task.id);
          return {
            id: task.id,
            title: task.topic,
            subtitle: task.cueCard ? task.cueCard.prompt : `${task.questions.length} вопроса экзаменатора`,
            meta: `Part ${task.part}`,
            result: attempt ? rangeText(attempt.bandLow, attempt.bandHigh) : null,
            attempts: attempts.filter((item) => item.taskId === task.id).length,
          };
        }),
      }))}
    />
  );
}
