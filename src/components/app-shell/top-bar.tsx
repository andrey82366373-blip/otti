import Link from "next/link";
import { Flame, Zap } from "lucide-react";

import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";

type StatProps = {
  icon: typeof Flame;
  value: number;
  label: string;
  colorClass: string;
};

function Stat({ icon: Icon, value, label, colorClass }: StatProps) {
  return (
    <div
      title={label}
      className="flex items-center gap-1 rounded-full px-1.5 py-1 text-base font-extrabold tabular-nums sm:px-2"
    >
      <Icon className={`size-5 ${colorClass}`} aria-hidden />
      <span>{value}</span>
      <span className="sr-only">— {label}</span>
    </div>
  );
}

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
          <Stat
            icon={Flame}
            value={streak}
            label={
              streakActiveToday
                ? "дней подряд, сегодня цель выполнена"
                : "дней подряд, сегодня цель ещё не выполнена"
            }
            colorClass={streakActiveToday ? "fill-streak/30 text-streak" : "text-muted-foreground"}
          />
          <Stat icon={Zap} value={xp} label="очков опыта (XP)" colorClass="text-xp" />
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
