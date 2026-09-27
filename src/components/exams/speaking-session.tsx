"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CircleCheck,
  Keyboard,
  Lightbulb,
  LoaderCircle,
  Mic,
  MessageCircleQuestion,
  Sparkles,
  Volume2,
} from "lucide-react";

import { SpeakButton, speakEnglish } from "@/components/course/speak-button";
import { AiDisclaimer, BandBadge, InfoNote, TimerDisplay, useElapsed } from "@/components/exams/exam-ui";
import { useFeedbackPrefs } from "@/components/motion/feedback-prefs";
import { VoiceInputButton, type RecognizedSegment } from "@/components/tutor/voice-input";
import { Button } from "@/components/ui/button";
import { checkSpeaking, getCheckStatus } from "@/lib/actions/exams";
import { countWords, formatBand } from "@/lib/exams/ielts";
import type { CriterionScore, SpeakingFeedback } from "@/lib/exams/types";
import { cn } from "@/lib/utils";

export type SpeakingTaskView = {
  id: string;
  part: 1 | 2 | 3;
  topic: string;
  questions: string[];
  cueCard?: { prompt: string; points: string[]; closing: string };
  prepSeconds: number;
  answerSeconds: number;
  ideas: string[];
};

type Phase = "intro" | "prep" | "answer" | "review";

const noop = () => () => {};

/** Есть ли в браузере распознавание речи. */
function useRecognitionSupported() {
  return useSyncExternalStore(
    noop,
    () => {
      const scope = window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown };
      return Boolean(scope.SpeechRecognition ?? scope.webkitSpeechRecognition);
    },
    () => false,
  );
}

function storageKey(taskId: string) {
  return `otti:ielts-speaking:${taskId}`;
}

