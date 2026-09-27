"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { SpeakButton } from "@/components/course/speak-button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { WordStatus } from "@/db/schema";
import { WORD_STATUS_INFO } from "@/lib/words";
import { cn } from "@/lib/utils";

export type WordItem = {
  id: string;
  word: string;
  translation: string;
  example: string | null;
  exampleRu: string | null;
  status: WordStatus;
  addedLabel: string;
  sourceTitle: string;
};

type Filter = "all" | WordStatus;

const FILTERS: Filter[] = ["all", "new", "learning", "learned"];

const STATUS_BADGE: Record<WordStatus, "default" | "river" | "muted"> = {
  new: "default",
  learning: "muted",
  learned: "river",
};

/** Список слов с поиском и фильтром по статусу. */
export function WordList({ words }: { words: WordItem[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const counts = useMemo(() => {
    const result: Record<Filter, number> = { all: words.length, new: 0, learning: 0, learned: 0 };
    for (const word of words) result[word.status] += 1;
    return result;
  }, [words]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/ё/g, "е");
    return words.filter((word) => {
      if (filter !== "all" && word.status !== filter) return false;
      if (!q) return true;
      return (
        word.word.toLowerCase().includes(q) ||
        word.translation.toLowerCase().replace(/ё/g, "е").includes(q)
      );
    });
  }, [words, query, filter]);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <label htmlFor="word-search" className="sr-only">
          Поиск по словарю
        </label>
        <Input
          id="word-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Найти слово или перевод"
          className="pl-12"
          autoComplete="off"
        />
      </div>

      <div role="group" aria-label="Показать слова" className="flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <button
            key={item}
            type="button"
            aria-pressed={filter === item}
            onClick={() => setFilter(item)}
            className={cn(
              "rounded-full border-2 px-3.5 py-1.5 text-sm font-bold transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
              filter === item
                ? "border-primary bg-secondary text-secondary-foreground"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {item === "all" ? "Все" : WORD_STATUS_INFO[item].plural} · {counts[item]}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="py-6 text-center text-muted-foreground">Ничего не найдено.</p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {visible.map((word) => (
            <li key={word.id} className="flex gap-3 rounded-2xl border bg-card p-3.5">
              <SpeakButton text={word.word} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <p>
                    <span lang="en" className="text-lg font-extrabold">
                      {word.word}
                    </span>{" "}
                    <span className="text-muted-foreground">— {word.translation}</span>
                  </p>
                  <Badge variant={STATUS_BADGE[word.status]}>{WORD_STATUS_INFO[word.status].title}</Badge>
                </div>
                {word.example && (
                  <p lang="en" className="mt-1 text-sm">
                    {word.example}
                  </p>
                )}
                {word.exampleRu && <p className="text-sm text-muted-foreground">{word.exampleRu}</p>}
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {word.sourceTitle} · добавлено {word.addedLabel}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
