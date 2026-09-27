/**
 * GigaChat (Сбер). Вход по «ключу авторизации»: сначала получаем токен доступа (живёт 30 минут),
 * потом отправляем запрос с этим токеном. Соединение проверяется сертификатом Минцифры.
 */
import "server-only";

import { randomUUID } from "node:crypto";
import tls from "node:tls";

import { cleanSecret } from "@/lib/ai/config";
import { errorKindForStatus, postRequest, snippet } from "@/lib/ai/http";
import { completeOpenAiCompatible } from "@/lib/ai/providers/openai-compatible";
import { RUSSIAN_TRUSTED_ROOT_CA, RUSSIAN_TRUSTED_SUB_CA } from "@/lib/ai/russian-ca";
import { AiProviderError, type AiProvider } from "@/lib/ai/types";

const DEFAULT_AUTH_URL = "https://ngw.devices.sberbank.ru:9443/api/v2/oauth";
const DEFAULT_BASE_URL = "https://api.giga.chat/v1";
const DEFAULT_MODEL = "GigaChat-2";
const DEFAULT_SCOPE = "GIGACHAT_API_PERS";
/** GigaChat отклоняет запросы без заголовка User-Agent. */
const USER_AGENT = "Otti/0.1";

/** Стандартные сертификаты + сертификаты Минцифры — только для запросов к GigaChat. */
const CA = [...tls.rootCertificates, RUSSIAN_TRUSTED_ROOT_CA, RUSSIAN_TRUSTED_SUB_CA];

type Token = { value: string; expiresAt: number };

// Токен общий для всех запросов этого сервера, обновляется за минуту до окончания
let cachedToken: Token | null = null;
let tokenRequest: Promise<Token> | null = null;

function settings() {
  const rawKey = cleanSecret(process.env.GIGACHAT_AUTH_KEY) ?? "";
  return {
    // Ключ иногда копируют вместе со словом Basic — убираем его
    authKey: rawKey.replace(/^basic\s+/i, ""),
    authUrl: cleanSecret(process.env.GIGACHAT_AUTH_URL) ?? DEFAULT_AUTH_URL,
    baseUrl: (cleanSecret(process.env.GIGACHAT_BASE_URL) ?? DEFAULT_BASE_URL).replace(/\/+$/, ""),
    scope: cleanSecret(process.env.GIGACHAT_SCOPE) ?? DEFAULT_SCOPE,
    model: cleanSecret(process.env.GIGACHAT_MODEL) ?? DEFAULT_MODEL,
  };
}

async function requestToken(signal: AbortSignal): Promise<Token> {
  const { authKey, authUrl, scope } = settings();
  if (!authKey) {
    throw new AiProviderError("gigachat", "auth", "не задан GIGACHAT_AUTH_KEY");
  }

  const response = await postRequest("gigachat", authUrl, {
    headers: {
      Authorization: `Basic ${authKey}`,
      RqUID: randomUUID(),
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      "User-Agent": USER_AGENT,
    },
    body: new URLSearchParams({ scope }).toString(),
    signal,
    ca: CA,
  });

  let json: { access_token?: unknown; expires_at?: unknown; message?: unknown } | null = null;
  try {
    json = JSON.parse(response.text);
  } catch {
    json = null;
  }

  if (response.status !== 200 || typeof json?.access_token !== "string") {
    const message = typeof json?.message === "string" ? json.message : snippet(response.text);
    const kind = response.status === 200 ? "bad_response" : errorKindForStatus(response.status);
    throw new AiProviderError(
      "gigachat",
      kind === "request" ? "auth" : kind,
      `не удалось получить токен доступа: ${message || "пустой ответ"}`,
      response.status,
    );
  }

  // expires_at приходит в миллисекундах; на всякий случай понимаем и секунды
  const rawExpires = typeof json.expires_at === "number" ? json.expires_at : 0;
  const expiresAt =
    rawExpires > 1e12 ? rawExpires : rawExpires > 0 ? rawExpires * 1000 : Date.now() + 25 * 60_000;

  return { value: json.access_token, expiresAt };
}

async function getToken(signal: AbortSignal, force: boolean): Promise<string> {
  if (!force && cachedToken && cachedToken.expiresAt - 60_000 > Date.now()) {
    return cachedToken.value;
  }
  // Если токен уже запрашивается другим запросом — ждём его, а не просим второй
  tokenRequest ??= requestToken(signal).finally(() => {
    tokenRequest = null;
  });
  cachedToken = await tokenRequest;
  return cachedToken.value;
}

export function createGigaChatProvider(): AiProvider {
  const { baseUrl, model } = settings();

  return {
    id: "gigachat",
    model,
    async complete(request, signal) {
      const run = async (force: boolean) =>
        completeOpenAiCompatible({
          provider: "gigachat",
          url: `${baseUrl}/chat/completions`,
          model,
          headers: {
            Authorization: `Bearer ${await getToken(signal, force)}`,
            "User-Agent": USER_AGENT,
          },
          request,
          signal,
          ca: CA,
        });

      try {
        return await run(false);
      } catch (error) {
        // Токен мог истечь раньше срока — получаем новый и пробуем ещё раз
        if (error instanceof AiProviderError && error.status === 401) {
          cachedToken = null;
          return run(true);
        }
        throw error;
      }
    },
  };
}
