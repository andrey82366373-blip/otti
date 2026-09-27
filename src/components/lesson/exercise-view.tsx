"use client";

import type { ExerciseProps } from "@/components/lesson/exercise-props";
import { BuildSentenceExercise } from "@/components/lesson/exercises/build-sentence-exercise";
import { ChoiceExercise } from "@/components/lesson/exercises/choice-exercise";
import { FillBlankExercise } from "@/components/lesson/exercises/fill-blank-exercise";
import { MatchPairsExercise } from "@/components/lesson/exercises/match-pairs-exercise";
import { TextAnswerExercise } from "@/components/lesson/exercises/text-answer-exercise";
import type { Exercise } from "@/content/course/types";

/** Показывает задание нужного типа. */
export function ExerciseView(props: ExerciseProps<Exercise>) {
  const { exercise } = props;
  switch (exercise.type) {
    case "choose-translation":
    case "choose-word":
    case "grammar-choice":
      return <ChoiceExercise {...props} exercise={exercise} />;
    case "fill-blank":
      return <FillBlankExercise {...props} exercise={exercise} />;
    case "build-sentence":
      return <BuildSentenceExercise {...props} exercise={exercise} />;
    case "match-pairs":
      return <MatchPairsExercise {...props} exercise={exercise} />;
    case "translate-phrase":
    case "short-answer":
    case "tutor-reply":
      return <TextAnswerExercise {...props} exercise={exercise} />;
  }
}

/** Можно ли нажать «Не знаю» (для заданий с вводом и сборкой предложения). */
export function canSkip(exercise: Exercise): boolean {
  return (
    exercise.type === "fill-blank" ||
    exercise.type === "translate-phrase" ||
    exercise.type === "short-answer" ||
    exercise.type === "tutor-reply" ||
    exercise.type === "build-sentence"
  );
}
