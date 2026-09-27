import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Sparkles } from "lucide-react";

import { Otti } from "@/components/otti";
import { PageHeader } from "@/components/page-header";
import { ScenarioPicker, type ScenarioCard } from "@/components/tutor/scenario-picker";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getAiConfig } from "@/lib/ai/config";
import { getAiUsageToday, getUserAiDailyLimit } from "@/lib/ai/limits";
import { formatDayLong, todayInTimezone } from "@/lib/dates";
import { GOAL_INFO } from "@/lib/learning";
import { getProfile } from "@/lib/profile";
import { requireSession } from "@/lib/session";
import { getTutorAvailability } from "@/lib/tutor/availability";
import { scenariosForGoal } from "@/lib/tutor/scenarios";
import { listThreads } from "@/lib/tutor/store";
import { getWordStats } from "@/lib/word-store";

export const metadata: Metadata = { title: "ИИ-репетитор" };

// Начало разговора сохраняется быстро, но на всякий случай даём запас времени
export const maxDuration = 30;

export default async function TutorPage() {
  const { user } = await requireSession();
  const { limits } = getAiConfig();
  const [profile, threads, usage, words, dailyLimit] = await Promise.all([
    getProfile(user.id),
    listThreads(user.id),
    getAiUsageToday(user.id).catch(() => ({ userRequests: 0 })),
    getWordStats(user.id),
    getUserAiDailyLimit(user.id, limits),
  ]);
  const availability = getTutorAvailability();

  const scenarios: ScenarioCard[] = scenariosForGoal(profile.goal).map((scenario) => ({
    id: scenario.id,
    title: scenario.title,
    description: scenario.description,
    recommended: scenario.goals.includes(profile.goal),
    disabledReason:
      scenario.id === "words" && words.total === 0
        ? "Сначала пройди урок — его слова попадут в словарь"
        : undefined,
  }));

  return (
    <>
      <PageHeader
        title="Репетитор Отти"
        description="Разговор на английском на твоём уровне. Ошибки Отти исправит мягко и объяснит."
      />

      <div className="flex flex-col gap-6">
        {!availability.available ? (
          <Card className="flex-row items-center gap-4">
            <Otti size={64} mood="confused" />
            <p className="text-muted-foreground">{availability.message}</p>
          </Card>
        ) : (
          <Card className="flex-row items-center gap-4 border-primary/30 bg-linear-to-br from-secondary to-card">
            <Otti size={64} mood="happy" className="hidden sm:block" />
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 text-lg font-black">
                <Sparkles className="size-5 text-primary" aria-hidden />
                О чём поговорим?
              </p>
              <p className="text-sm text-muted-foreground">
                {GOAL_INFO[profile.goal].tutorFocus} Сегодня сообщений: {usage.userRequests} из{" "}
                {dailyLimit}.
              </p>
              {availability.mock && (
                <p className="mt-1 text-sm font-bold text-streak-text">
                  Тестовый режим: ответы-заготовки, настоящий ИИ ещё не подключён.
                </p>
              )}
            </div>
          </Card>
        )}

        <section aria-labelledby="scenarios-title" className="flex flex-col gap-3">
          <h2 id="scenarios-title" className="text-lg font-extrabold">
            Начать разговор
          </h2>
          <ScenarioPicker scenarios={scenarios} disabled={!availability.available} />
          <p className="text-sm text-muted-foreground">
            Сообщения обрабатывает ИИ-сервис. Не пиши Отти пароли, номера карт и другие личные данные.{" "}
            <Link href="/privacy" className="font-bold text-primary hover:underline">
              Подробнее
            </Link>
          </p>
        </section>

        <section aria-labelledby="history-title" className="flex flex-col gap-3">
          <h2 id="history-title" className="text-lg font-extrabold">
            Прошлые разговоры
          </h2>
          {threads.length === 0 ? (
            <p className="text-muted-foreground">Здесь появятся твои разговоры с Отти.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {threads.map((thread) => (
                <li key={thread.id}>
                  <Link
                    href={`/tutor/${thread.id}`}
                    className="flex items-center gap-3 rounded-2xl border bg-card p-4 transition-colors outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="font-bold">{thread.title}</span>
                        {thread.summary ? (
                          <Badge variant="river">Итоги готовы</Badge>
                        ) : (
                          <Badge variant="muted">Не завершён</Badge>
                        )}
                      </span>
                      <span className="mt-0.5 block text-sm text-muted-foreground">
                        {formatDayLong(todayInTimezone(profile.timezone, thread.updatedAt))} · твоих сообщений:{" "}
                        {thread.userMessages}
                      </span>
                    </span>
                    <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
