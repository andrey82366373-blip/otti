"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Mic, Square } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* Распознавание речи встроено в браузер (Chrome, Edge, Safari). Отдельный ключ не нужен. */

type RecognitionResult = { isFinal: boolean; 0: { transcript: string; confidence: number } };
type RecognitionEvent = Event & { results: ArrayLike<RecognitionResult> };
type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: Event & { error: string }) => void) | null;
  onend: (() => void) | null;
};
type RecognitionConstructor = new () => Recognition;

function getRecognition(): RecognitionConstructor | undefined {
  const scope = window as unknown as {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  };
  return scope.SpeechRecognition ?? scope.webkitSpeechRecognition;
}

const noop = () => () => {};

const ERROR_MESSAGES: Record<string, string> = {
  "not-allowed": "Разреши доступ к микрофону: значок замка или камеры в адресной строке браузера.",
  "service-not-allowed": "Браузер не разрешает распознавание речи. Попробуй Chrome или Safari.",
  "no-speech": "Ничего не слышно — попробуй ещё раз и говори ближе к микрофону.",
  "audio-capture": "Микрофон не найден. Проверь, что он подключён.",
  network: "Распознавание речи сейчас недоступно: нет связи с сервисом браузера.",
  "language-not-supported": "Браузер не умеет распознавать английскую речь.",
};

/** Распознанный фрагмент речи и уверенность распознавателя (0–1). */
export type RecognizedSegment = { text: string; confidence: number };

/** Кнопка «Сказать голосом»: распознанный английский текст попадает в поле сообщения. */
export function VoiceInputButton({
  disabled,
  getBaseText,
  onText,
  onError,
  onListeningChange,
  continuous = false,
  onSegment,
  size = "icon",
}: {
  disabled: boolean;
  /** Текст, который уже есть в поле, — к нему добавится сказанное. */
  getBaseText: () => string;
  onText: (text: string) => void;
  onError: (message: string) => void;
  onListeningChange: (listening: boolean) => void;
  /** Длинный ответ (Speaking): слушать, пока ученик сам не нажмёт «стоп». */
  continuous?: boolean;
  /** Готовые фрагменты с уверенностью распознавания — для осторожных подсказок о произношении. */
  onSegment?: (segment: RecognizedSegment) => void;
  size?: "icon" | "large";
}) {
  const supported = useSyncExternalStore(noop, () => Boolean(getRecognition()), () => false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<Recognition | null>(null);

  // Уходим со страницы — выключаем микрофон
  useEffect(() => () => recognitionRef.current?.abort(), []);

  if (!supported) return null;

  function update(value: boolean) {
    setListening(value);
    onListeningChange(value);
  }

  function toggle() {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const Constructor = getRecognition();
    if (!Constructor) return;

    const recognition = new Constructor();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = continuous;
    recognition.maxAlternatives = 1;

    const base = getBaseText().trim();
    const reported = new Set<number>();
    recognition.onresult = (event) => {
      let transcript = "";
      for (let index = 0; index < event.results.length; index += 1) {
        const result = event.results[index];
        transcript += `${result[0].transcript} `;
        if (result.isFinal && onSegment && !reported.has(index)) {
          reported.add(index);
          onSegment({ text: result[0].transcript.trim(), confidence: result[0].confidence });
        }
      }
      onText([base, transcript.replace(/\s+/g, " ").trim()].filter(Boolean).join(" "));
    };
    recognition.onerror = (event) => {
      if (event.error === "aborted") return;
      onError(ERROR_MESSAGES[event.error] ?? "Не удалось распознать речь. Попробуй ещё раз.");
    };
    recognition.onend = () => {
      recognitionRef.current = null;
      update(false);
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      update(true);
    } catch {
      onError("Не удалось включить микрофон. Попробуй ещё раз.");
    }
  }

  if (size === "large") {
    return (
      <Button
        type="button"
        size="lg"
        variant={listening ? "default" : "outline"}
        className={cn("gap-2", listening && "animate-pulse")}
        aria-pressed={listening}
        onClick={toggle}
        disabled={disabled && !listening}
      >
        {listening ? <Square aria-hidden /> : <Mic aria-hidden />}
        {listening ? "Остановить запись" : "Ответить голосом"}
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant={listening ? "default" : "outline"}
      size="icon"
      className={cn("size-11", listening && "animate-pulse")}
      aria-pressed={listening}
      aria-label={listening ? "Остановить запись" : "Сказать голосом по-английски"}
      title={listening ? "Остановить запись" : "Сказать голосом по-английски"}
      onClick={toggle}
      disabled={disabled && !listening}
    >
      {listening ? <Square aria-hidden /> : <Mic aria-hidden />}
    </Button>
  );
}
