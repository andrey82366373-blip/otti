"use client";

import { useState } from "react";
import Link from "next/link";
import { LoaderCircle, MessageCircle } from "lucide-react";

import { Otti } from "@/components/otti";
import { Button } from "@/components/ui/button";
import { checkAiConnection, type AiCheckResult } from "@/lib/actions/ai";

/** Кнопка «Проверить связь с Отти»: отправляет ИИ короткий запрос и показывает ответ. */
export function AiCheck({ signedIn }: { signedIn: boolean }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiCheckResult | null>(null);

  async function run() {
    setLoading(true);
    setResult(null);
    try {
      setResult(await checkAiConnection());
    } catch {
      setResult({ ok: false, error: "Нет связи с сайтом. Проверь интернет и попробуй ещё раз." });
    } finally {
      setLoading(false);
    }
  }

  if (!signedIn) {
    return (
      <p className="text-sm text-muted-foreground">
        Чтобы проверить связь с ИИ,{" "}
        <Link href="/sign-in" className="font-bold text-primary hover:underline">
          войдите в аккаунт
        </Link>
        .
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
        <Button type="button" onClick={run} disabled={loading} className="sm:w-auto">
          {loading ? (
            <LoaderCircle className="animate-spin" aria-hidden />
          ) : (
            <MessageCircle aria-hidden />
          )}
          {loading ? "Отти думает…" : "Проверить связь с Отти"}
        </Button>
        <p className="text-xs text-muted-foreground">Проверка тратит одно сообщение из дневного лимита.</p>
      </div>

      <div aria-live="polite">
        {result?.ok && (
          <div className="animate-pop flex flex-col gap-2">
            <div className="flex items-start gap-3">
              <Otti size={44} mood="happy" className="shrink-0" />
              <p className="rounded-2xl rounded-tl-sm bg-secondary px-4 py-3 text-secondary-foreground">
                {result.text}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              {result.isMock
                ? "Это ответ-заготовка тестового режима — настоящий ИИ пока не подключён."
                : `Ответил ${result.provider} (модель ${result.model}) ${result.duration}.`}
              {result.usedFallback && " Основной провайдер не ответил — сработал запасной."}{" "}
              Сегодня использовано сообщений: {result.usedToday} из {result.dailyLimit}.
            </p>
          </div>
        )}
        {result && !result.ok && (
          <div role="alert" className="flex flex-col gap-1 rounded-xl border-2 border-destructive/40 bg-destructive-soft p-3">
            <p className="font-bold text-destructive">{result.error}</p>
            {result.details && (
              <p className="text-sm break-words whitespace-pre-line text-foreground/80">{result.details}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
