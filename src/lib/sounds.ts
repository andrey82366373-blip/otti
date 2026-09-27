/**
 * Звуки Отти. Создаются программно (Web Audio API) прямо в браузере:
 * никаких аудиофайлов и чужих записей. Тема — река: капли, «бульк», перезвон.
 * Громкость небольшая. Если браузер не поддерживает звук — просто тишина.
 */

export type SoundName = "correct" | "wrong" | "complete" | "achievement" | "streak" | "unlock" | "send";

type AudioContextClass = typeof AudioContext;

let context: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!context) {
    const Ctor: AudioContextClass | undefined =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: AudioContextClass }).webkitAudioContext;
    if (!Ctor) return null;
    try {
      context = new Ctor();
    } catch {
      return null;
    }
  }
  if (context.state === "suspended") void context.resume().catch(() => undefined);
  return context;
}

/** Одна нота: частота может «скользить» (как капля), громкость быстро нарастает и мягко затухает. */
function tone(
  ctx: AudioContext,
  output: AudioNode,
  options: {
    at: number;
    freq: number;
    to?: number;
    duration: number;
    type?: OscillatorType;
    volume?: number;
    glide?: number;
  },
) {
  const { at, freq, to, duration, type = "sine", volume = 0.18, glide = 0.08 } = options;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, at);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, at + glide);
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(volume, at + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
  osc.connect(gain).connect(output);
  osc.start(at);
  osc.stop(at + duration + 0.02);
}

const RECIPES: Record<SoundName, (ctx: AudioContext, out: AudioNode, t: number) => void> = {
  // Две «капли» вверх — ответ верный
  correct: (ctx, out, t) => {
    tone(ctx, out, { at: t, freq: 620, to: 930, duration: 0.16, volume: 0.16 });
    tone(ctx, out, { at: t + 0.09, freq: 880, to: 1320, duration: 0.24, volume: 0.14 });
  },
  // Мягкий низкий «бульк» вниз — без резкого «неправильно»
  wrong: (ctx, out, t) => {
    tone(ctx, out, { at: t, freq: 300, to: 190, duration: 0.26, type: "triangle", volume: 0.14, glide: 0.2 });
    tone(ctx, out, { at: t + 0.05, freq: 150, to: 120, duration: 0.22, volume: 0.08, glide: 0.18 });
  },
  // Пентатоника вверх, как перезвон воды — урок пройден
  complete: (ctx, out, t) => {
    [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((freq, index) =>
      tone(ctx, out, { at: t + index * 0.085, freq, duration: 0.5 - index * 0.04, type: "triangle", volume: 0.12 }),
    );
    tone(ctx, out, { at: t + 0.45, freq: 1567.98, duration: 0.6, volume: 0.06 });
  },
  // Искристый аккорд — достижение
  achievement: (ctx, out, t) => {
    [1046.5, 1318.5, 1567.98].forEach((freq, index) =>
      tone(ctx, out, { at: t + index * 0.05, freq, duration: 0.7, volume: 0.07 }),
    );
    tone(ctx, out, { at: t + 0.2, freq: 2093, to: 2349, duration: 0.5, volume: 0.05, glide: 0.3 });
  },
  // Тёплое «вжух» вверх — серия дней выросла
  streak: (ctx, out, t) => {
    tone(ctx, out, { at: t, freq: 330, to: 660, duration: 0.3, type: "triangle", volume: 0.12, glide: 0.25 });
    tone(ctx, out, { at: t + 0.18, freq: 990, duration: 0.35, volume: 0.08 });
  },
  // Короткий «щелчок» замка
  unlock: (ctx, out, t) => {
    tone(ctx, out, { at: t, freq: 1200, to: 900, duration: 0.07, type: "square", volume: 0.04, glide: 0.05 });
    tone(ctx, out, { at: t + 0.08, freq: 784, to: 1175, duration: 0.25, volume: 0.1 });
  },
  // Едва слышная «капля» при отправке сообщения
  send: (ctx, out, t) => {
    tone(ctx, out, { at: t, freq: 900, to: 1300, duration: 0.09, volume: 0.05, glide: 0.06 });
  },
};

export function playSound(name: SoundName) {
  const ctx = getContext();
  if (!ctx) return;
  try {
    const master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(ctx.destination);
    RECIPES[name](ctx, master, ctx.currentTime + 0.01);
  } catch {
    // звук — не главное: при любой ошибке просто молчим
  }
}
