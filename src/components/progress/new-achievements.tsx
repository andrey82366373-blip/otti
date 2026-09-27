import { Medal } from "lucide-react";

import { Card } from "@/components/ui/card";
import { getAchievement } from "@/lib/achievements";

/** Карточка «Новое достижение!» в итогах урока или тренировки. */
export function NewAchievements({ items }: { items: { code: string; title: string }[] }) {
  if (items.length === 0) return null;

  return (
    <Card className="animate-pop gap-3 border-xp/40 bg-xp/10">
      <h2 className="flex items-center gap-2 font-extrabold">
        <Medal className="size-5 text-xp" aria-hidden />
        {items.length === 1 ? "Новое достижение!" : "Новые достижения!"}
      </h2>
      <ul className="flex flex-col gap-2">
        {items.map((item) => {
          const achievement = getAchievement(item.code);
          const Icon = achievement?.icon ?? Medal;
          return (
            <li key={item.code} className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-xp text-otti-ink">
                <Icon className="size-5" aria-hidden />
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
