"use client";

import { useEffect, useRef } from "react";
import { CircleCheck, CircleX, RotateCcw } from "lucide-react";

import { SpeakButton } from "@/components/course/speak-button";
import { useFeedbackPrefs } from "@/components/motion/feedback-prefs";
import { Otti } from "@/components/otti";
import { Button } from "@/components/ui/button";
import type { Exercise } from "@/content/course/types";
import type { AiNote } from "@/components/lesson/check-answer";
import type { CheckResult } from "@/lib/exercise-check";
import { cn } from "@/lib/utils";

const PRAISE = ["Правильно!", "Отлично!", "Верно!", "Так держать!", "Супер!"];

/** Капельки-искорки, разлетающиеся от значка верного ответа. */
const SPARKS = [
  { dx: -26, dy: -20 },
  { dx: 0, dy: -30 },
  { dx: 26, dy: -20 },
  { dx: 30, dy: 4 },
  { dx: -30, dy: 4 },
  { dx: 14, dy: 22 },
];

function Sparkles() {
  return (
    <span aria-hidden className="pointer-events-none absolute right-1 bottom-1">
      {SPARKS.map((spark, index) => (
        <span
          key={index}
          className="animate-sparkle absolute size-1.5 rounded-full bg-success"
          style={{ "--dx": `${spark.dx}px`, "--dy": `${spark.dy}px`, animationDelay: `${index * 25}ms` } as React.CSSProperties}
        />
      ))}
    </span>
  );
}

/** Перевод английского предложения, если он есть у задания. */
function getTranslation(exercise: Exercise): string | undefined {
  if (exercise.type === "fill-blank") return exercise.translation;
  if (
    exercise.type === "choose-translation" ||
    exercise.type === "choose-word" ||
    exercise.type === "grammar-choice"
  ) {
    return exercise.translation;
  }
  if (exercise.type === "build-sentence" || exercise.type === "translate-phrase") {
    return exercise.source;
  }
  if (exercise.type === "short-answer" || exercise.type === "tutor-reply") {
    return exercise.sampleTranslation;
  }
  return undefined;
}

/** Показывается ли правильный ответ по-английски (тогда его можно послушать). */
function isEnglishAnswer(exercise: Exercise): boolean {
  if ("optionsLang" in exercise) return exercise.optionsLang === "en";
  return exercise.type !== "match-pairs";
}

type FeedbackPanelProps = {
  exercise: Exercise;
  result: CheckResult;
  /** Номер для выбора похвалы (чтобы она менялась). */
  seed: number;
  willRepeat: boolean;
  isLast: boolean;
  onNext: () => void;
  /** Подсказка о повторе задания. */
  repeatNote?: string;
  /** Что сказал Отти, если ответ «своими словами» проверял ИИ. */
  aiNote?: AiNote | null;
};

/** Нижняя панель после проверки: правильно или нет, правильный ответ, перевод и объяснение. */
export function FeedbackPanel({
  exercise,
  result,
  seed,
  willRepeat,
  isLast,
  onNext,
  repeatNote = "Вернёмся к этому заданию в конце урока.",
  aiNote = null,
}: FeedbackPanelProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { play } = useFeedbackPrefs();

  // Панель появляется один раз на каждый ответ: фокус на кнопку и короткий звук
  useEffect(() => {
    buttonRef.current?.focus({ preventScroll: true });
    play(result.correct ? "correct" : "wrong");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- звук только при появлении панели
  }, []);

  const translation = getTranslation(exercise);
  const isOpen = exercise.type === "short-answer" || exercise.type === "tutor-reply";
  const title = result.correct
    ? PRAISE[seed % PRAISE.length]
    : result.nearMiss
      ? "Почти! Проверь написание"
      : "Неправильно";

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "animate-rise border-t-2 pb-[env(safe-area-inset-bottom)]",
        result.correct ? "border-success/40 bg-success-soft" : "border-destructive/40 bg-destructive-soft",
      )}
    >
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-3 px-4 py-4 md:flex-row md:items-end md:justify-between md:gap-6">
        <div className="flex min-w-0 gap-3">
          {/* Отти радуется верному ответу и растерянно наклоняет голову при ошибке */}
          <span className="relative shrink-0">
            <Otti
              size={52}
              mood={result.correct ? "joy" : "confused"}
              className={result.correct ? "animate-hop" : "animate-tilt origin-bottom"}
            />
            <span
              className={cn(
                "absolute -right-1 -bottom-1 flex size-6 items-center justify-center rounded-full bg-card",
                result.correct && "animate-pop",
              )}
            >
              {result.correct ? (
                <CircleCheck className="size-6 text-success" aria-hidden />
              ) : (
                <CircleX className="size-6 text-destructive" aria-hidden />
              )}
            </span>
            {result.correct && <Sparkles />}
          </span>
          <div className="flex min-w-0 flex-col gap-1">
            <p className={cn("text-xl font-black", result.correct ? "text-success" : "text-destructive")}>
              {title}
            </p>

            {!result.correct && exercise.type !== "match-pairs" && (
              <div className="flex items-center gap-2">
                <p className="font-bold text-foreground">
                  {isOpen ? "Можно ответить так: " : "Правильный ответ: "}
                  <span lang={isEnglishAnswer(exercise) ? "en" : "ru"}>{result.correctAnswer}</span>
                </p>
                {isEnglishAnswer(exercise) && <SpeakButton text={result.correctAnswer} className="size-8" />}
              </div>
            )}
            {!result.correct && exercise.type === "match-pairs" && (
              <>
                <p className="font-bold text-foreground">
                  Были ошибки: {result.userAnswer.replace(/^Ошибки: /, "")}
                </p>
                <p className="text-sm text-foreground/80">Правильные пары: {result.correctAnswer}</p>
              </>
            )}

            {translation && exercise.type !== "choose-translation" && (
              <p className="text-sm text-foreground/80">Перевод: {translation}</p>
            )}
            <p className="text-sm text-foreground/80">{exercise.explanation}</p>

            {aiNote?.kind === "accepted" && (
              <p className="text-sm font-bold text-foreground">
                Отти проверил твой ответ{aiNote.comment ? `: ${aiNote.comment}` : " — всё верно!"}
              </p>
            )}
            {aiNote?.kind === "rejected" && (
              <>
                {aiNote.comment && <p className="text-sm font-bold text-foreground">Отти: {aiNote.comment}</p>}
                {aiNote.corrected && aiNote.corrected !== result.userAnswer && (
                  <p className="text-sm text-foreground/80">
                    Твой ответ с исправлениями: <span lang="en">{aiNote.corrected}</span>
                  </p>
                )}
              </>
            )}
            {aiNote?.kind === "unavailable" && (
              <p className="text-xs text-foreground/70">
                {aiNote.message} Ответ сверили с образцами.
              </p>
            )}
            {willRepeat && (
              <p className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                <RotateCcw className="size-4" aria-hidden />
                {repeatNote}
              </p>
            )}
          </div>
        </div>

        <Button
          ref={buttonRef}
          type="button"
          size="lg"
          onClick={onNext}
          className={cn(
            "w-full shrink-0 md:w-44",
            !result.correct &&
              "bg-destructive text-destructive-foreground shadow-[0_3px_0_0_color-mix(in_oklab,var(--destructive)_70%,black)] hover:bg-destructive/90",
          )}
        >
          {isLast ? "Завершить" : "Дальше"}
        </Button>
      </div>
    </div>
  );
}
