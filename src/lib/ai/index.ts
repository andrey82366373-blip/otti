/**
 * ИИ-модуль: единая точка для всех запросов к ИИ.
 * Проверяет выключатель и лимиты, выбирает провайдера, при сбое переходит на запасного
 * и учитывает расход. Ключи API читаются только здесь, на сервере.
 */
import "server-only";

import { getAiConfig, isProviderConfigured } from "@/lib/ai/config";
import { snippet } from "@/lib/ai/http";
import { aiDay, getAiUsageToday, recordAiTokens, releaseAiRequest, reserveAiRequest } from "@/lib/ai/limits";
import { createGigaChatProvider } from "@/lib/ai/providers/gigachat";
import { createMockProvider } from "@/lib/ai/providers/mock";
import { createOpenRouterProvider } from "@/lib/ai/providers/openrouter";
import { createYandexProvider } from "@/lib/ai/providers/yandex";
import { backoffDelay, newRequestId, wait } from "@/lib/ai/retry";
import {
  AI_PROVIDER_TITLES,
  AiProviderError,
  type AiProvider,
  type AiProviderId,
  type AiPurpose,
  type ChatMessage,
  type CompletionRequest,
  type CompletionResult,
} from "@/lib/ai/types";

export type AiErrorCode =
  | "disabled"
  | "not_configured"
  | "input_too_long"
  | "limit_user_minute"
  | "limit_user_day"
  | "limit_global"
  /** Провайдер отвечает «слишком много запросов» (429) даже после повторов. */
  | "provider_busy"
  /** Тайм-аут, 5xx или обрыв связи — даже после повторов. */
  | "provider_unavailable"
  /** Закончились токены или деньги у провайдера (402). */
  | "provider_quota"
  /** Ключ не подошёл, неверная модель или сертификат — нужна правка настроек. */
  | "provider_config"
  /** ИИ ответил, но не в ожидаемом формате. */
  | "bad_format";

/** Ошибка для показа ученику: понятный текст и, для владельца сайта, технические подробности. */
export class AiError extends Error {
  constructor(
    readonly code: AiErrorCode,
    readonly userMessage: string,
    readonly details?: string,
    readonly extra: { requestId?: string; retryAfterSec?: number } = {},
  ) {
    super(userMessage);
    this.name = "AiError";
  }

  /** Код запроса для ученика и журнала. */
  get requestId(): string | undefined {
    return this.extra.requestId;
  }

  /** Имеет ли смысл повторить тот же запрос чуть позже. */
  get retryable(): boolean {
    return (
      this.code === "provider_busy" ||
      this.code === "provider_unavailable" ||
      this.code === "bad_format" ||
      this.code === "limit_user_minute"
    );
  }
}

export type AskAiResult = {
  text: string;
  provider: AiProviderId;
  model: string;
  tokensIn: number;
  tokensOut: number;
  /** Сколько длился запрос, мс. */
  ms: number;
  /** Ответил запасной провайдер. */
  usedFallback: boolean;
};

function createProvider(id: AiProviderId): AiProvider {
  switch (id) {
    case "gigachat":
      return createGigaChatProvider();
    case "openrouter":
      return createOpenRouterProvider();
    case "yandex":
      return createYandexProvider();
    case "mock":
      return createMockProvider();
  }
}

/* ── Очередь: бесплатный GigaChat для физлиц отвечает только на один запрос за раз ── */

class Semaphore {
  private active = 0;
  private queue: (() => void)[] = [];

  constructor(private readonly max: number) {}

  async acquire(signal: AbortSignal, provider: AiProviderId): Promise<() => void> {
    if (this.active < this.max) {
      this.active += 1;
      return () => this.release();
    }
    await new Promise<void>((resolve, reject) => {
      const grant = () => {
        signal.removeEventListener("abort", onAbort);
        resolve();
      };
      const onAbort = () => {
        this.queue = this.queue.filter((item) => item !== grant);
        reject(new AiProviderError(provider, "timeout", "долго ждали очереди"));
      };
      this.queue.push(grant);
      signal.addEventListener("abort", onAbort, { once: true });
    });
    // Место передано напрямую от освободившего запроса — счётчик не меняется
    return () => this.release();
  }

  private release() {
    const next = this.queue.shift();
    if (next) next();
    else this.active -= 1;
  }
}

const semaphores = new Map<AiProviderId, Semaphore>();

function semaphoreFor(id: AiProviderId): Semaphore {
  let semaphore = semaphores.get(id);
  if (!semaphore) {
    const raw = Number.parseInt(process.env.GIGACHAT_MAX_CONCURRENCY ?? "", 10);
    const max = id === "gigachat" ? (Number.isFinite(raw) && raw > 0 ? raw : 1) : 10;
    semaphore = new Semaphore(max);
    semaphores.set(id, semaphore);
  }
  return semaphore;
}

