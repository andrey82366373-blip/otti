"use client";

import { createContext, useCallback, useContext, useMemo, useState, useSyncExternalStore } from "react";

import { updateFeedbackPrefs } from "@/lib/actions/learning";
import { playSound, type SoundName } from "@/lib/sounds";

type FeedbackPrefs = {
  soundEnabled: boolean;
  /** Анимации уменьшены: в настройках Отти или в системе («Уменьшить движение»). */
  reduceMotion: boolean;
  /** Только настройка Отти (без системной) — для переключателя в профиле. */
  appReduceMotion: boolean;
  setSoundEnabled: (value: boolean) => void;
  setAppReduceMotion: (value: boolean) => void;
  play: (name: SoundName) => void;
};

const FeedbackPrefsContext = createContext<FeedbackPrefs | null>(null);

function subscribeMotion(callback: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

/** Включена ли в системе настройка «Уменьшить движение». */
export function useSystemReducedMotion() {
  return useSyncExternalStore(
    subscribeMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

/**
 * Настройки звука и анимаций для экранов приложения.
 * data-motion="reduced" на обёртке отключает CSS-анимации (см. globals.css).
 */
export function FeedbackPrefsProvider({
  soundEnabled: initialSound,
  reduceMotion: initialReduce,
  children,
}: {
  soundEnabled: boolean;
  reduceMotion: boolean;
  children: React.ReactNode;
}) {
  const [soundEnabled, setSound] = useState(initialSound);
  const [appReduceMotion, setReduce] = useState(initialReduce);
  const systemReduce = useSystemReducedMotion();

  const setSoundEnabled = useCallback((value: boolean) => {
    setSound(value);
    void updateFeedbackPrefs({ soundEnabled: value }).catch(() => undefined);
  }, []);
  const setAppReduceMotion = useCallback((value: boolean) => {
    setReduce(value);
    void updateFeedbackPrefs({ reduceMotion: value }).catch(() => undefined);
  }, []);
  const play = useCallback(
    (name: SoundName) => {
      if (soundEnabled) playSound(name);
    },
    [soundEnabled],
  );

  const value = useMemo(
    () => ({
      soundEnabled,
      reduceMotion: appReduceMotion || systemReduce,
      appReduceMotion,
      setSoundEnabled,
      setAppReduceMotion,
      play,
    }),
    [soundEnabled, appReduceMotion, systemReduce, setSoundEnabled, setAppReduceMotion, play],
  );

  return (
    <FeedbackPrefsContext.Provider value={value}>
      <div data-motion={appReduceMotion ? "reduced" : "full"} className="contents">
        {children}
      </div>
    </FeedbackPrefsContext.Provider>
  );
}

const FALLBACK: FeedbackPrefs = {
  soundEnabled: false,
  reduceMotion: false,
  appReduceMotion: false,
  setSoundEnabled: () => undefined,
  setAppReduceMotion: () => undefined,
  play: () => undefined,
};

/** Звуки и анимации. Вне обёртки (например, на странице входа) — без звука. */
export function useFeedbackPrefs(): FeedbackPrefs {
  return useContext(FeedbackPrefsContext) ?? FALLBACK;
}
