import type { Metadata } from "next";

import { TaskList, type TaskListItem } from "@/components/exams/task-list";
import { READING_PASSAGES } from "@/content/ielts/reading";
import { IELTS_MODULE_INFO } from "@/lib/exams/ielts";
import { requireIelts } from "@/lib/exams/require";
import { bestByTask, getIeltsAttempts } from "@/lib/exams/store";

export const metadata: Metadata = { title: "IELTS Reading" };

export default async function ReadingListPage() {
  const { userId, profile } = await requireIelts();
  const best = bestByTask((await getIeltsAttempts(userId)).filter((attempt) => attempt.skill === "reading"));
  const toItem = (passage: (typeof READING_PASSAGES)[number]): TaskListItem => {
    const result = best.get(passage.id);
    return {
      id: passage.id,
      title: passage.title,
      subtitle: passage.about,
      meta: `${passage.groups.reduce((sum, group) => sum + group.questions.length, 0)} вопросов · ${passage.minutes} мин · ${passage.level}`,
      result: result ? `лучший результат ${result.correct} из ${result.total}` : null,
      attempts: result?.count ?? 0,
    };
  };
  const own = READING_PASSAGES.filter((passage) => passage.module === profile.module).map(toItem);
  const other = READING_PASSAGES.filter((passage) => passage.module !== profile.module).map(toItem);
  const otherModule = profile.module === "academic" ? "general" : "academic";

  return (
    <TaskList
      skill="reading"
      title="Reading"
      description="Тексты в формате экзамена, таймер и разбор каждой ошибки."
      tips={[
        "На экзамене 3 части (текста) и 40 вопросов, всего 60 минут. Переносить ответы отдельно не нужно — время одно на всё.",
        "Отвечай строго по тексту: собственные знания и логика «так обычно бывает» не помогают.",
        "Ответы вписывай словами из текста и следи за ограничением: NO MORE THAN TWO WORDS — значит, не больше двух слов.",
      ]}
      sections={[
        { title: IELTS_MODULE_INFO[profile.module].title, items: own },
        { title: `Дополнительно: тексты ${IELTS_MODULE_INFO[otherModule].title}`, items: other },
      ]}
    />
  );
}
