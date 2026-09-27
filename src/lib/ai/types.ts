/** Общие типы ИИ-модуля. Один формат сообщений для всех провайдеров. */

export type AiProviderId = "gigachat" | "openrouter" | "yandex" | "mock";

export const AI_PROVIDER_IDS: AiProviderId[] = ["gigachat", "openrouter", "yandex", "mock"];

export const AI_PROVIDER_TITLES: Record<AiProviderId, string> = {
  gigachat: "GigaChat",
  openrouter: "OpenRouter",
  yandex: "YandexGPT",
  mock: "Тестовый режим",
};

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

/**
 * Для чего запрос: ping — проверка связи, chat — реплика в чате, summary — итоги занятия,
 * check — проверка ответа в уроке, exam_writing / exam_speaking — проверка IELTS Writing и Speaking.
 */
export type AiPurpose = "ping" | "chat" | "summary" | "check" | "exam_writing" | "exam_speaking";

export type CompletionRequest = {
  messages: ChatMessage[];
  maxTokens: number;
  temperature: number;
  /** Настоящие провайдеры это поле не получают — оно нужно тестовому режиму. */
  purpose: AiPurpose;
};

export type CompletionResult = {
  text: string;
  model: string;
  tokensIn: number;
  tokensOut: number;
};

/** Провайдер ИИ: получает сообщения — возвращает ответ. */
export type AiProvider = {
  id: AiProviderId;
  /** Модель, которая указана в настройках. */
  model: string;
  complete: (request: CompletionRequest, signal: AbortSignal) => Promise<CompletionResult>;
};

/**
 * Почему провайдер не ответил:
 * auth — ключ не подошёл; quota — закончились токены или деньги; busy — слишком много запросов;
 * request — ошибка в запросе (например, неверное имя модели); server — сбой у провайдера;
 * network — нет связи (или не прошла проверка сертификата); timeout — не успел ответить.
 */
export type ProviderErrorKind =
  | "auth"
  | "quota"
  | "busy"
  | "request"
  | "server"
  | "network"
  | "timeout"
  | "bad_response";

/** Временные сбои, после которых есть смысл повторить запрос. */
const TRANSIENT_KINDS: ReadonlySet<ProviderErrorKind> = new Set(["busy", "server", "network", "timeout"]);

export class AiProviderError extends Error {
  /** Можно ли повторить запрос автоматически: да — при тайм-ауте, 429, 5xx и обрыве связи. */
  readonly retryable: boolean;

  constructor(
    readonly provider: AiProviderId,
    readonly kind: ProviderErrorKind,
    readonly details: string,
    readonly status?: number,
    /** Явно задать, временный ли сбой. По умолчанию — по типу ошибки. */
    retryable?: boolean,
  ) {
    super(`${provider}: ${kind}${status ? ` (${status})` : ""} — ${details}`);
    this.name = "AiProviderError";
    this.retryable = retryable ?? TRANSIENT_KINDS.has(kind);
  }
}
