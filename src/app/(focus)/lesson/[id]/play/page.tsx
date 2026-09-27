import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { LessonPlayer } from "@/components/lesson/lesson-player";
import { getLesson, getLessonStates } from "@/content/course";
import { getCompletedLessonIds } from "@/lib/course-progress";
import { requireSession } from "@/lib/session";

type PageParams = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { id } = await params;
  const lesson = getLesson(id);
  return { title: lesson ? `Урок ${lesson.number}: задания` : "Урок" };
}

export default async function LessonPlayPage({ params }: PageParams) {
  const { id } = await params;
  const lesson = getLesson(id);
  if (!lesson) notFound();

  const { user } = await requireSession();
  const completed = await getCompletedLessonIds(user.id);
  if (getLessonStates(completed).get(lesson.id) === "locked") {
    redirect(`/lesson/${lesson.id}`);
  }

  return <LessonPlayer lesson={lesson} />;
}
