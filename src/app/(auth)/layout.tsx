import { redirect, unstable_rethrow } from "next/navigation";

import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { getSession } from "@/lib/session";

/** Каркас экранов входа и регистрации. Кто уже вошёл — сразу попадает в приложение. */
export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  let signedIn = false;
  try {
    signedIn = Boolean(await getSession());
  } catch (error) {
    unstable_rethrow(error); // служебные сигналы Next.js пропускаем дальше
    // Если база или настройки входа недоступны, всё равно показываем форму:
    // при отправке ученик увидит понятную ошибку.
    console.error("[auth] Не удалось проверить сессию:", error);
  }
  if (signedIn) {
    redirect("/learn");
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex h-16 w-full max-w-md items-center justify-between px-4">
        <Logo />
        <ThemeToggle />
      </header>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 pt-4 pb-16">
        {children}
      </main>
    </div>
  );
}
