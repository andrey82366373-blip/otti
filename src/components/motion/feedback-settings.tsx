"use client";

import { Sparkles, Volume2, VolumeX } from "lucide-react";

import { useFeedbackPrefs, useSystemReducedMotion } from "@/components/motion/feedback-prefs";
import { playSound } from "@/lib/sounds";
import { cn } from "@/lib/utils";

/** Переключатель «вкл/выкл» с подписью и пояснением. */
function Toggle({
  id,
  checked,
  onChange,
  title,
  description,
  icon: Icon,
}: {
  id: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  title: string;
  description: string;
  icon: typeof Volume2;
}) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="size-5 shrink-0 text-primary" aria-hidden />
      <div className="min-w-0 flex-1">
        <label htmlFor={id} className="block font-bold">
          {title}
        </label>
        <p id={`${id}-hint`} className="text-sm text-muted-foreground">
          {description}
        </p>
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-describedby={`${id}-hint`}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border-2 transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
          checked ? "border-primary bg-primary" : "border-border bg-muted",
        )}
      >
        <span
          aria-hidden
          className={cn(
            "inline-block size-5 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-[1.35rem]" : "translate-x-0.5",
          )}
        />
      </button>
    </div>
  );
}

/** Настройки звуков и анимаций для экрана профиля. */
export function FeedbackSettings() {
  const { soundEnabled, setSoundEnabled, appReduceMotion, setAppReduceMotion } = useFeedbackPrefs();
  const systemReduce = useSystemReducedMotion();

  return (
    <div className="flex flex-col gap-4">
      <Toggle
        id="sound-enabled"
        checked={soundEnabled}
        onChange={(value) => {
          setSoundEnabled(value);
          if (value) playSound("correct");
        }}
        title="Звуки"
        description="Короткие сигналы при правильном и неправильном ответе и в конце урока."
        icon={soundEnabled ? Volume2 : VolumeX}
      />
      <Toggle
        id="reduce-motion"
        checked={appReduceMotion}
        onChange={setAppReduceMotion}
        title="Уменьшить анимации"
        description={
          systemReduce
            ? "В системе уже включено «Уменьшить движение» — анимации и так отключены."
            : "Без покачиваний, конфетти и прыжков Отти. Удобно, если движение отвлекает."
        }
        icon={Sparkles}
      />
    </div>
  );
}

/** Маленькая кнопка «звук вкл/выкл» — в шапке урока и тренировок. */
export function SoundToggleButton({ className }: { className?: string }) {
  const { soundEnabled, setSoundEnabled } = useFeedbackPrefs();
  return (
    <button
      type="button"
      aria-pressed={soundEnabled}
      aria-label={soundEnabled ? "Выключить звуки" : "Включить звуки"}
      title={soundEnabled ? "Выключить звуки" : "Включить звуки"}
      onClick={() => setSoundEnabled(!soundEnabled)}
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50",
        className,
      )}
    >
      {soundEnabled ? <Volume2 className="size-5" aria-hidden /> : <VolumeX className="size-5" aria-hidden />}
    </button>
  );
}
