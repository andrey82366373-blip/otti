import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardCheck } from "lucide-react";

import { AccountSecurity } from "@/components/auth/account-security";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { SettingsForm } from "@/components/learning/settings-form";
import { PageHeader } from "@/components/page-header";
import { InstallCard } from "@/components/pwa/install-card";
import { ThemeSelect } from "@/components/theme-select";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { isDailyMinutes, toExplanationLanguage } from "@/lib/learning";
import { getProfile } from "@/lib/profile";
import { requireSession } from "@/lib/session";

export const metadata: Metadata = { title: "Профиль" };

export default async function ProfilePage() {
  const { user } = await requireSession();
  const profile = await getProfile(user.id);
  const initial = user.name.trim().charAt(0).toUpperCase() || "?";

  return (
    <>
      <PageHeader title="Профиль" description="Настройки обучения и приложения." />

      <div className="flex flex-col gap-4">
        <Card>
          <div className="flex items-center gap-4">
            <span
              aria-hidden
              className="flex size-14 shrink-0 items-center justify-center rounded-full bg-secondary text-2xl font-black text-secondary-foreground"
            >
              {initial}
            </span>
            <div className="min-w-0">
              <p className="truncate text-lg font-extrabold">{user.name}</p>
              <p className="truncate text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <SignOutButton />
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Обучение</CardTitle>
            <CardDescription>Уровень, цель, время в день и язык, на котором Отти объясняет ошибки.</CardDescription>
          </CardHeader>
          <SettingsForm
            initial={{
              name: user.name,
              level: profile.level,
              goal: profile.goal,
              dailyMinutes: isDailyMinutes(profile.dailyMinutes) ? profile.dailyMinutes : 10,
              explanationLanguage: toExplanationLanguage(profile.explanationLanguage),
            }}
          />
          <div className="border-t pt-4">
            <Button asChild variant="outline" className="h-auto min-h-11 py-2.5 whitespace-normal">
              <Link href="/level-test">
                <ClipboardCheck aria-hidden />
                Пройти тест на уровень ещё раз
              </Link>
            </Button>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Тема оформления</CardTitle>
            <CardDescription>Запоминается на этом устройстве.</CardDescription>
          </CardHeader>
          <ThemeSelect />
        </Card>

        <InstallCard />

        <Card>
          <CardHeader>
            <CardTitle>Безопасность</CardTitle>
            <CardDescription>Пароль и удаление аккаунта.</CardDescription>
          </CardHeader>
          <AccountSecurity />
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          <Link href="/privacy" className="font-bold text-primary hover:underline">
            Как Otti обращается с твоими данными
          </Link>
        </p>
      </div>
    </>
  );
}
