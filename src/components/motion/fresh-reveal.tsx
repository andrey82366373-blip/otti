"use client";

import { useEffect, useState } from "react";

import { useFeedbackPrefs } from "@/components/motion/feedback-prefs";
import type { SoundName } from "@/lib/sounds";
import { cn } from "@/lib/utils";

function readSeen(key: string): Set<string> | null {
  try {
    const raw = window.localStorage.getItem(key);
    const list: unknown = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(list) ? list.filter((item): item is string => typeof item === "string") : []);
  } catch {
    return null;
  }
}

function markSeen(key: string, id: string) {
  try {
    const seen = readSeen(key) ?? new Set<string>();
    seen.add(id);
    window.localStorage.setItem(key, JSON.stringify([...seen].slice(-300)));
  } catch {
    // без хранилища анимация просто покажется ещё раз
  }
}

/**
 * Один раз «открывает» новый элемент: открытый урок, полученное достижение.
 * Что уже показано на этом устройстве — запоминается, повторно не анимируется.
 */
export function FreshReveal({
  storageKey,
  id,
  enabled = true,
  freshClassName,
  className,
  sound,
  badge,
  children,
}: {
  storageKey: string;
  id: string;
  /** false — элемент не новый (например, первый урок у нового ученика), просто запоминаем. */
  enabled?: boolean;
  /** Классы анимации для нового элемента. */
  freshClassName: string;
  className?: string;
  sound?: SoundName;
  /** Надпись-метка у нового элемента, например «Открыт!». */
  badge?: string;
  children: React.ReactNode;
}) {
  const { play } = useFeedbackPrefs();
  const [fresh, setFresh] = useState(false);

  useEffect(() => {
    const seen = readSeen(storageKey);
    if (!seen || seen.has(id)) return;
    markSeen(storageKey, id);
    if (!enabled) return;
    const frame = requestAnimationFrame(() => {
      setFresh(true);
      if (sound) play(sound);
    });
    return () => cancelAnimationFrame(frame);
  }, [storageKey, id, enabled, sound, play]);

  return (
    <span className={cn("relative", className, fresh && freshClassName)}>
      {children}
      {fresh && badge && (
        <span className="animate-pop absolute -top-2 -right-3 z-20 rounded-full bg-primary px-1.5 py-0.5 text-[10px] leading-none font-black text-primary-foreground shadow-sm">
          {badge}
        </span>
      )}
    </span>
  );
}
