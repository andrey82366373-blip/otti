/**
 * Повтор запросов к ИИ при временных сбоях.
 * Повторяем только то, что может пройти со второго раза: тайм-аут, 429, 5xx, обрыв связи,
 * пустой ответ. Ошибки ключа (401/403), оплаты (402) и неверного запроса (400) не повторяем.
 */
import { randomUUID } from "node:crypto";

/** Короткий код запроса: его видит ученик, по нему владелец находит запись в журнале. */
export function newRequestId(): string {
  return randomUUID().replace(/-/g, "").slice(0, 8);
}

/** Код запроса от браузера: только буквы, цифры и дефис, не длиннее 64 символов. */
export function safeRequestId(value: unknown): string | null {
  return typeof value === "string" && /^[A-Za-z0-9-]{6,64}$/.test(value) ? value : null;
}

/**
 * Пауза перед повтором: растёт с каждой попыткой (≈0,8 с, ≈2 с, ≈4 с)
 * и немного «разбрасывается», чтобы повторы разных учеников не шли одновременно.
 */
export function backoffDelay(attempt: number, baseMs = 800): number {
  const exponential = baseMs * 2.5 ** Math.max(0, attempt - 1);
  const jitter = exponential * 0.25 * Math.random();
  return Math.round(Math.min(exponential + jitter, 8000));
}

export function wait(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        resolve();
      },
      { once: true },
    );
  });
}
