import type { Metadata } from "next";

import { LevelTestFlow } from "@/components/learning/level-test-flow";
import { PageHeader } from "@/components/page-header";
import { getPublicQuestions } from "@/content/placement-test";
import { getProfile } from "@/lib/profile";
import { requireSession } from "@/lib/session";

export const metadata: Metadata = { title: "Тест на уровень" };

export default async function LevelTestPage() {
  const { user } = await requireSession();
  const profile = await getProfile(user.id);

  return (
    <>
      <PageHeader title="Тест на уровень" description="Проверим, не пора ли перейти на следующий уровень." />
      <div className="mx-auto w-full max-w-xl">
        <LevelTestFlow questions={getPublicQuestions()} currentLevel={profile.level} />
      </div>
    </>
  );
}
