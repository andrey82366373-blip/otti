import type { Metadata } from "next";
import Link from "next/link";

import { Otti } from "@/components/otti";
import { Button } from "@/components/ui/button";
import { WordReview } from "@/components/words/word-review";
import { requireSession } from "@/lib/session";
import { getReviewCards, getWordStats } from "@/lib/word-store";

export const metadata: Metadata = { title: "Повторение слов" };

export default async function WordReviewPage() {
  const { user } = await requireSession();
  await getWordStats(user.id); // заодно добавит слова уже пройденных уроков
  const { cards, practice } = await getReviewCards(user.id);

  if (cards.length === 0) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
        <Otti size={96} mood="wink" />
        <h1 className="text-2xl font-black">Пока нечего повторять</h1>
        <p className="text-muted-foreground">Пройди урок — его слова попадут в словарь.</p>
        <Button asChild size="lg">
          <Link href="/learn">К урокам</Link>
        </Button>
      </main>
    );
  }

  return <WordReview cards={cards} practice={practice} />;
}
