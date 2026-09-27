"use client";

import { useEffect, useRef, useState } from "react";

import { DONT_KNOW, type PublicPlacementQuestion } from "@/content/placement-test";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type PlacementTestProps = {
  questions: PublicPlacementQuestion[];
  /** Вызывается, когда ученик ответил на все вопросы. */
  onComplete: (answers: number[]) => void;
};

/** Показывает пропуск «___» в предложении выделенным. */
function Sentence({ text }: { text: string }) {
  const parts = text.split("___");
  return (
    <p lang="en" className="text-2xl leading-snug font-extrabold md:text-3xl">
      {parts.map((part, index) => (
        <span key={index}>
          {part}
          {index < parts.length - 1 && (
            <span className="mx-1 inline-block min-w-16 border-b-4 border-primary align-baseline">
              <span className="sr-only">пропуск</span>
            </span>
          )}
        </span>
      ))}
    </p>
  );
}

/** Мини-тест: по одному вопросу на экране, без подсказок, правильно или нет. */
export function PlacementTest({ questions, onComplete }: PlacementTestProps) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [chosen, setChosen] = useState<number | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const question = questions[index];

  // Для экранных дикторов: после перехода фокус на новом вопросе
  useEffect(() => {
    if (index > 0) headingRef.current?.focus();
  }, [index]);

  function answer(value: number) {
    if (chosen !== null) return;
    setChosen(value);
    const next = [...answers, value];

    // Короткая пауза, чтобы было видно выбранный вариант
    window.setTimeout(() => {
      setAnswers(next);
      setChosen(null);
      if (next.length >= questions.length) {
        onComplete(next);
      } else {
        setIndex(next.length);
      }
    }, 250);
  }

  if (!question) return null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-sm font-bold text-muted-foreground">
          <span>
            Вопрос {index + 1} из {questions.length}
          </span>
        </div>
        <Progress value={index} max={questions.length} label="Пройдено вопросов" />
      </div>

      <div className="flex flex-col gap-3">
        <h2 ref={headingRef} tabIndex={-1} className="font-bold text-muted-foreground outline-none">
          {question.prompt}
        </h2>
        {question.sentence && <Sentence text={question.sentence} />}
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2">
        {question.options.map((option, optionIndex) => (
          <button
            key={option}
            type="button"
            lang="en"
            onClick={() => answer(optionIndex)}
            disabled={chosen !== null}
            className={cn(
              "min-h-14 rounded-2xl border-2 bg-card px-4 py-3 text-left text-lg font-bold transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
              chosen === optionIndex
                ? "border-primary bg-secondary text-secondary-foreground"
                : "border-border hover:border-primary/40 hover:bg-muted/50",
            )}
          >
            {option}
          </button>
        ))}
      </div>

      <Button
        variant="ghost"
        onClick={() => answer(DONT_KNOW)}
        disabled={chosen !== null}
        className="self-center text-muted-foreground"
      >
        Не знаю
      </Button>
    </div>
  );
}
