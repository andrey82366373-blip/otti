"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, RotateCcw, X, Zap } from "lucide-react";

import { SpeakButton } from "@/components/course/speak-button";
import { PlayOnMount } from "@/components/motion/play-on-mount";
import { Otti } from "@/components/otti";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { reviewWord } from "@/lib/actions/words";
import type { ReviewCard } from "@/lib/word-store";

type QueueItem = { card: ReviewCard; repeat: boolean };

/**
 * Повторение карточками: слово → «Показать перевод» → «Помню» / «Не помню».
 * Забытые слова ещё раз показываются в конце. Клавиши: пробел — перевернуть, 1 — не помню, 2 — помню.
 */
export function WordReview(props: { cards: ReviewCard[]; practice: boolean }) {
  // Запоминаем набор карточек на всё повторение — он не должен меняться по ходу
  const [{ cards, practice }] = useState(props);
  const [queue, setQueue] = useState<QueueItem[]>(() => cards.map((card) => ({ card, repeat: false })));
  const [position, setPosition] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [remembered, setRemembered] = useState(0);
  const [forgotten, setForgotten] = useState<string[]>([]);
  const [xp, setXp] = useState(0);
  const [failed, setFailed] = useState(false);
  const [finished, setFinished] = useState(false);
  const flipRef = useRef<HTMLButtonElement>(null);

  const current = queue[position];
  const firstPassDone = queue.filter((item, index) => !item.repeat && index < position).length;

  const answer = useCallback(
    (isRemembered: boolean) => {
      if (!current || !flipped) return;

      // На первом показе сохраняем ответ на сервере; повтор в конце — просто тренировка
      if (!current.repeat) {
        if (isRemembered) setRemembered((value) => value + 1);
        else setForgotten((list) => [...list, current.card.word]);
        reviewWord({ wordId: current.card.id, remembered: isRemembered })
          .then((result) => {
            if (result.ok) setXp((value) => value + result.xpEarned);
            else setFailed(true);
          })
          .catch(() => setFailed(true));
        if (!isRemembered) {
          setQueue((items) => [...items, { card: current.card, repeat: true }]);
        }
      }

      if (position + 1 < queue.length + (!current.repeat && !isRemembered ? 1 : 0)) {
        setPosition((value) => value + 1);
        setFlipped(false);
      } else {
        setFinished(true);
      }
    },
    [current, flipped, position, queue.length],
  );

  // Клавиатура: пробел/Enter — перевернуть, 1/← — не помню, 2/→ — помню
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (finished || event.target instanceof HTMLInputElement) return;
      if (!flipped && (event.key === " " || event.key === "Enter")) {
        event.preventDefault();
        setFlipped(true);
      } else if (flipped && (event.key === "1" || event.key === "ArrowLeft")) {
        answer(false);
      } else if (flipped && (event.key === "2" || event.key === "ArrowRight")) {
        answer(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [answer, finished, flipped]);

  // Новая карточка — фокус на кнопке «Показать перевод»
  useEffect(() => {
    if (!flipped) flipRef.current?.focus({ preventScroll: true });
  }, [position, flipped]);

  if (finished || !current) {
    const total = cards.length;
    return (
      <main className="mx-auto flex w-full max-w-md flex-col gap-5 px-4 pt-10 pb-16">
        {total > 0 && <PlayOnMount sound="complete" />}
        <div className="flex flex-col items-center gap-2 text-center">
          <Otti size={104} mood={forgotten.length === 0 ? "joy" : "happy"} className="animate-celebrate" />
          <h1 className="text-3xl font-black tracking-tight">Повторение окончено</h1>
          <p className="text-muted-foreground">
            {practice
              ? "Свободная тренировка без XP. Забытые слова вернутся в повторение."
              : `Карточек: ${total}`}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          <div className="flex flex-col items-center gap-1 rounded-2xl border-2 bg-card px-2 py-4 text-center">
            <Check className="size-6 text-success" aria-hidden />
            <p className="text-2xl font-black">{remembered}</p>
            <p className="text-xs font-bold text-muted-foreground">помню</p>
          </div>
          <div className="flex flex-col items-center gap-1 rounded-2xl border-2 bg-card px-2 py-4 text-center">
            <RotateCcw className="size-6 text-streak" aria-hidden />
            <p className="text-2xl font-black">{forgotten.length}</p>
            <p className="text-xs font-bold text-muted-foreground">повторить</p>
          </div>
          <div className="flex flex-col items-center gap-1 rounded-2xl border-2 bg-card px-2 py-4 text-center">
            <Zap className="size-6 text-xp" aria-hidden />
            <p className="text-2xl font-black">+{xp}</p>
            <p className="text-xs font-bold text-muted-foreground">XP</p>
          </div>
        </div>

        {forgotten.length > 0 && (
          <Card className="gap-2">
            <p className="font-bold">Эти слова вернутся в следующем повторении:</p>
            <p lang="en" className="text-muted-foreground">
              {forgotten.join(", ")}
            </p>
          </Card>
        )}
        {failed && (
          <p role="alert" className="text-sm font-semibold text-destructive">
            Часть ответов не сохранилась — проверь интернет. Эти слова предложим снова.
          </p>
        )}
        {!practice && (
          <p className="text-center text-sm text-muted-foreground">
            XP даётся за «Помню», когда у слова подошёл срок повторения.
          </p>
        )}

        <div className="flex flex-col gap-3">
          <Button asChild size="lg">
            <Link href="/words">В словарь</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/learn">На главную</Link>
          </Button>
        </div>
      </main>
    );
  }

  const { card } = current;

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-2xl items-center gap-3 px-4 pt-4">
        <h1 className="sr-only">Повторение слов</h1>
        <Button asChild variant="ghost" size="icon" aria-label="Закончить повторение">
          <Link href="/words">
            <X className="size-6" />
          </Link>
        </Button>
        <Progress
          value={Math.min(firstPassDone, cards.length)}
          max={cards.length}
          label={`Повторено ${firstPassDone} из ${cards.length}`}
          className="h-4 flex-1"
          barClassName="bg-river"
        />
        <span className="w-12 text-right text-sm font-bold text-muted-foreground tabular-nums">
          {Math.min(firstPassDone, cards.length)}/{cards.length}
        </span>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-5 px-4 py-8">
        <div className="flex gap-2">
          {practice && <Badge variant="muted">Свободная тренировка</Badge>}
          {current.repeat && (
            <Badge variant="muted">
              <RotateCcw aria-hidden />
              Ещё раз
            </Badge>
          )}
        </div>

        <Card key={`${card.id}-${position}`} className="animate-card-in w-full max-w-md items-center gap-5 py-10 text-center">
          <div className="flex items-center gap-3">
            <p lang="en" className="text-4xl font-black break-words">
              {card.word}
            </p>
            <SpeakButton text={card.word} />
          </div>

          {flipped ? (
            <div className="animate-pop flex flex-col items-center gap-3">
              <p className="text-2xl font-extrabold text-primary">{card.translation}</p>
              {card.example && (
                <div className="flex flex-col gap-0.5">
                  <p lang="en" className="font-semibold">
                    {card.example}
                  </p>
                  {card.exampleRu && <p className="text-sm text-muted-foreground">{card.exampleRu}</p>}
                </div>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">Вспомни перевод, а потом проверь себя.</p>
          )}
        </Card>
      </main>

      <footer className="sticky bottom-0 border-t-2 bg-background pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto flex w-full max-w-2xl gap-3 px-4 py-4">
          {flipped ? (
            <>
              <Button size="lg" variant="outline" className="flex-1 px-3" onClick={() => answer(false)}>
                <RotateCcw aria-hidden />
                Не помню
              </Button>
              <Button size="lg" variant="river" className="flex-1 px-3" onClick={() => answer(true)}>
                <Check aria-hidden />
                Помню
              </Button>
            </>
          ) : (
            <Button ref={flipRef} size="lg" className="flex-1" onClick={() => setFlipped(true)}>
              Показать перевод
            </Button>
          )}
        </div>
        <p className="hidden pb-3 text-center text-xs text-muted-foreground md:block">
          Клавиши: пробел — показать перевод, 1 — не помню, 2 — помню
        </p>
      </footer>
    </div>
  );
}
