import { redirect } from "next/navigation";

import { BottomNav } from "@/components/app-shell/bottom-nav";
import { SideNav } from "@/components/app-shell/side-nav";
import { TopBar } from "@/components/app-shell/top-bar";
import { FeedbackPrefsProvider } from "@/components/motion/feedback-prefs";
import { getDailyState } from "@/lib/activity";
import { getProfile } from "@/lib/profile";
import { requireSession } from "@/lib/session";

/** Каркас экранов приложения. Открывается только после входа и знакомства. */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireSession();
  const profile = await getProfile(user.id);
  if (!profile.onboardingCompleted) {
    redirect("/onboarding");
  }
  const daily = await getDailyState(user.id);

  return (
    <FeedbackPrefsProvider soundEnabled={profile.soundEnabled} reduceMotion={profile.reduceMotion}>
      <div className="min-h-dvh md:flex">
        <a
          href="#main"
          className="sr-only z-50 rounded-xl bg-primary px-4 py-2 font-bold text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Перейти к содержимому
        </a>

        <SideNav />

        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar
            userName={user.name}
            streak={daily.streak}
            streakActiveToday={daily.goalMet}
            xp={profile.totalXp}
          />
          <main
            id="main"
            className="mx-auto w-full max-w-3xl flex-1 px-4 pt-6 pb-32 md:px-8 md:pb-12"
          >
            {children}
          </main>
        </div>

        <BottomNav />
      </div>
    </FeedbackPrefsProvider>
  );
}
