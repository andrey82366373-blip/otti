import { Lock } from "lucide-react";

import { FreshReveal } from "@/components/motion/fresh-reveal";
import { Progress } from "@/components/ui/progress";
import { ACHIEVEMENTS, type AchievementStats } from "@/lib/achievements";
import { formatDayLong } from "@/lib/dates";
import { cn } from "@/lib/utils";

/** Все достижения: полученные — яркие с датой, остальные — серые с прогрессом. */
export function AchievementGrid({
  stats,
  earned,
}: {
  stats: AchievementStats;
  earned: Map<string, string>;
}) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {ACHIEVEMENTS.map((achievement) => {
        const earnedDay = earned.get(achievement.code);
        const [current, target] = achievement.progress(stats);
        const Icon = achievement.icon;
        return (
          <li
            key={achievement.code}
            className={cn(
              "flex items-center gap-3 rounded-2xl border-2 p-3",
              earnedDay ? "border-xp/40 bg-xp/10" : "border-border",
            )}
          >
            {earnedDay ? (
              // Новое достижение один раз «переворачивается» лицом к ученику
              <FreshReveal
                storageKey="otti:seen-achievements"
                id={achievement.code}
                freshClassName="animate-badge-in"
                className="flex size-12 shrink-0 items-center justify-center rounded-full bg-xp text-otti-ink"
              >
                <Icon className="size-6" aria-hidden />
              </FreshReveal>
            ) : (
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Lock className="size-5" aria-hidden />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="leading-tight font-extrabold">{achievement.title}</p>
              <p className="text-sm text-muted-foreground">{achievement.description}</p>
              {earnedDay ? (
                <p className="mt-0.5 text-xs font-bold text-foreground/70">Получено {formatDayLong(earnedDay)}</p>
              ) : (
                <div className="mt-1.5 flex items-center gap-2">
                  <Progress
                    value={Math.min(current, target)}
                    max={target}
                    label={`${achievement.title}: ${Math.min(current, target)} из ${target}`}
                    className="h-2"
                    barClassName="bg-muted-foreground/60"
                  />
                  <span className="text-xs font-bold text-muted-foreground tabular-nums">
                    {Math.min(current, target)}/{target}
                  </span>
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
