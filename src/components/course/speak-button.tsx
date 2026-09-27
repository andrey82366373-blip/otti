"use client";

import { useSyncExternalStore } from "react";
import { Volume2 } from "lucide-react";

import { cn } from "@/lib/utils";

const subscribe = () => () => {};

/** Есть ли в браузере синтез речи. */
function useSpeechSupported() {
  return useSyncExternalStore(
    subscribe,
    () => "speechSynthesis" in window,
    () => false,
  );
}

/** Произносит английский текст голосом браузера. */
export function speakEnglish(text: string) {
  if (!("speechSynthesis" in window)) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.9;
  const voice =
    synth.getVoices().find((item) => item.lang === "en-US") ??
    synth.getVoices().find((item) => item.lang.startsWith("en"));
  if (voice) utterance.voice = voice;
  synth.speak(utterance);
}

/** Кнопка «послушать». Если браузер не умеет говорить, кнопка не показывается. */
export function SpeakButton({ text, className }: { text: string; className?: string }) {
  const supported = useSpeechSupported();
  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={() => speakEnglish(text)}
      aria-label={`Послушать: ${text}`}
      title="Послушать"
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-primary transition-colors outline-none hover:bg-primary hover:text-primary-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50",
        className,
      )}
    >
      <Volume2 className="size-[18px]" aria-hidden />
    </button>
  );
}
