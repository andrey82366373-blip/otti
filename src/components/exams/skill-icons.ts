import { BookOpenText, Headphones, Mic, PenLine } from "lucide-react";

import type { IeltsSkill } from "@/lib/exams/types";

/** Значки навыков IELTS. Отдельный файл без "use client" — чтобы ими пользовались и серверные страницы. */
export const SKILL_ICONS: Record<IeltsSkill, typeof BookOpenText> = {
  reading: BookOpenText,
  listening: Headphones,
  writing: PenLine,
  speaking: Mic,
};
