import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { BandBadge } from "@/components/exams/exam-ui";
import { SKILL_ICONS } from "@/components/exams/skill-icons";
import { Progress } from "@/components/ui/progress";
import { IELTS_SKILLS, SKILL_RU, SKILL_TITLES, formatBand } from "@/lib/exams/ielts";
import type { BandEstimate, IeltsSkill } from "@/lib/exams/types";

/** Карточки четырёх навыков: примерный балл и путь до цели. */
export function SkillCards({
  estimates,
  target,
  counts,
}: {
  estimates: Record<IeltsSkill, BandEstimate | null>;
  target: number;
  counts: Record<IeltsSkill, number>;
}) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {IELTS_SKILLS.map((skill, index) => {
        const Icon = SKILL_ICONS[skill];
        const estimate = estimates[skill];
        return (
          <li key={skill} className="animate-card-in" style={{ animationDelay: `${index * 70}ms` }}>
            <Link
              href={`/exams/ielts/${skill}`}
              className="flex h-full flex-col gap-3 rounded-2xl border-2 bg-card p-4 transition-colors outline-none hover:border-primary/40 focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                  <Icon className="size-5" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-black">{SKILL_TITLES[skill]}</p>
                  <p className="text-xs text-muted-foreground">
                    {SKILL_RU[skill]} · заданий выполнено: {counts[skill]}
                  </p>
                </div>
                <ChevronRight className="size-5 text-muted-foreground" aria-hidden />
              </div>
              {estimate ? (
                <>
                  <BandBadge estimate={estimate} size="sm" />
                  <Progress
                    value={Math.min(estimate.mid, target)}
                    max={target}
                    label={`${SKILL_TITLES[skill]}: примерно ${formatBand(estimate.mid)} из цели ${formatBand(target)}`}
                    className="h-2"
                    barClassName={estimate.mid >= target ? "bg-success" : "bg-primary"}
                  />
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Пока нет оценки — выполни задание, чтобы она появилась.</p>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
