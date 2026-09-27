"use client";

import { useState, useTransition } from "react";
import {
  BedDouble,
  BookA,
  Briefcase,
  Coffee,
  LoaderCircle,
  MessageCircle,
  Sun,
  UserRound,
  type LucideIcon,
} from "lucide-react";

import { FormError } from "@/components/auth/form-parts";
import { Badge } from "@/components/ui/badge";
import { startConversation } from "@/lib/actions/tutor";
import type { ScenarioId } from "@/lib/tutor/scenarios";
import { cn } from "@/lib/utils";

const ICONS: Record<ScenarioId, LucideIcon> = {
  free: MessageCircle,
  "about-me": UserRound,
  "my-day": Sun,
  cafe: Coffee,
  travel: BedDouble,
  interview: Briefcase,
  words: BookA,
};

export type ScenarioCard = {
  id: ScenarioId;
  title: string;
  description: string;
  recommended: boolean;
  /** Почему тема недоступна (например, словарь пуст). */
  disabledReason?: string;
};

/** Карточки тем: нажал — начался новый разговор. */
export function ScenarioPicker({ scenarios, disabled }: { scenarios: ScenarioCard[]; disabled: boolean }) {
  const [pendingId, setPendingId] = useState<ScenarioId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function start(id: ScenarioId) {
    setPendingId(id);
    setError(null);
    startTransition(async () => {
      try {
        // При успехе сервер сам откроет страницу разговора
        const result = await startConversation({ scenario: id });
        if (result && !result.ok) setError(result.error);
      } catch {
        setError("Нет связи с сервером. Проверь интернет и попробуй ещё раз.");
      } finally {
        setPendingId(null);
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <ul className="grid gap-2.5 sm:grid-cols-2">
        {scenarios.map((scenario) => {
          const Icon = ICONS[scenario.id];
          const isPending = pendingId === scenario.id;
          const unavailable = disabled || Boolean(scenario.disabledReason);
          return (
            <li key={scenario.id}>
              <button
                type="button"
                onClick={() => start(scenario.id)}
                disabled={unavailable || pendingId !== null}
                className={cn(
                  "flex h-full w-full items-start gap-3 rounded-2xl border-2 bg-card p-4 text-left transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                  unavailable
                    ? "cursor-not-allowed opacity-60"
                    : "hover:border-primary/60 hover:bg-secondary/40 disabled:cursor-wait",
                )}
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                  {isPending ? (
                    <LoaderCircle className="size-5 animate-spin" aria-hidden />
                  ) : (
                    <Icon className="size-5" aria-hidden />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-extrabold">{scenario.title}</span>
                    {scenario.recommended && <Badge variant="river">Для твоей цели</Badge>}
                  </span>
                  <span className="mt-0.5 block text-sm text-muted-foreground">
                    {scenario.disabledReason ?? scenario.description}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <FormError message={error} />
    </div>
  );
}
