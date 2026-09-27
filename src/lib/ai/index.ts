/**
 * ИИ-модуль: единая точка для всех запросов к ИИ.
 * Проверяет выключатель и лимиты, выбирает провайдера, при сбое переходит на запасного
 * и учитывает расход. Ключи API читаются только здесь, на сервере.
 */
import "server-only";

import { getAiConfig, isProviderConfigured } from "@/lib/ai/config";
import { aiDay, getAiUsageToday, recordAiTokens, releaseAiRequest, reserveAiRequest } from "@/lib/ai/limits";
import { createGigaChatProvider } from "@/lib/ai/providers/gigachat";
import { createMockProvider } from "@/lib/ai/providers/mock";
import { createOpenRouterProvider } from "@/lib/ai/providers/openrouter";
import { createYandexProvider } from "@/lib/ai/providers/yandex";
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
  | "provider_failed";

/** Ошибка для показа ученику: понятный текст и, для владельца сайта, технические подробности. */
export class AiError extends Error {
  constructor(
    readonly code: AiErrorCode,
    readonly userMessage: string,
    readonly details?: string,
  ) {
    super(userMessage);
    this.name = "AiError";
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

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => {
      clearTimeout(timer);
      resolve();
    });
  });
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
      try {
        return await provider.complete(request, controller.signal);
      } catch (error) {
        // «Слишком много запросов» — ждём полторы секунды и пробуем ещё раз
        if (error instanceof AiProviderError && error.kind === "busy" && !controller.signal.aborted) {
          await sleep(1500, controller.signal);
          return await provider.complete(request, controller.signal);
        }
        throw error;
      }
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
  limit_user_minute: "Слишком много сообщений подряд. Подожди минуту и попробуй снова.",
  limit_user_day: "На сегодня лимит сообщений исчерпан. Завтра Отти снова на связи!",
  limit_global: "Отти сегодня много болтал и устал. Попробуй завтра — уроки и словарь работают как обычно.",
} as const;

/**
 * Отправляет сообщения ИИ и возвращает ответ.
 * userText — текст ученика: проверяется его длина.
 */
export async function askAi(input: {
  userId: string;
  purpose: AiPurpose;
  messages: ChatMessage[];
  userText?: string;
  maxTokens?: number;
  temperature?: number;
}): Promise<AskAiResult> {
  const config = getAiConfig();

  if (!config.enabled) {
    throw new AiError(
      "disabled",
      "ИИ-репетитор сейчас выключен. Уроки, словарь и ошибки работают как обычно.",
      "Выключен настройкой AI_ENABLED=false.",
    );
  }
  if (!config.provider || !isProviderConfigured(config.provider)) {
    throw new AiError(
      "not_configured",
      "ИИ-репетитор ещё не настроен.",
      config.provider
        ? `Для ${AI_PROVIDER_TITLES[config.provider]} не задан ключ.`
        : "Не задан ни один провайдер ИИ.",
    );
  }
  if (input.userText !== undefined && input.userText.length > config.limits.maxInputChars) {
    throw new AiError(
      "input_too_long",
      `Сообщение слишком длинное — не больше ${config.limits.maxInputChars} символов.`,
    );
  }

  const reservation = await reserveAiRequest(input.userId, config.limits);
  if (!reservation.ok) {
    throw new AiError(reservation.code, LIMIT_MESSAGES[reservation.code]);
  }

  const request: CompletionRequest = {
    messages: input.messages,
    maxTokens: Math.min(input.maxTokens ?? config.limits.maxOutputTokens, config.limits.maxOutputTokens),
    temperature: input.temperature ?? 0.7,
    purpose: input.purpose,
  };

  const chain = [config.provider, config.fallback].filter(
    (id): id is AiProviderId => id !== null && isProviderConfigured(id),
  );
  const failures: AiProviderError[] = [];
  const started = performance.now();

  for (const id of chain) {
    try {
      const result = await callProvider(id, request, config.timeoutMs);
      const text = cleanText(result.text);
      if (!text) {
        throw new AiProviderError(id, "bad_response", "пустой ответ");
      }
      await recordAiTokens(input.userId, reservation.day, result.tokensIn + result.tokensOut).catch(
        (error: unknown) => console.error("[ai] Не удалось записать расход токенов:", error),
      );
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
      // В журнал — только тип ошибки и ответ провайдера, без ключей
      console.error(`[ai] ${describeProviderError(providerError)}`);
      failures.push(providerError);
    }
  }

  await releaseAiRequest(input.userId, reservation.day).catch((error: unknown) =>
    console.error("[ai] Не удалось вернуть бронь запроса:", error),
  );
  throw new AiError(
    "provider_failed",
    "Отти не смог ответить. Попробуй ещё раз чуть позже.",
    failures.map(describeProviderError).join("\n"),
  );
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
