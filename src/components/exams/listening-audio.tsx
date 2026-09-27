"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { FileText, Pause, Play, RotateCcw, Volume2, VolumeX } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ScriptLine } from "@/content/ielts/types";
import { cn } from "@/lib/utils";

/* Озвучка записи голосом браузера (Web Speech API). Это учебная демонстрация, а не экзаменационное аудио. */

const FEMALE_HINTS = /female|woman|samantha|victoria|karen|moira|tessa|serena|zira|susan|hazel|libby|sonia|jenny|aria|fiona|kate/i;
const MALE_HINTS = /male|man\b|daniel|alex|fred|david|george|arthur|oliver|ryan|guy|thomas|mark|james/i;

function subscribeVoices(callback: () => void) {
  if (!("speechSynthesis" in window)) return () => {};
  window.speechSynthesis.addEventListener("voiceschanged", callback);
  return () => window.speechSynthesis.removeEventListener("voiceschanged", callback);
}

function voicesSnapshot(): string {
  if (!("speechSynthesis" in window)) return "unsupported";
  return window.speechSynthesis
    .getVoices()
    .filter((voice) => voice.lang.toLowerCase().startsWith("en"))
    .map((voice) => voice.name)
    .join("|");
}

/** Английские голоса браузера (строка имён — чтобы React видел изменения). */
function useEnglishVoiceNames(): string {
  return useSyncExternalStore(subscribeVoices, voicesSnapshot, () => "");
}

type VoicePick = { voice: SpeechSynthesisVoice | null; pitch: number };

/** Подбирает разные голоса для женских и мужских реплик; если голос один — меняет высоту. */
function pickVoices(): Record<ScriptLine["voice"], VoicePick> {
  const voices = window.speechSynthesis.getVoices().filter((voice) => voice.lang.toLowerCase().startsWith("en"));
  const british = voices.filter((voice) => /en[-_]gb/i.test(voice.lang));
  const pool = british.length >= 2 ? british : voices;
  const female = pool.find((voice) => FEMALE_HINTS.test(voice.name)) ?? null;
  const male = pool.find((voice) => MALE_HINTS.test(voice.name) && voice !== female) ?? null;
  const fallback = pool[0] ?? voices[0] ?? null;
  const second = pool.find((voice) => voice !== (female ?? fallback)) ?? null;
  return {
    female: female ? { voice: female, pitch: 1 } : { voice: fallback, pitch: 1.15 },
    male: male ? { voice: male, pitch: 1 } : second ? { voice: second, pitch: 1 } : { voice: fallback, pitch: 0.8 },
  };
}

/** Длинные реплики режем на предложения: некоторые браузеры обрывают длинную озвучку. */
function toChunks(script: ScriptLine[]) {
  return script.flatMap((line, lineIndex) =>
    (line.text.match(/[^.!?]+[.!?]+["')]?|[^.!?]+$/g) ?? [line.text]).map((text) => ({
      lineIndex,
      voice: line.voice,
      text: text.trim(),
    })),
  );
}

export type AudioStatus = "idle" | "playing" | "paused" | "finished";

