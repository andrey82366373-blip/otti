import type { Metadata } from "next";

import { MistakeTrainer } from "@/components/mistakes/mistake-trainer";
import { TOPICS, getTopicTitle } from "@/content/course/topics";
import { getTrainingItems } from "@/lib/mistake-store";
import { requireSession } from "@/lib/session";

export const metadata: Metadata = { title: "Тренировка ошибок" };

type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function MistakeTrainingPage({ searchParams }: PageProps) {
  const { user } = await requireSession();
  const params = await searchParams;

  // ?topic=greetings — только ошибки одной темы; ?round=2 — следующая тренировка подряд
  const topic = typeof params.topic === "string" && Object.hasOwn(TOPICS, params.topic) ? params.topic : undefined;
  const round = typeof params.round === "string" ? Math.max(1, Number.parseInt(params.round, 10) || 1) : 1;

  const { items, totalOpen } = await getTrainingItems(user.id, topic);

  const more = new URLSearchParams();
  if (topic) more.set("topic", topic);
  more.set("round", String(round + 1));

  // Пустой список тоже показывает MistakeTrainer — см. комментарий внутри него
  return (
    <MistakeTrainer
      key={round}
      items={items}
      totalOpen={totalOpen}
      topicTitle={topic ? getTopicTitle(topic) : undefined}
      moreHref={`/mistakes/train?${more.toString()}`}
    />
  );
}