async function callProvider(
  id: AiProviderId,
  request: CompletionRequest,
  timeoutMs: number,
): Promise<CompletionResult & { model: string }> {
  const provider = createProvider(id);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const release = await semaphoreFor(id).acquire(controller.signal, id);
    try {
      // Повторы при временных сбоях — в askAi: там общий бюджет времени и журнал попыток
      return await provider.complete(request, controller.signal);
    } finally {
      release();
    }
  } finally {
    clearTimeout(timer);
  }
}

/** Убирает служебные «размышления» некоторых моделей и лишние пробелы. */
function cleanText(text: string): string {
  return text
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .trim()
    .slice(0, 6000);
}

/** Понятное описание сбоя — для страницы /status и журнала. */
export function describeProviderError(error: AiProviderError): string {
  const title = AI_PROVIDER_TITLES[error.provider];
  const status = error.status ? ` (код ${error.status})` : "";
  const reasons: Record<AiProviderError["kind"], string> = {
    auth: "ключ не подошёл — проверьте, что он скопирован целиком",
    quota: "закончились бесплатные токены или деньги на счёте",
    busy: "слишком много запросов одновременно",
    request: "ошибка в запросе — проверьте название модели",
    server: "сбой на стороне провайдера",
    network: "нет связи с сервером",
    timeout: "не ответил вовремя",
    bad_response: "прислал непонятный ответ",
  };
  return `${title}: ${reasons[error.kind]}${status}. ${error.details}`;
}

const LIMIT_MESSAGES = {
  limit_user_minute: "Слишком много сообщений подряд. Отти ответит через минуту — сообщение отправится само.",
  limit_user_day: "На сегодня лимит сообщений исчерпан. Завтра Отти снова на связи!",
  limit_global: "Отти сегодня много болтал и устал. Попробуй завтра — уроки и словарь работают как обычно.",
} as const;

/** Итоговая ошибка после всех попыток: по самому «серьёзному» сбою. */
function finalError(failures: AiProviderError[], requestId: string): AiError {
  const details = failures.map(describeProviderError).join("\n");
  const extra = { requestId };
  const has = (kind: AiProviderError["kind"]) => failures.some((failure) => failure.kind === kind);
  const retryableOnly = failures.length > 0 && failures.every((failure) => failure.retryable);

  if (retryableOnly) {
    if (has("busy")) {
      return new AiError(
        "provider_busy",
        "Сервис ИИ сейчас перегружен запросами. Отти попробовал несколько раз — подожди полминуты и повтори.",
        details,
        extra,
      );
    }
    if (failures.every((failure) => failure.kind === "bad_response")) {
      return new AiError("bad_format", "Отти ответил неразборчиво. Попробуй отправить ещё раз.", details, extra);
    }
    return new AiError(
      "provider_unavailable",
      "Сервер ИИ временно недоступен. Отти попробовал несколько раз — повтори чуть позже.",
      details,
      extra,
    );
  }
  if (has("quota")) {
    return new AiError(
      "provider_quota",
      "У ИИ-репетитора закончились запросы у провайдера. Уроки, словарь и ошибки работают как обычно.",
      details,
      extra,
    );
  }
  return new AiError(
    "provider_config",
    "Отти временно недоступен: на сервере ошибка настроек ИИ. Уроки и словарь работают как обычно.",
    details,
    extra,
  );
}

/**
 * Отправляет сообщения ИИ и возвращает ответ.
 * userText — текст ученика: проверяется его длина.
 * validate — проверка формата ответа: если вернула false, ответ считается сбоем и запрос повторяется.
 * requestId — код запроса для журнала; если не передан, создаётся новый.
 */
