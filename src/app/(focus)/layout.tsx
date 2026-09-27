import { redirect } from "next/navigation";

import { getProfile } from "@/lib/profile";
import { requireSession } from "@/lib/session";

/** Экраны без меню — чтобы ничто не отвлекало от урока. Только для вошедших. */
export default async function FocusLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireSession();
  const profile = await getProfile(user.id);
  if (!profile.onboardingCompleted) {
    redirect("/onboarding");
  }
  return <div className="min-h-dvh">{children}</div>;
}
