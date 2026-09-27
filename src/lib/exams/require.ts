/** Страницы IELTS открываются после настройки подготовки (модуль, цель, дата). */
import "server-only";

import { redirect } from "next/navigation";

import { getIeltsProfile, type ExamProfile } from "@/lib/exams/store";
import { requireSession } from "@/lib/session";

export async function requireIelts(): Promise<{ userId: string; userName: string; profile: ExamProfile }> {
  const { user } = await requireSession();
  const profile = await getIeltsProfile(user.id);
  if (!profile) redirect("/exams/ielts");
  return { userId: user.id, userName: user.name, profile };
}