export function ListeningAudio({
  script,
  examMode,
  onStatusChange,
  forceTranscript = false,
}: {
  script: ScriptLine[];
  /** Режим экзамена: запись звучит один раз, без паузы и повтора. */
  examMode: boolean;
  onStatusChange?: (status: AudioStatus) => void;
  /** Показать текст записи (после проверки). */
  forceTranscript?: boolean;
}) {
  const voiceNames = useEnglishVoiceNames();
  const supported = voiceNames !== "unsupported";
  const hasVoices = supported && voiceNames.length > 0;
  const [status, setStatus] = useState<AudioStatus>("idle");
  const [chunkIndex, setChunkIndex] = useState(0);
  const [rate, setRate] = useState(0.95);
  const [showTranscript, setShowTranscript] = useState(false);
  const chunks = useMemo(() => toChunks(script), [script]);
  const playingRef = useRef(false);
  const indexRef = useRef(0);

  const currentLine = status === "idle" ? -1 : chunks[Math.min(chunkIndex, chunks.length - 1)]?.lineIndex ?? -1;

  const update = useCallback(
    (next: AudioStatus) => {
      setStatus(next);
      onStatusChange?.(next);
    },
    [onStatusChange],
  );

  const speakFrom = useCallback(
    (start: number) => {
      const synth = window.speechSynthesis;
      synth.cancel();
      const picks = pickVoices();
      playingRef.current = true;
      const speakChunk = (index: number) => {
        if (!playingRef.current) return;
        if (index >= chunks.length) {
          playingRef.current = false;
          indexRef.current = 0;
          setChunkIndex(0);
          update("finished");
          return;
        }
        indexRef.current = index;
        setChunkIndex(index);
        const chunk = chunks[index];
        const utterance = new SpeechSynthesisUtterance(chunk.text);
        const pick = picks[chunk.voice];
        utterance.lang = pick.voice?.lang ?? "en-GB";
        if (pick.voice) utterance.voice = pick.voice;
        utterance.pitch = pick.pitch;
        utterance.rate = rate;
        // Пауза между репликами разных людей — как в записи
        const next = chunks[index + 1];
        const gap = next && next.lineIndex !== chunk.lineIndex ? 350 : 60;
        utterance.onend = () => window.setTimeout(() => speakChunk(index + 1), gap);
        utterance.onerror = (event) => {
          if (event.error === "interrupted" || event.error === "canceled") return;
          window.setTimeout(() => speakChunk(index + 1), gap);
        };
        synth.speak(utterance);
      };
      update("playing");
      speakChunk(start);
    },
    [chunks, rate, update],
  );

  // Уходим со страницы — останавливаем озвучку
  useEffect(
    () => () => {
      playingRef.current = false;
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    },
    [],
  );

  function pause() {
    playingRef.current = false;
    window.speechSynthesis.cancel();
    update("paused");
  }

  const transcriptVisible = forceTranscript || showTranscript || !hasVoices;
  const canPlay = hasVoices && (!examMode || status === "idle");

  return (
    <div className="flex flex-col gap-3 rounded-2xl border-2 bg-card p-4">
      <p className="flex items-start gap-2 rounded-xl bg-river-soft px-3 py-2 text-xs font-semibold text-river">
        <Volume2 className="mt-0.5 size-4 shrink-0" aria-hidden />
        Учебная демонстрация: запись озвучивает синтезатор речи вашего браузера. Это не настоящее экзаменационное
        аудио — темп, акценты и паузы отличаются.
      </p>

      {!hasVoices && (
        <p role="status" className="flex items-start gap-2 text-sm font-semibold text-muted-foreground">
          <VolumeX className="mt-0.5 size-4 shrink-0" aria-hidden />
          {supported
            ? "В этом браузере нет английского голоса для озвучки. Прочитай текст записи ниже — так тоже можно тренироваться."
            : "Этот браузер не умеет озвучивать текст. Прочитай текст записи ниже или открой задание в Chrome, Edge или Safari."}
        </p>
      )}

      {hasVoices && (
        <div className="flex flex-wrap items-center gap-2">
          {status === "playing" ? (
            examMode ? (
              <Button type="button" size="lg" disabled>
                <Volume2 aria-hidden />
                Идёт запись…
              </Button>
            ) : (
              <Button type="button" size="lg" onClick={pause}>
                <Pause aria-hidden />
                Пауза
              </Button>
            )
          ) : (
            <Button
              type="button"
              size="lg"
              onClick={() => speakFrom(status === "paused" ? indexRef.current : 0)}
              disabled={!canPlay && status !== "paused"}
            >
              <Play aria-hidden />
              {status === "paused" ? "Продолжить" : status === "finished" ? "Слушать ещё раз" : "Слушать запись"}
            </Button>
          )}
          {!examMode && status !== "idle" && (
            <Button type="button" variant="outline" size="lg" onClick={() => speakFrom(0)}>
              <RotateCcw aria-hidden />
              Сначала
            </Button>
          )}
          {!examMode && (
            <label className="flex items-center gap-2 text-sm font-bold">
              Скорость
              <select
                value={rate}
                onChange={(event) => setRate(Number(event.target.value))}
                disabled={status === "playing"}
                className="h-10 rounded-lg border-2 bg-card px-2 font-bold"
              >
                <option value={0.8}>медленно</option>
                <option value={0.95}>обычно</option>
                <option value={1.1}>быстрее</option>
              </select>
            </label>
          )}
          {examMode && status === "finished" && (
            <span className="text-sm font-bold text-muted-foreground">Запись прослушана. В режиме экзамена — один раз.</span>
          )}
        </div>
      )}

      {hasVoices && status !== "idle" && (
        <div className="h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
          <div
            className="h-full rounded-full bg-river transition-[width] duration-300"
            style={{ width: `${status === "finished" ? 100 : Math.round((chunkIndex / chunks.length) * 100)}%` }}
          />
        </div>
      )}

      {hasVoices && !examMode && !forceTranscript && (
        <button
          type="button"
          onClick={() => setShowTranscript((value) => !value)}
          aria-expanded={showTranscript}
          className="flex items-center gap-1.5 self-start rounded-lg px-1 py-0.5 text-sm font-bold text-primary outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <FileText className="size-4" aria-hidden />
          {showTranscript ? "Скрыть текст записи" : "Показать текст записи"}
        </button>
      )}

      {transcriptVisible && (
        <div className="flex max-h-80 flex-col gap-1.5 overflow-y-auto rounded-xl bg-muted/50 p-3 text-sm">
          {script.map((line, index) => (
            <p key={index} lang="en" className={cn(index === currentLine && "rounded bg-xp/20")}>
              <span className="font-extrabold">{line.speaker}:</span> {line.text}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
