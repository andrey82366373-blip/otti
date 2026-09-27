import type { Metadata } from "next";

import { TaskList } from "@/components/exams/task-list";
import { LISTENING_SECTIONS } from "@/content/ielts/listening";
import { requireIelts } from "@/lib/exams/require";
import { bestByTask, getIeltsAttempts } from "@/lib/exams/store";

export const metadata: Metadata = { title: "IELTS Listening" };

export default async function ListeningListPage() {
  const { userId } = await requireIelts();
  const best = bestByTask((await getIeltsAttempts(userId)).filter((attempt) => attempt.skill === "listening"));

  return (
    <TaskList
      skill="listening"
      title="Listening"
      description="Четыре части экзамена: разговор, монолог, обсуждение и лекция."
      tips={[
        "На экзамене 4 части и 40 вопросов, запись звучит один раз. Время на чтение вопросов даётся перед каждой частью.",
        "Здесь запись озвучивает браузер — это учебная демонстрация. Настоящее экзаменационное аудио звучит иначе: разные акценты, шум, естественный темп.",
        "В учебном режиме запись можно переслушать и открыть текст. В режиме экзамена — только один раз.",
      ]}
      sections={[
        {
          title: "Задания",
          items: LISTENING_SECTIONS.map((section) => {
            const result = best.get(section.id);
            return {
              id: section.id,
              title: `Part ${section.part}: ${section.title}`,
              subtitle: section.about,
              meta: `${section.groups.reduce((sum, group) => sum + group.questions.length, 0)} вопросов · ${section.level}`,
              result: result ? `лучший результат ${result.correct} из ${result.total}` : null,
              attempts: result?.count ?? 0,
            };
          }),
        },
      ]}
    />
  );
}
