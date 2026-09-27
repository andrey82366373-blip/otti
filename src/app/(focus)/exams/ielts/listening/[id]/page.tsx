import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ObjectivePlayer } from "@/components/exams/objective-player";
import { DIAGNOSTIC_LISTENING, getListeningSection } from "@/content/ielts/listening";
import { toPlayerTask } from "@/lib/exams/player-task";
import { requireIelts } from "@/lib/exams/require";

export const metadata: Metadata = { title: "IELTS Listening" };

type PageProps = { params: Promise<{ id: string }> };

export default async function ListeningTaskPage({ params }: PageProps) {
  const { id } = await params;
  await requireIelts();
  const section = getListeningSection(id);
  if (!section || section.id === DIAGNOSTIC_LISTENING.id) notFound();
  return <ObjectivePlayer skill="listening" task={toPlayerTask(section)} backHref="/exams/ielts/listening" />;
}
