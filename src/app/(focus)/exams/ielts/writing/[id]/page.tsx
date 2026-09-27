import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { WritingWorkspace } from "@/components/exams/writing-workspace";
import { getWritingTask } from "@/content/ielts/writing";
import { getAiConfig } from "@/lib/ai/config";
import { requireIelts } from "@/lib/exams/require";
import { countChecksToday, getDraft, getLatestCheck, isCheckUsable } from "@/lib/exams/store";

export const metadata: Metadata = { title: "IELTS Writing" };

// Проверка эссе может идти дольше обычного ответа
export const maxDuration = 120;

type PageProps = { params: Promise<{ id: string }> };

export default async function WritingTaskPage({ params }: PageProps) {
  const { id } = await params;
  const { userId } = await requireIelts();
  const task = getWritingTask(id);
  if (!task) notFound();

  const [draft, latest, used] = await Promise.all([
    getDraft(userId, task.id),
    getLatestCheck(userId, "writing", task.id),
    countChecksToday(userId, "writing"),
  ]);
  const limit = getAiConfig().limits.examWritingDaily;
  const initialCheck =
    isCheckUsable(latest)
      ? {
          checkId: latest.id,
          status: latest.status === "done" ? ("done" as const) : ("pending" as const),
          feedback: latest.writing ?? null,
          content: latest.content,
        }
      : null;

  return (
    <WritingWorkspace
      task={{
        id: task.id,
        task: task.task,
        title: task.title,
        kindTitle: task.kindTitle,
        prompt: task.prompt,
        chart: task.chart,
        minWords: task.minWords,
        minutes: task.minutes,
        structure: task.structure,
        phrases: task.phrases,
      }}
      initialDraft={draft || (initialCheck?.status === "done" ? initialCheck.content : "")}
      initialCheck={initialCheck}
      remaining={Math.max(0, limit - used)}
      limit={limit}
      backHref="/exams/ielts/writing"
    />
  );
}
