import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { IeltsSetupForm } from "@/components/exams/ielts-setup-form";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { todayInTimezone } from "@/lib/dates";
import { requireIelts } from "@/lib/exams/require";
import { getProfile } from "@/lib/profile";

export const metadata: Metadata = { title: "Настройки IELTS" };

export default async function IeltsSettingsPage() {
  const { userId, profile: exam } = await requireIelts();
  const profile = await getProfile(userId);
  return (
    <>
      <Link href="/exams/ielts" className="mb-3 flex items-center gap-1.5 text-sm font-bold text-primary hover:underline">
        <ArrowLeft className="size-4" aria-hidden />
        IELTS
      </Link>
      <PageHeader title="Настройки подготовки" description="После сохранения учебный план пересчитается." />
      <Card>
        <IeltsSetupForm
          initial={{
            module: exam.module,
            targetBand: exam.targetBand,
            examDate: exam.examDate,
            currentLevel: exam.currentLevel,
            sessionsPerWeek: exam.sessionsPerWeek,
            weakestSkill: exam.weakestSkill,
          }}
          today={todayInTimezone(profile.timezone)}
          isEdit
        />
      </Card>
    </>
  );
}
