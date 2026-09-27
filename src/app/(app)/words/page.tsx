import type { Metadata } from "next";
import Link from "next/link";
import { Layers } from "lucide-react";

import { Otti } from "@/components/otti";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { WordList, type WordItem } from "@/components/words/word-list";
import { formatDayLong, todayInTimezone } from "@/lib/dates";
import { WORDS, withPlural } from "@/lib/plural";
import { getProfile } from "@/lib/profile";
import { requireSession } from "@/lib/session";
import { getAllWords, getWordStats } from "@/lib/word-store";

export const metadata: Metadata = { title: "Словарь" };

export default async function WordsPage() {
  const { user } = await requireSession();
  const [profile, stats] = await Promise.all([getProfile(user.id), getWordStats(user.id)]);
  const rows = await getAllWords(user.id);

  const words: WordItem[] = rows.map((row) => ({
    id: row.id,
    word: row.word,
    translation: row.translation,
    example: row.example,
    exampleRu: row.exampleRu,
    status: row.status,
    addedLabel: formatDayLong(todayInTimezone(profile.timezone, row.createdAt)),
    sourceTitle: row.sourceTitle,
  }));

  return (
    <>
      <PageHeader title="Словарь" description="Слова из уроков — повторяй их карточками, чтобы не забыть." />

      {stats.total === 0 ? (
        <Card className="items-center text-center">
          <Otti size={96} mood="wink" />
          <p className="text-lg font-extrabold">Словарь пока пуст</p>
          <p className="max-w-sm text-muted-foreground">
            Пройди первый урок — его новые слова сами появятся здесь.
          </p>
          <Button asChild>
            <Link href="/learn">К урокам</Link>
          </Button>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          <Card className="flex-row flex-wrap items-center gap-4 border-primary/30 bg-linear-to-br from-secondary to-card">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <Layers className="size-6" aria-hidden />
            </span>
            <div className="min-w-0 flex-1 basis-56">
              <p className="text-lg leading-tight font-black">
                {stats.due > 0 ? `Пора повторить: ${withPlural(stats.due, WORDS)}` : "Все слова повторены"}
              </p>
              <p className="text-sm text-muted-foreground">
                Выучено {stats.learned} из {stats.total}. Слово считается выученным после трёх
                «Помню» подряд.
              </p>
            </div>
            <Button asChild variant={stats.due > 0 ? "default" : "outline"} className="w-full sm:w-auto">
              <Link href="/words/review">{stats.due > 0 ? "Повторить" : "Потренироваться"}</Link>
            </Button>
          </Card>

          <WordList words={words} />
        </div>
      )}
    </>
  );
}
