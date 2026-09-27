import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { OnboardingFlow } from "@/components/learning/onboarding-flow";
import { Logo } from "@/components/logo";
import { Otti } from "@/components/otti";
import { ThemeToggle } from "@/components/theme-toggle";
import { getPublicQuestions } from "@/content/placement-test";
import { getProfile } from "@/lib/profile";
import { requireSession } from "@/lib/session";

export const metadata: Metadata = { title: "Знакомство" };

export default async function OnboardingPage() {
  const { user } = await requireSession();
  const profile = await getProfile(user.id);
  if (profile.onboardingCompleted) {
    redirect("/learn");
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex h-16 w-full max-w-xl items-center justify-between px-4">
        <Logo href="/onboarding" />
        <ThemeToggle />
      </header>

      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 pt-2 pb-16">
        <div className="flex items-center gap-3">
          <Otti size={56} />
          <div className="min-w-0">
            <h1 className="text-xl font-black tracking-tight break-words">Привет, {user.name}!</h1>
            <p className="text-sm text-muted-foreground">
              Давай познакомимся: 4 шага — и маршрут обучения готов.
            </p>
          </div>
        </div>

        <OnboardingFlow questions={getPublicQuestions()} />
      </main>
    </div>
  );
}
