"use client";

import { useState } from "react";
import { Languages } from "lucide-react";

import { SpeakButton } from "@/components/course/speak-button";
import type { ExerciseProps } from "@/components/lesson/exercise-props";
import { EnglishInput } from "@/components/lesson/exercises/text-input";
import { Otti } from "@/components/otti";
import type {
  OpenAnswerExercise,
  TranslatePhraseExercise,
} from "@/content/course/types";

type TextExercise = TranslatePhraseExercise | OpenAnswerExercise;

/** Перевод фразы, короткий ответ на вопрос и ответ Отти — всё это ввод текста. */
export function TextAnswerExercise({ exercise, answer, onAnswer, result }: ExerciseProps<TextExercise>) {
  const [showTranslation, setShowTranslation] = useState(false);
  const text = answer?.kind === "text" ? answer.text : "";
  const state = !result ? "idle" : result.correct ? "correct" : "wrong";

  const input = (placeholder: string, label: string, warnCyrillic: boolean) => (
    <EnglishInput
      value={text}
      onChange={(value) => onAnswer(value.trim() ? { kind: "text", text: value } : null)}
      disabled={result !== null}
      state={state}
      placeholder={placeholder}
      label={label}
      warnCyrillic={warnCyrillic}
    />
  );

  if (exercise.type === "translate-phrase") {
    return (
      <div className="flex flex-col gap-6">
        <p className="text-2xl leading-snug font-extrabold md:text-3xl">«{exercise.source}»</p>
        {input("Напиши по-английски", "Перевод на английский", true)}
      </div>
    );
  }

  const translationToggle = (
    <button
      type="button"
      onClick={() => setShowTranslation((value) => !value)}
      aria-expanded={showTranslation}
      className="flex w-fit items-center gap-1.5 rounded-lg text-sm font-bold text-primary outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      <Languages className="size-4" aria-hidden />
      {showTranslation ? "Скрыть перевод" : "Показать перевод"}
    </button>
  );

  if (exercise.type === "tutor-reply") {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-end gap-2">
          <Otti size={56} />
          <div className="flex flex-col gap-1.5 rounded-2xl rounded-bl-md bg-muted px-4 py-3">
            <div className="flex items-center gap-2">
              <p lang="en" className="text-lg font-bold">
                {exercise.question}
              </p>
              <SpeakButton text={exercise.question} className="size-8" />
            </div>
            {showTranslation && (
              <p className="text-sm text-muted-foreground">{exercise.questionTranslation}</p>
            )}
            {translationToggle}
          </div>
        </div>
        {/* Имена можно писать как угодно, поэтому о русской раскладке не предупреждаем */}
        {input("Ответь Отти по-английски", "Твой ответ Отти", false)}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <SpeakButton text={exercise.question} />
          <p lang="en" className="text-2xl leading-snug font-extrabold md:text-3xl">
            {exercise.question}
          </p>
        </div>
        {showTranslation && <p className="text-muted-foreground">{exercise.questionTranslation}</p>}
        {translationToggle}
      </div>
      {input("Твой ответ по-английски", "Ответ на вопрос", true)}
    </div>
  );
}
