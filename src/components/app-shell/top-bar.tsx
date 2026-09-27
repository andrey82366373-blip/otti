import Link from "next/link";

import { TopBarStats } from "@/components/app-shell/top-bar-stats";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";

/** Первая буква имени для кружка-аватара. */
function getInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || "?";
}

/** Верхняя панель: логотип (на телефоне), серия дней, опыт, тема и профиль. */
export function TopBar({
  userName,
  streak,
  streakActiveToday,
  xp,
}: {
  userName: string;
  streak: number;
  /** Сегодня цель уже выполнена — огонёк горит. */
  streakActiveToday: boolean;
  xp: number;
}) {
  return (
    <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-3xl items-center gap-2 px-3 sm:px-4 md:px-8">
        <Logo href="/learn" className="md:hidden" />

        <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
          <TopBarStats streak={streak} streakActiveToday={streakActiveToday} xp={xp} />
          {/* На очень узких экранах тема меняется в профиле */}
          <div className="hidden min-[360px]:block">
            <ThemeToggle />
          </div>
          <Link
            href="/profile"
            aria-label={`Профиль: ${userName}`}
            className="flex size-10 items-center justify-center rounded-full bg-secondary text-lg font-black text-secondary-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 md:hidden"
          >
            {getInitial(userName)}
          </Link>
        </div>
      </div>
    </header>
  );
}
