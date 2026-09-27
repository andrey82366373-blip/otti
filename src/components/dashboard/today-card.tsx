import Link from "next/link";
import { ChevronRight, Circle, CircleCheck, Flame } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { DAYS, withPlural } from "@/lib/plural";
import { cn } from "@/lib/utils";

export type TodayTask = {
  id: string;
  title: string;
  hint?: string;
  done: boolean;
  href?: string;
};

type TodayCardProps = {
  xp: number;
  goalXp: number;
  streak: number;
  goalMet: boolean;
  tasks: TodayTask[];
};

/** Главная панель: дневная цель, серия дней и задачи на сегодня. */
export function TodayCard({ xp, goalXp, streak, goalMet, tasks }: TodayCardProps) {
  const doneCount = tasks.filter((task) => task.done).length;

  let streakText: string;
  if (goalMet) streakText = `${withPlural(streak, DAYS)} подряд — цель на сегодня выполнена!`;
  else if (streak > 0) streakText = `${withPlural(streak, DAYS)} подряд. Выполни цель сегодня, чтобы не потерять серию.`;
  else streakText = "Выполни дневную цель, чтобы начать серию.";

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold">Сегодня</h2>
          <p className="text-sm text-muted-foreground">
            Задачи: {doneCount} из {tasks.length}
          </p>
        </div>
        <div
          className={cn(
            "flex items-center gap-1.5 rounded-full px-3 py-1.5 font-black",
            goalMet ? "bg-streak/15 text-streak-text" : "bg-muted text-muted-foreground",
          )}
        >
          <Flame className={cn("size-5", goalMet && "fill-streak/30")} aria-hidden />
          {streak}
          <span className="sr-only">{withPlural(streak, DAYS)} подряд</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between text-sm font-bold">
          <span>Дневная цель</span>
          <span className="tabular-nums">
            {Math.min(xp, goalXp)} / {goalXp} XP
          </span>
        </div>
        <Progress
          value={Math.min(xp, goalXp)}
          max={goalXp}
          label={`Дневная цель: ${xp} из ${goalXp} XP`}
          barClassName={goalMet ? "bg-streak" : "bg-xp"}
        />
        <p className="text-sm text-muted-foreground">{streakText}</p>
      </div>

      <ul className="flex flex-col gap-1">
        {tasks.map((task) => {
          const content = (
            <>
              {task.done ? (
                <CircleCheck className="size-6 shrink-0 text-success" aria-hidden />
              ) : (
                <Circle className="size-6 shrink-0 text-border" aria-hidden />
              )}
              <span className="min-w-0 flex-1">
                <span className={cn("block font-bold", task.done && "text-muted-foreground line-through")}>
                  {task.title}
                </span>
                {task.hint && <span className="block text-sm text-muted-foreground">{task.hint}</span>}
              </span>
              <span className="sr-only">{task.done ? "— выполнено" : "— не выполнено"}</span>
              {task.href && !task.done && <ChevronRight className="size-5 text-primary" aria-hidden />}
            </>
          );
          return (
            <li key={task.id}>
              {task.href && !task.done ? (
                <Link
                  href={task.href}
                  className="flex items-center gap-3 rounded-xl p-2 transition-colors outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  {content}
                </Link>
              ) : (
                <div className="flex items-center gap-3 p-2">{content}</div>
              )}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
