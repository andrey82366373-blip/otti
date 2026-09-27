import { Medal } from "lucide-react";

import { Card } from "@/components/ui/card";
import { getAchievement } from "@/lib/achievements";

/** Карточка «Новое достижение!» в итогах урока или тренировки. */
export function NewAchievements({ items }: { items: { code: string; title: string }[] }) {
  if (items.length === 0) return null;

  return (
    <Card className="animate-card-in gap-3 border-xp/40 bg-xp/10" style={{ animationDelay: "700ms" }}>
      <h2 className="flex items-center gap-2 font-extrabold">
        <Medal className="size-5 text-xp" aria-hidden />
        {items.length === 1 ? "Новое достижение!" : "Новые достижения!"}
      </h2>
      <ul className="flex flex-col gap-2">
        {items.map((item, index) => {
          const achievement = getAchievement(item.code);
          const Icon = achievement?.icon ?? Medal;
          return (
            <li key={item.code} className="flex items-center gap-3">
              {/* Значок «переворачивается» лицом к ученику, по нему пробегает блик */}
              <span
                className="animate-badge-in relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-xp text-otti-ink shadow-[0_0_0_3px_color-mix(in_oklab,var(--xp)_35%,transparent)]"
                style={{ animationDelay: `${900 + index * 180}ms` }}
              >
                <Icon className="relative z-10 size-5" aria-hidden />
                <span
                  aria-hidden
                  className="animate-shine absolute inset-y-0 left-0 w-1/2 bg-white/60"
                  style={{ animationDelay: `${1300 + index * 180}ms` }}
                />
              </span>
              <span>
                <span className="block font-bold">{item.title}</span>
                {achievement && (
                  <span className="block text-sm text-muted-foreground">{achievement.description}</span>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
