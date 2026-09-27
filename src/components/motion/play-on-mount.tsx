"use client";

import { useEffect } from "react";

import { useFeedbackPrefs } from "@/components/motion/feedback-prefs";
import type { SoundName } from "@/lib/sounds";

/** Проигрывает звук один раз при появлении (если звуки включены). */
export function PlayOnMount({ sound, delay = 0 }: { sound: SoundName; delay?: number }) {
  const { play } = useFeedbackPrefs();
  useEffect(() => {
    const timer = window.setTimeout(() => play(sound), delay);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- только при появлении
  }, []);
  return null;
}