export async function askAi(input: {
  userId: string;
  purpose: AiPurpose;
  messages: ChatMessage[];
  userText?: string;
  maxTokens?: number;
  temperature?: number;
  requestId?: string;
  validate?: (text: string) => boolean;
  /** Подробный ответ (проверка эссе): больше токенов и больше времени на попытку. */
  longOutput?: boolean;
}): Promise<AskAiResult> {
  const config = getAiConfig();
  const requestId = input.requestId ?? newRequestId();

  if (!config.enabled) {
    throw new AiError(
      "disabled",
      "ИИ-репетитор сейчас выключен. Уроки, словарь и ошибки работают как обычно.",
      "Выключен настройкой AI_ENABLED=false.",
      { requestId },
    );
  }
  if (!config.provider || !isProviderConfigured(config.provider)) {
    throw new AiError(
      "not_configured",
      "ИИ-репетитор ещё не настроен.",
      config.provider
        ? `Для ${AI_PROVIDER_TITLES[config.provider]} не задан ключ.`
        : "Не задан ни один провайдер ИИ.",
      { requestId },
    );
  }
  if (input.userText !== undefined && input.userText.length > config.limits.maxInputChars) {
    throw new AiError(
      "input_too_long",
      `Сообщение слишком длинное — не больше ${config.limits.maxInputChars} символов.`,
      undefined,
      { requestId },
    );
  }

  const reservation = await reserveAiRequest(input.userId, config.limits);
  if (!reservation.ok) {
    console.warn(`[ai] req=${requestId} ${input.purpose}: лимит ${reservation.code}`);
    throw new AiError(reservation.code, LIMIT_MESSAGES[reservation.code], undefined, {
      requestId,
      retryAfterSec: reservation.retryAfterSec,
    });
  }

  const tokenCap = input.longOutput ? config.limits.examMaxOutputTokens : config.limits.maxOutputTokens;
  const request: CompletionRequest = {
    messages: input.messages,
    maxTokens: Math.min(input.maxTokens ?? tokenCap, tokenCap),
    temperature: input.temperature ?? 0.7,
    purpose: input.purpose,
  };

  const chain = [config.provider, config.fallback].filter(
    (id): id is AiProviderId => id !== null && isProviderConfigured(id),
  );
  const failures: AiProviderError[] = [];
  const started = performance.now();
  // Длинный ответ (эссе) генерируется дольше: на попытку и на весь запрос даём в два раза больше времени
  const attemptTimeout = input.longOutput ? config.timeoutMs * 2 : config.timeoutMs;
  const deadline = Date.now() + (input.longOutput ? config.totalTimeoutMs * 2 : config.totalTimeoutMs);
  const attempts = 1 + (input.longOutput ? Math.min(1, config.maxRetries) : config.maxRetries);
  // Меньше этого времени на попытку не даём: всё равно не успеет
  const MIN_ATTEMPT_MS = 3000;

  providers: for (const id of chain) {
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      const remaining = deadline - Date.now();
      if (remaining < MIN_ATTEMPT_MS) break providers;
      const attemptStarted = performance.now();
      try {
        const result = await callProvider(id, request, Math.min(attemptTimeout, remaining));
        const text = cleanText(result.text);
        if (!text) {
          throw new AiProviderError(id, "bad_response", "пустой ответ", undefined, true);
        }
        if (input.validate && !input.validate(text)) {
          throw new AiProviderError(id, "bad_response", `ответ не в том формате: ${snippet(text)}`, undefined, true);
        }
        await recordAiTokens(input.userId, reservation.day, result.tokensIn + result.tokensOut).catch(
          (error: unknown) => console.error(`[ai] req=${requestId} Не удалось записать расход токенов:`, error),
        );
        if (failures.length > 0) {
          console.info(
            `[ai] req=${requestId} ${input.purpose}: ответ получен с попытки ${attempt} (${AI_PROVIDER_TITLES[id]}) после ${failures.length} сбоев`,
          );
        }
        return {
          text,
          provider: id,
          model: result.model,
          tokensIn: result.tokensIn,
          tokensOut: result.tokensOut,
          ms: Math.round(performance.now() - started),
          usedFallback: id !== config.provider,
        };
      } catch (error) {
        const providerError =
          error instanceof AiProviderError
            ? error
            : new AiProviderError(id, "bad_response", error instanceof Error ? error.message : String(error));
        failures.push(providerError);
        // В журнал — код запроса, попытка, тип ошибки и ответ провайдера. Ключи сюда не попадают.
        console.error(
          `[ai] req=${requestId} ${input.purpose} попытка ${attempt}/${attempts} (${Math.round(performance.now() - attemptStarted)} мс): ${describeProviderError(providerError)}`,
        );
        // Ошибку ключа, оплаты или запроса повторять бессмысленно — сразу к запасному провайдеру
        if (!providerError.retryable || attempt === attempts) continue providers;
        const delay = backoffDelay(attempt);
        if (Date.now() + delay + MIN_ATTEMPT_MS > deadline) continue providers;
        await wait(delay);
      }
    }
  }

  await releaseAiRequest(input.userId, reservation.day).catch((error: unknown) =>
    console.error(`[ai] req=${requestId} Не удалось вернуть бронь запроса:`, error),
  );
  if (failures.length === 0) {
    failures.push(new AiProviderError(config.provider, "timeout", "не хватило времени на попытку"));
  }
  const final = finalError(failures, requestId);
  console.error(`[ai] req=${requestId} ${input.purpose}: не удалось получить ответ (${final.code})`);
  throw final;
}

export type AiStatus = {
  enabled: boolean;
  provider: { id: AiProviderId; title: string; model: string; configured: boolean } | null;
  fallback: { id: AiProviderId; title: string; model: string; configured: boolean } | null;
  limits: ReturnType<typeof getAiConfig>["limits"];
  today: { globalRequests: number; globalTokens: number; day: string } | null;
};

/** Настройки и расход ИИ за сегодня — для страницы /status. Запрос к ИИ не отправляется. */
export async function getAiStatus(): Promise<AiStatus> {
  const config = getAiConfig();
  const describe = (id: AiProviderId | null) =>
    id
      ? {
          id,
          title: AI_PROVIDER_TITLES[id],
          model: createProvider(id).model,
          configured: isProviderConfigured(id),
        }
      : null;

  let today: AiStatus["today"] = null;
  try {
    const usage = await getAiUsageToday();
    today = { globalRequests: usage.globalRequests, globalTokens: usage.globalTokens, day: aiDay() };
  } catch {
    today = null;
  }

  return {
    enabled: config.enabled,
    provider: describe(config.provider),
    fallback: describe(config.fallback),
    limits: config.limits,
    today,
  };
}
