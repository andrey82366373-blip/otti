import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SpeakingSession } from "@/components/exams/speaking-session";
import { getSpeakingTask } from "@/content/ielts/speaking";
import { getAiConfig } from "@/lib/ai/config";
import { requireIelts } from "@/lib/exams/require";
import { countChecksToday, getLatestCheck, isCheckUsable } from "@/lib/exams/store";

export const metadata: Metadata = { title: "IELTS Speaking" };

export const maxDuration = 120;

type PageProps = { params: Promise<{ id: string }> };

export default async function SpeakingTaskPage({ params }: PageProps) {
  const { id } = await params;
  const { userId } = await requireIelts();
  const task = getSpeakingTask(id);
  if (!task) notFound();

  const [latest, used] = await Promise.all([getLatestCheck(userId, "speaking", task.id), countChecksToday(userId, "speaking")]);
  const limit = getAiConfig().limits.examSpeakingDaily;
  const usable = isCheckUsable(latest) ? latest : null;

  return (
    <SpeakingSession
      task={task}
      initialFeedback={usable?.speaking ?? null}
      pendingCheckId={usable && usable.status === "pending" ? usable.id : null}
      remaining={Math.max(0, limit - used)}
      limit={limit}
      backHref="/exams/ielts/speaking"
    />
  );
}
