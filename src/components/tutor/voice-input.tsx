"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Mic, Square } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* Распознавание речи встроено в браузер (Chrome, Edge, Safari). Отдельный ключ не нужен. */

type RecognitionResult = { isFinal: boolean; 0: { transcript: string } };
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

/** Кнопка «Сказать голосом»: распознанный английский текст попадает в поле сообщения. */
export function VoiceInputButton({
  disabled,
  getBaseText,
  onText,
  onError,
  onListeningChange,
}: {
  disabled: boolean;
  /** Текст, который уже есть в поле, — к нему добавится сказанное. */
  getBaseText: () => string;
  onText: (text: string) => void;
  onError: (message: string) => void;
  onListeningChange: (listening: boolean) => void;
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
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    const base = getBaseText().trim();
    recognition.onresult = (event) => {
      let transcript = "";
      for (let index = 0; index < event.results.length; index += 1) {
        transcript += event.results[index][0].transcript;
      }
      onText([base, transcript.trim()].filter(Boolean).join(" "));
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