/** Часть Speaking: подготовка, ответы голосом или текстом, расшифровка и разбор ИИ. */
export function SpeakingSession({
  task,
  initialFeedback,
  pendingCheckId,
  remaining: initialRemaining,
  limit,
  backHref,
  embedded = false,
  onChecked,
}: {
  task: SpeakingTaskView;
  initialFeedback: SpeakingFeedback | null;
  pendingCheckId: string | null;
  remaining: number;
  limit: number;
  backHref: string;
  embedded?: boolean;
  onChecked?: (feedback: SpeakingFeedback | null) => void;
}) {
  const router = useRouter();
  const { play } = useFeedbackPrefs();
  const recognitionSupported = useRecognitionSupported();
  const prompts = task.cueCard ? [task.cueCard.prompt] : task.questions;
  const [phase, setPhase] = useState<Phase>(initialFeedback || pendingCheckId ? "review" : "intro");
  const [inputMode, setInputMode] = useState<"voice" | "text">("text");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>(() => prompts.map(() => ""));
  const [notes, setNotes] = useState("");
  const [usedVoice, setUsedVoice] = useState(false);
  const [segments, setSegments] = useState<RecognizedSegment[]>([]);
  const [listening, setListening] = useState(false);
  const [feedback, setFeedback] = useState<SpeakingFeedback | null>(initialFeedback);
  const [checking, setChecking] = useState(Boolean(pendingCheckId));
  const [pendingId, setPendingId] = useState<string | null>(pendingCheckId);
  const [remaining, setRemaining] = useState(initialRemaining);
  const [message, setMessage] = useState<{ text: string; requestId?: string } | null>(null);
  const [restored, setRestored] = useState(false);
  const checkingRef = useRef(false);

  const prepElapsed = useElapsed(phase === "prep");
  const answerElapsed = useElapsed(phase === "answer");
  const totalWords = countWords(answers.join(" "));

  // Ответы переживают обновление страницы
  useEffect(() => {
    if (restored) return;
    let saved: { answers?: unknown } | null = null;
    try {
      const raw = window.localStorage.getItem(storageKey(task.id));
      saved = raw ? (JSON.parse(raw) as { answers?: unknown }) : null;
    } catch {
      saved = null;
    }
    queueMicrotask(() => {
      setRestored(true);
      const list = saved?.answers;
      if (Array.isArray(list) && list.length === prompts.length && list.some((item) => typeof item === "string" && item.trim())) {
        setAnswers(list.map((item) => (typeof item === "string" ? item : "")));
        if (!initialFeedback && !pendingCheckId) setPhase("answer");
      }
    });
  }, [initialFeedback, pendingCheckId, prompts.length, restored, task.id]);

  useEffect(() => {
    try {
      if (answers.some((item) => item.trim())) {
        window.localStorage.setItem(storageKey(task.id), JSON.stringify({ answers }));
      }
    } catch {
      // без хранилища — ответы только в этой вкладке
    }
  }, [answers, task.id]);

  // Время на подготовку в Part 2 вышло — переходим к ответу
  useEffect(() => {
    if (phase === "prep" && prepElapsed >= task.prepSeconds) queueMicrotask(() => setPhase("answer"));
  }, [phase, prepElapsed, task.prepSeconds]);

  // Проверка уже идёт — ждём результат
  useEffect(() => {
    if (!pendingId) return;
    let cancelled = false;
    const startedAt = Date.now();
    const poll = async () => {
      if (cancelled) return;
      try {
        const status = await getCheckStatus({ checkId: pendingId });
        if (cancelled) return;
        if (status.status === "done" && status.speaking) {
          setFeedback(status.speaking);
          setPendingId(null);
          setChecking(false);
          setPhase("review");
          return;
        }
        if (status.status === "missing" || Date.now() - startedAt > 3 * 60 * 1000) {
          setPendingId(null);
          setChecking(false);
          setMessage({ text: "Проверка не завершилась. Нажми «Проверить ответы» ещё раз." });
          return;
        }
      } catch {
        // нет связи — повторим
      }
      window.setTimeout(poll, 3000);
    };
    const timer = window.setTimeout(poll, 2000);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [pendingId]);

  function startAnswering(mode: "voice" | "text") {
    setInputMode(mode);
    setIndex(0);
    setPhase(task.part === 2 ? "prep" : "answer");
    if (task.part !== 2) speakEnglish(prompts[0]);
  }

  function setAnswer(value: string) {
    setAnswers((list) => list.map((item, position) => (position === index ? value : item)));
  }

  async function check() {
    if (checkingRef.current) return;
    checkingRef.current = true;
    setChecking(true);
    setMessage(null);
    const confident = segments.filter((segment) => segment.confidence > 0);
    const average = confident.length > 0 ? confident.reduce((sum, item) => sum + item.confidence, 0) / confident.length : null;
    try {
      const result = await checkSpeaking({
        taskId: task.id,
        answers: prompts.map((question, position) => ({ question, answer: answers[position] ?? "" })).filter((item) => item.answer.trim()),
        mode: usedVoice ? "voice" : "text",
        unclearFragments: confident.filter((segment) => segment.confidence < 0.6).map((segment) => segment.text.slice(0, 100)).slice(0, 12),
        recognitionConfidence: usedVoice && average !== null ? Math.round(average * 100) / 100 : null,
      });
      if (result.ok) {
        setFeedback(result.feedback);
        setRemaining(result.remaining);
        setPhase("review");
        setChecking(false);
        play("complete");
        onChecked?.(result.feedback);
        if (!embedded) router.refresh();
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      if (result.code === "pending" && result.checkId) {
        setPendingId(result.checkId);
        setMessage({ text: result.error });
        return;
      }
      setChecking(false);
      setMessage({ text: result.error, requestId: result.requestId });
    } catch {
      setChecking(false);
      setMessage({ text: "Нет связи с сервером. Ответы сохранены на этом устройстве — попробуй ещё раз." });
    } finally {
      checkingRef.current = false;
    }
  }

  function restart() {
    setAnswers(prompts.map(() => ""));
    setSegments([]);
    setUsedVoice(false);
    setFeedback(null);
    setIndex(0);
    setPhase("intro");
    try {
      window.localStorage.removeItem(storageKey(task.id));
    } catch {
      // нечего удалять
    }
  }

  const header = !embedded && (
    <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-3xl items-center gap-2 px-3 py-2 sm:px-4">
        <Button asChild variant="ghost" size="icon" aria-label="К списку заданий">
          <Link href={backHref}>
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <h1 lang="en" className="truncate text-base font-extrabold">
            Speaking Part {task.part}: {task.topic}
          </h1>
          <p className="text-xs text-muted-foreground">
            {phase === "review" ? "Разбор ответов" : `Проверок сегодня: ${remaining} из ${limit}`}
          </p>
        </div>
        {phase === "prep" && <TimerDisplay elapsed={prepElapsed} limitSeconds={task.prepSeconds} />}
        {phase === "answer" && (
          <TimerDisplay
            elapsed={answerElapsed}
            limitSeconds={task.part === 2 ? task.answerSeconds : null}
          />
        )}
      </div>
    </header>
  );

  return (
    <div className={cn(!embedded && "min-h-dvh pb-16")}>
      {header}
      <main className={cn("mx-auto flex w-full max-w-3xl flex-col gap-5", !embedded && "px-4 pt-5")}>
        {phase === "intro" && (
          <section className="animate-card-in flex flex-col gap-4">
            {task.cueCard ? (
              <CueCard card={task.cueCard} />
            ) : (
              <div className="rounded-2xl border-2 bg-card p-4">
                <p className="text-sm font-bold text-muted-foreground">
                  Экзаменатор задаст {prompts.length} вопроса. Отвечай развёрнуто: 2–4 предложения
                  {task.part === 3 ? ", с причиной и примером" : ""}.
                </p>
              </div>
            )}
            <div className="rounded-2xl bg-secondary/60 p-4">
              <p className="mb-1 flex items-center gap-1.5 font-extrabold">
                <Lightbulb className="size-4" aria-hidden />
                Идеи и полезные фразы
              </p>
              <ul lang="en" className="list-disc space-y-1 pl-5 text-sm">
                {task.ideas.map((idea) => (
                  <li key={idea}>{idea}</li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              {recognitionSupported && (
                <Button type="button" size="lg" onClick={() => startAnswering("voice")}>
                  <Mic aria-hidden />
                  Отвечать голосом
                </Button>
              )}
              <Button type="button" size="lg" variant={recognitionSupported ? "outline" : "default"} onClick={() => startAnswering("text")}>
                <Keyboard aria-hidden />
                Отвечать текстом
              </Button>
            </div>
            {!recognitionSupported && (
              <InfoNote>
                Этот браузер не умеет распознавать речь. Отвечай текстом — или открой задание в Chrome, Edge или Safari.
              </InfoNote>
            )}
            <InfoNote>
              Голос распознаёт браузер, а Отти разбирает текст расшифровки. Поэтому точно оценить произношение нельзя —
              будут только осторожные подсказки.
            </InfoNote>
          </section>
        )}

        {phase === "prep" && task.cueCard && (
          <section className="flex flex-col gap-4">
            <CueCard card={task.cueCard} />
            <p className="font-bold">Минута на подготовку: запиши ключевые слова, а не целые предложения.</p>
            <label htmlFor="speaking-notes" className="sr-only">
              Заметки для подготовки
            </label>
            <textarea
              id="speaking-notes"
              lang="en"
              rows={4}
              value={notes}
              onChange={(event) => setNotes(event.target.value.slice(0, 1000))}
              placeholder="Notes…"
              className="w-full rounded-2xl border-2 bg-card p-3 outline-none focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-ring/25"
            />
            <Button type="button" size="lg" onClick={() => setPhase("answer")} className="sm:self-start">
              Начать отвечать
              <ArrowRight aria-hidden />
            </Button>
          </section>
        )}

        {phase === "answer" && (
          <section className="flex flex-col gap-4">
            {task.cueCard ? (
              <>
                <CueCard card={task.cueCard} />
                {notes && (
                  <p lang="en" className="rounded-xl bg-muted px-3 py-2 text-sm whitespace-pre-wrap">
                    {notes}
                  </p>
                )}
              </>
            ) : (
              <div className="animate-card-in flex flex-col gap-2 rounded-2xl border-2 bg-card p-4" key={index}>
                <p className="text-xs font-extrabold tracking-wide text-muted-foreground uppercase">
                  Вопрос {index + 1} из {prompts.length}
                </p>
                <div className="flex items-start gap-2">
                  <MessageCircleQuestion className="mt-1 size-5 shrink-0 text-primary" aria-hidden />
                  <p lang="en" className="flex-1 text-lg font-bold">
                    {prompts[index]}
                  </p>
                  <SpeakButton text={prompts[index]} className="size-9" />
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label htmlFor="speaking-answer" className="font-extrabold">
                {inputMode === "voice" ? "Расшифровка ответа (можно поправить)" : "Твой ответ"}
              </label>
              <textarea
                id="speaking-answer"
                lang="en"
                rows={task.part === 2 ? 9 : 5}
                value={answers[index] ?? ""}
                onChange={(event) => setAnswer(event.target.value.slice(0, 4000))}
                placeholder={inputMode === "voice" ? "Нажми «Ответить голосом» и говори по-английски…" : "Type your answer in English…"}
                className="w-full rounded-2xl border-2 bg-card p-3 text-base outline-none focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-ring/25"
              />
              <div className="flex flex-wrap items-center justify-between gap-2">
                {inputMode === "voice" && (
                  <VoiceInputButton
                    size="large"
                    continuous
                    disabled={checking}
                    getBaseText={() => answers[index] ?? ""}
                    onText={(value) => {
                      setAnswer(value.slice(0, 4000));
                      setUsedVoice(true);
                    }}
                    onSegment={(segment) => setSegments((list) => [...list, segment].slice(-80))}
                    onError={(text) => setMessage({ text })}
                    onListeningChange={setListening}
                  />
                )}
                <span className="text-sm font-bold text-muted-foreground tabular-nums">
                  Слов: {countWords(answers[index] ?? "")}
                  {listening && " · слушаю…"}
                </span>
              </div>
            </div>

            {message && (
              <p role="alert" className="rounded-xl bg-destructive-soft px-3 py-2 text-sm font-semibold text-destructive">
                {message.text}
                {message.requestId && <span className="block text-xs font-normal">Код ошибки: {message.requestId}</span>}
              </p>
            )}

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              {!task.cueCard && index > 0 && (
                <Button type="button" variant="outline" size="lg" onClick={() => setIndex((value) => value - 1)}>
                  <ArrowLeft aria-hidden />
                  Предыдущий
                </Button>
              )}
              {!task.cueCard && index < prompts.length - 1 ? (
                <Button
                  type="button"
                  size="lg"
                  onClick={() => {
                    setIndex((value) => value + 1);
                    speakEnglish(prompts[index + 1]);
                  }}
                >
                  Следующий вопрос
                  <ArrowRight aria-hidden />
                </Button>
              ) : (
                <Button type="button" size="lg" onClick={() => void check()} disabled={checking || totalWords < 15 || listening}>
                  {checking ? <LoaderCircle className="animate-spin" aria-hidden /> : <Sparkles aria-hidden />}
                  {checking ? "Отти разбирает ответ…" : "Проверить ответы"}
                </Button>
              )}
            </div>
            {!task.cueCard && (
              <p className="text-sm text-muted-foreground">
                Отвечено: {answers.filter((item) => item.trim()).length} из {prompts.length}. На экзамене на вопрос Part{" "}
                {task.part} обычно отвечают {task.part === 1 ? "20–30 секунд" : "40–60 секунд"}.
              </p>
            )}
          </section>
        )}

        {phase === "review" && checking && !feedback && (
          <p role="status" className="flex items-center gap-2 font-bold">
            <LoaderCircle className="size-5 animate-spin" aria-hidden />
            Отти разбирает ответы…
          </p>
        )}

        {phase === "review" && feedback && (
          <>
            <SpeakingFeedbackView feedback={feedback} />
            {!embedded && (
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button type="button" size="lg" onClick={restart}>
                  Ответить ещё раз
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href={backHref}>К другим темам</Link>
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function CueCard({ card }: { card: { prompt: string; points: string[]; closing: string } }) {
  return (
    <div lang="en" className="animate-card-in rounded-2xl border-2 border-primary/40 bg-card p-4">
      <p className="text-lg font-black">{card.prompt}</p>
      <p className="mt-2 text-sm font-bold text-muted-foreground">You should say:</p>
      <ul className="list-disc pl-5">
        {card.points.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>
      <p className="mt-1">{card.closing}</p>
    </div>
  );
}

function Criterion({ title, score }: { title: string; score: CriterionScore }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border-2 bg-card p-3">
      <div className="flex items-baseline justify-between gap-2">
        <p lang="en" className="text-sm font-extrabold">
          {title}
        </p>
        <p className="text-xl font-black tabular-nums">≈ {formatBand(score.band)}</p>
      </div>
      <p className="text-sm text-muted-foreground">{score.comment}</p>
    </div>
  );
}

/** Разбор ответа Speaking. */
export function SpeakingFeedbackView({ feedback }: { feedback: SpeakingFeedback }) {
  return (
    <section className="animate-card-in flex flex-col gap-4" aria-labelledby="speaking-feedback-title">
      <h2 id="speaking-feedback-title" className="text-xl font-black">
        Разбор от Отти
      </h2>
      <AiDisclaimer />
      <div className="rounded-2xl border-2 bg-card p-4">
        <p className="text-xs font-extrabold tracking-wide text-muted-foreground uppercase">Примерный балл</p>
        {feedback.overall ? (
          <BandBadge estimate={feedback.overall} size="lg" />
        ) : (
          <p className="mt-1 text-sm font-semibold">
            Для оценки в баллах нужно больше материала ({feedback.wordCount} слов). Отвечай развёрнуто — и оценка
            появится.
          </p>
        )}
      </div>
      <div className="grid gap-2.5 sm:grid-cols-3">
        <Criterion title="Fluency and Coherence" score={feedback.fluency} />
        <Criterion title="Lexical Resource" score={feedback.lexical} />
        <Criterion title="Grammatical Range and Accuracy" score={feedback.grammar} />
      </div>
      <div className="rounded-2xl bg-secondary/60 p-4 text-sm">
        <p className="mb-1 flex items-center gap-1.5 font-extrabold">
          <Volume2 className="size-4" aria-hidden />
          Произношение
        </p>
        {feedback.pronunciationNote ? (
          <>
            <p>{feedback.pronunciationNote}</p>
            <p className="mt-1 text-muted-foreground">
              Это предположение по автоматическому распознаванию речи, а не оценка произношения.
            </p>
          </>
        ) : (
          <p className="text-muted-foreground">
            {feedback.mode === "text"
              ? "Ответ был текстом — произношение не оценивается."
              : "Данных недостаточно: по расшифровке точно оценить произношение нельзя, поэтому балла за него нет."}
          </p>
        )}
      </div>
      {feedback.structure && (
        <div className="rounded-xl border-2 bg-card p-3 text-sm">
          <p className="mb-1 font-extrabold">Структура ответа</p>
          <p>{feedback.structure}</p>
        </div>
      )}
      {feedback.corrections.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="font-extrabold">Исправления</p>
          <ul className="flex flex-col gap-2">
            {feedback.corrections.map((item, position) => (
              <li key={`${item.quote}-${position}`} className="rounded-xl border-2 bg-card p-3 text-sm">
                <p lang="en">
                  <span className="line-through decoration-destructive/70">{item.quote}</span> →{" "}
                  <span className="font-bold">{item.correction}</span>
                </p>
                <p className="text-muted-foreground">{item.explanation}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
      {feedback.improvedAnswer && (
        <div className="rounded-xl border-2 border-success/40 bg-success-soft/50 p-3">
          <div className="mb-1 flex items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 font-extrabold">
              <CircleCheck className="size-4 text-success" aria-hidden />
              Как можно ответить лучше
            </p>
            <SpeakButton text={feedback.improvedAnswer} className="size-8" />
          </div>
          <p lang="en" className="text-sm whitespace-pre-wrap">
            {feedback.improvedAnswer}
          </p>
        </div>
      )}
      {feedback.followUp.length > 0 && (
        <div className="rounded-xl border-2 bg-card p-3">
          <p className="mb-1 font-extrabold">Экзаменатор может спросить ещё</p>
          <p className="mb-2 text-xs text-muted-foreground">Ответь на эти вопросы вслух — так тренируется беглость.</p>
          <ul className="flex flex-col gap-1.5">
            {feedback.followUp.map((question) => (
              <li key={question} className="flex items-center gap-2 text-sm">
                <SpeakButton text={question} className="size-7" />
                <span lang="en">{question}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {feedback.tips.length > 0 && (
        <ul className="list-disc space-y-1 pl-5 text-sm">
          {feedback.tips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
