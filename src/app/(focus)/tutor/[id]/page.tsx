import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";

import { ChatView } from "@/components/tutor/chat-view";
import { getAiConfig } from "@/lib/ai/config";
import { getAiUsageToday, getUserAiDailyLimit } from "@/lib/ai/limits";
import { getProfile } from "@/lib/profile";
import { requireSession } from "@/lib/session";
import { getTutorAvailability } from "@/lib/tutor/availability";
import { getDictionaryWordSet, getThread, toMessageView } from "@/lib/tutor/store";

export const metadata: Metadata = { title: "Разговор с Отти" };

// Ответ ИИ может идти до полуминуты (а с запасным провайдером — дольше)
export const maxDuration = 60;

type PageProps = { params: Promise<{ id: string }> };

export default async function ChatPage({ params }: PageProps) {
  const { id } = await params;
  const { user } = await requireSession();
  if (!z.uuid().safeParse(id).success) notFound();

  const found = await getThread(user.id, id);
  if (!found) notFound();

  const { limits } = getAiConfig();
  const [profile, usage, dictionary, dailyLimit] = await Promise.all([
    getProfile(user.id),
    getAiUsageToday(user.id).catch(() => ({ userRequests: 0 })),
    getDictionaryWordSet(user.id),
    getUserAiDailyLimit(user.id, limits),
  ]);
  const availability = getTutorAvailability();

  return (
    <ChatView
      key={found.thread.id}
      threadId={found.thread.id}
      title={found.thread.title}
      initialMessages={found.messages.map(toMessageView)}
      initialSummary={found.thread.summary ?? null}
      level={profile.level}
      unavailableMessage={availability.available ? null : availability.message}
      mock={availability.available && availability.mock}
      usedToday={usage.userRequests}
      dailyLimit={dailyLimit}
      maxChars={limits.maxInputChars}
      maxMessages={limits.threadMaxMessages}
      dictionary={dictionary}
    />
  );
}
