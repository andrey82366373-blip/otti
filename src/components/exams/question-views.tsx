"use client";

import { CircleCheck, CircleX, Lightbulb, Quote } from "lucide-react";

import { QUESTION_KIND_TITLES } from "@/content/ielts/types";
import {
  type PublicGroup,
  type PublicQuestion,
  type ReviewDetail,
  type AnswerValue,
} from "@/lib/exams/ielts";
import { cn } from "@/lib/utils";

export type Answers = Record<string, AnswerValue>;

type GroupProps = {
  group: PublicGroup;
  /** Номер первого вопроса группы. */
  startNumber: number;
  answers: Answers;
  onChange: (questionId: string, value: AnswerValue) => void;
  /** Разбор после проверки — вопросы становятся только для чтения. */
  review: Map<string, ReviewDetail> | null;
  /** Какие вопросы показывать (при работе над ошибками — только ошибочные). */
  visible?: Set<string>;
  /** Подсказка о типе заданий (в учебном режиме). */
  showTip: boolean;
};

const JUDGEMENT_OPTIONS: Record<"tfng" | "ynng", string[]> = {
  tfng: ["TRUE", "FALSE", "NOT GIVEN"],
  ynng: ["YES", "NO", "NOT GIVEN"],
};

function QuestionNumber({ number, state }: { number: number; state: "correct" | "wrong" | null }) {
  return (
    <span
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-black tabular-nums",
        state === "correct"
          ? "bg-success-soft text-success ring-2 ring-success/60"
          : state === "wrong"
            ? "bg-destructive-soft text-destructive ring-2 ring-destructive/60"
            : "bg-muted text-foreground",
      )}
    >
      {number}
    </span>
  );
}

/** Разбор вопроса: верно или нет, правильный ответ, объяснение и цитата из текста. */
function ReviewBlock({ detail }: { detail: ReviewDetail }) {
  return (
    <div
      className={cn(
        "mt-2 flex flex-col gap-1.5 rounded-xl border-l-4 px-3 py-2 text-sm",
        detail.correct ? "border-success bg-success-soft/60" : "border-destructive bg-destructive-soft/60",
      )}
    >
      <p className="flex flex-wrap items-center gap-x-2 font-bold">
        {detail.correct ? (
          <CircleCheck className="size-4 text-success" aria-hidden />
        ) : (
          <CircleX className="size-4 text-destructive" aria-hidden />
        )}
        {detail.correct ? "Верно" : "Неверно"}
        {!detail.correct && (
          <span className="font-semibold">
            · Твой ответ: <span lang="en">{detail.given ?? "нет ответа"}</span>
          </span>
        )}
      </p>
      {!detail.correct && (
        <p>
          <span className="font-bold">Правильно:</span> <span lang="en">{detail.correctLabel}</span>
        </p>
      )}
      <p>{detail.explanation}</p>
      {detail.evidence && (
        <p className="flex gap-1.5 text-foreground/80 italic">
          <Quote className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          <span lang="en">{detail.evidence}</span>
        </p>
      )}
    </div>
  );
}

function stateOf(review: Map<string, ReviewDetail> | null, id: string): "correct" | "wrong" | null {
  const detail = review?.get(id);
  return detail ? (detail.correct ? "correct" : "wrong") : null;
}

