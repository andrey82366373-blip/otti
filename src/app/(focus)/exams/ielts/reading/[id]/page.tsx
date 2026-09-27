import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ObjectivePlayer } from "@/components/exams/objective-player";
import { DIAGNOSTIC_READING, getReadingPassage } from "@/content/ielts/reading";
import { toPlayerTask } from "@/lib/exams/player-task";
import { requireIelts } from "@/lib/exams/require";

export const metadata: Metadata = { title: "IELTS Reading" };

type PageProps = { params: Promise<{ id: string }> };

export default async function ReadingTaskPage({ params }: PageProps) {
  const { id } = await params;
  await requireIelts();
  const passage = getReadingPassage(id);
  if (!passage || passage.id === DIAGNOSTIC_READING.id) notFound();
  return <ObjectivePlayer skill="reading" task={toPlayerTask(passage)} backHref="/exams/ielts/reading" />;
}