/** Поле для вписывания ответа (Sentence / Note / Form completion). */
function GapInput({
  question,
  number,
  value,
  disabled,
  onChange,
}: {
  question: Extract<PublicQuestion, { kind: "sentence" | "gap" }>;
  number: number;
  value: AnswerValue;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  const [before, after = ""] = question.prompt.split("___");
  return (
    <p lang="en" className="leading-9">
      {before}
      <input
        type="text"
        inputMode="text"
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
        aria-label={`Ответ на вопрос ${number}`}
        data-question-id={question.id}
        value={typeof value === "string" ? value : ""}
        disabled={disabled}
        maxLength={60}
        onChange={(event) => onChange(event.target.value)}
        className="mx-1 inline-block h-9 w-40 max-w-full rounded-lg border-2 bg-card px-2 font-semibold outline-none focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-ring/25 disabled:opacity-80"
      />
      {after}
    </p>
  );
}

/** Выпадающий список (заголовки, варианты для сопоставления и summary). */
function SelectInput({
  questionId,
  number,
  value,
  options,
  disabled,
  onChange,
  className,
}: {
  questionId: string;
  number: number;
  value: AnswerValue;
  options: { id: string; text: string }[];
  disabled: boolean;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <select
      aria-label={`Ответ на вопрос ${number}`}
      data-question-id={questionId}
      value={typeof value === "string" ? value : ""}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      className={cn(
        "h-10 max-w-full rounded-lg border-2 bg-card px-2 font-bold outline-none focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-ring/25 disabled:opacity-80",
        className,
      )}
    >
      <option value="">— выбрать —</option>
      {options.map((option) => (
        <option key={option.id} value={option.id}>
          {option.id} {option.text.length > 60 ? `${option.text.slice(0, 57)}…` : option.text}
        </option>
      ))}
    </select>
  );
}

/** Группа вопросов одного типа: инструкция, (список вариантов) и сами вопросы. */
export function QuestionGroupView({ group, startNumber, answers, onChange, review, visible, showTip }: GroupProps) {
  const locked = review !== null;
  const questions = group.questions
    .map((question, index) => ({ question, number: startNumber + index }))
    .filter(({ question }) => !visible || visible.has(question.id));
  if (questions.length === 0) return null;

  const first = startNumber;
  const last = startNumber + group.questions.length - 1;

  return (
    <section className="flex flex-col gap-4 rounded-2xl border-2 bg-card p-4" aria-labelledby={`${group.id}-title`}>
      <header className="flex flex-col gap-1.5">
        <h2 id={`${group.id}-title`} className="text-sm font-black tracking-wide text-primary uppercase">
          Questions {first}–{last} · {QUESTION_KIND_TITLES[group.kind]}
        </h2>
        <p lang="en" className="text-sm font-semibold">
          {group.instructions}
        </p>
        {showTip && (
          <p className="flex items-start gap-1.5 rounded-lg bg-secondary/70 px-2.5 py-1.5 text-xs font-semibold text-secondary-foreground">
            <Lightbulb className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            {group.tip}
          </p>
        )}
      </header>

      {group.headings && (
        <div className="rounded-xl bg-muted/60 p-3">
          <p className="mb-1 text-xs font-extrabold tracking-wide text-muted-foreground uppercase">List of Headings</p>
          <ul lang="en" className="flex flex-col gap-0.5 text-sm">
            {group.headings.map((heading) => (
              <li key={heading.id}>
                <span className="inline-block w-8 font-black">{heading.id}</span>
                {heading.text}
              </li>
            ))}
          </ul>
        </div>
      )}

      {group.options && group.kind !== "summary" && (
        <div className="rounded-xl bg-muted/60 p-3">
          <ul lang="en" className="flex flex-col gap-0.5 text-sm">
            {group.options.map((option) => (
              <li key={option.id}>
                <span className="inline-block w-6 font-black">{option.id}</span>
                {option.text}
              </li>
            ))}
          </ul>
        </div>
      )}

      {group.kind === "summary" && group.summary && group.options ? (
        <SummaryView
          group={group}
          startNumber={startNumber}
          answers={answers}
          onChange={onChange}
          review={review}
          visible={visible}
        />
      ) : (
        <ol className="flex flex-col gap-4">
          {questions.map(({ question, number }) => {
            const detail = review?.get(question.id);
            const value = answers[question.id] ?? null;
            return (
              <li key={question.id} className="flex gap-3">
                <QuestionNumber number={number} state={stateOf(review, question.id)} />
                <div className="min-w-0 flex-1">
                  {question.kind === "mcq" && (
                    <fieldset>
                      <legend lang="en" className="mb-2 font-semibold">
                        {question.prompt}
                      </legend>
                      <div className="flex flex-col gap-1.5">
                        {question.options.map((option, index) => {
                          const checked = value === index;
                          return (
                            <label
                              key={option}
                              className={cn(
                                "flex cursor-pointer items-start gap-2.5 rounded-xl border-2 px-3 py-2 text-sm transition-colors has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50",
                                checked ? "border-primary bg-secondary" : "border-border hover:border-primary/40",
                                locked && "cursor-default",
                              )}
                            >
                              <input
                                type="radio"
                                className="sr-only"
                                name={question.id}
                                data-question-id={question.id}
                                data-value={index}
                                checked={checked}
                                disabled={locked}
                                onChange={() => onChange(question.id, index)}
                              />
                              <span className="font-black">{String.fromCharCode(65 + index)}</span>
                              <span lang="en">{option}</span>
                            </label>
                          );
                        })}
                      </div>
                    </fieldset>
                  )}

                  {(question.kind === "tfng" || question.kind === "ynng") && (
                    <fieldset>
                      <legend lang="en" className="mb-2 font-semibold">
                        {question.statement}
                      </legend>
                      <div className="flex flex-wrap gap-2">
                        {JUDGEMENT_OPTIONS[question.kind].map((option) => {
                          const checked = value === option;
                          return (
                            <label
                              key={option}
                              className={cn(
                                "cursor-pointer rounded-xl border-2 px-3 py-1.5 text-sm font-extrabold transition-colors has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50",
                                checked ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/40",
                                locked && "cursor-default",
                              )}
                            >
                              <input
                                type="radio"
                                className="sr-only"
                                name={question.id}
                                data-question-id={question.id}
                                data-value={option}
                                checked={checked}
                                disabled={locked}
                                onChange={() => onChange(question.id, option)}
                              />
                              {option}
                            </label>
                          );
                        })}
                      </div>
                    </fieldset>
                  )}

                  {question.kind === "heading" && group.headings && (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold">Paragraph {question.paragraph}</span>
                      <SelectInput
                        questionId={question.id}
                        number={number}
                        value={value}
                        disabled={locked}
                        options={group.headings}
                        onChange={(next) => onChange(question.id, next)}
                        className="w-full sm:w-auto"
                      />
                    </div>
                  )}

                  {question.kind === "match" && group.options && (
                    <div className="flex flex-wrap items-center gap-2">
                      <span lang="en" className="font-bold">
                        {question.prompt}
                      </span>
                      <SelectInput
                        questionId={question.id}
                        number={number}
                        value={value}
                        disabled={locked}
                        options={group.options}
                        onChange={(next) => onChange(question.id, next)}
                      />
                    </div>
                  )}

                  {(question.kind === "sentence" || question.kind === "gap") && (
                    <GapInput
                      question={question}
                      number={number}
                      value={value}
                      disabled={locked}
                      onChange={(next) => onChange(question.id, next)}
                    />
                  )}

                  {detail && <ReviewBlock detail={detail} />}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

/** Summary Completion: текст с пропусками, в каждый выбирается слово из списка. */
function SummaryView({
  group,
  startNumber,
  answers,
  onChange,
  review,
  visible,
}: Omit<GroupProps, "showTip">) {
  const options = group.options ?? [];
  const numbers = new Map(group.questions.map((question, index) => [question.id, startNumber + index]));
  const parts = (group.summary ?? "").split(/(\{[^}]+\})/g);

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-xl bg-muted/60 p-3">
        <p className="mb-1 text-xs font-extrabold tracking-wide text-muted-foreground uppercase">Words</p>
        <ul lang="en" className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-sm sm:grid-cols-3">
          {options.map((option) => (
            <li key={option.id}>
              <span className="inline-block w-5 font-black">{option.id}</span>
              {option.text}
            </li>
          ))}
        </ul>
      </div>
      <p lang="en" className="leading-10">
        {parts.map((part, index) => {
          const match = part.match(/^\{([^}]+)\}$/);
          if (!match) return <span key={index}>{part}</span>;
          const id = match[1];
          const number = numbers.get(id) ?? 0;
          const state = stateOf(review, id);
          return (
            <span key={index} className="mx-0.5 inline-flex items-center gap-1 align-middle">
              <QuestionNumber number={number} state={state} />
              <SelectInput
                questionId={id}
                number={number}
                value={answers[id] ?? null}
                disabled={review !== null || (visible !== undefined && !visible.has(id))}
                options={options}
                onChange={(next) => onChange(id, next)}
                className="w-auto"
              />
            </span>
          );
        })}
      </p>
      {review &&
        group.questions
          .filter((question) => !visible || visible.has(question.id))
          .map((question) => {
            const detail = review.get(question.id);
            return detail ? (
              <div key={question.id} className="flex gap-3">
                <QuestionNumber number={numbers.get(question.id) ?? 0} state={stateOf(review, question.id)} />
                <div className="min-w-0 flex-1">
                  <ReviewBlock detail={detail} />
                </div>
              </div>
            ) : null;
          })}
    </div>
  );
}
