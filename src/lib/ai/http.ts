/**
 * Простой HTTPS-запрос на встроенном модуле Node.js.
 * Нужен, чтобы для GigaChat можно было добавить сертификат Минцифры
 * только в этот запрос, не меняя настройки всего сервера.
 */
import "server-only";

import http from "node:http";
import https from "node:https";

import { AiProviderError, type AiProviderId } from "@/lib/ai/types";

const MAX_RESPONSE_BYTES = 1_000_000;

const CERT_ERRORS = new Set([
  "UNABLE_TO_VERIFY_LEAF_SIGNATURE",
  "UNABLE_TO_GET_ISSUER_CERT",
  "UNABLE_TO_GET_ISSUER_CERT_LOCALLY",
  "SELF_SIGNED_CERT_IN_CHAIN",
  "DEPTH_ZERO_SELF_SIGNED_CERT",
  "CERT_HAS_EXPIRED",
  "CERT_NOT_YET_VALID",
  "ERR_TLS_CERT_ALTNAME_INVALID",
]);

export type HttpResponse = { status: number; text: string };

export function postRequest(
  provider: AiProviderId,
  url: string,
  options: {
    headers: Record<string, string>;
    body: string;
    signal: AbortSignal;
    /** Доверенные корневые сертификаты. Без него — стандартные сертификаты Node.js. */
    ca?: string[];
  },
): Promise<HttpResponse> {
  return new Promise((resolve, reject) => {
    const target = new URL(url);
    const client = target.protocol === "http:" ? http : https;

    if (options.signal.aborted) {
      reject(new AiProviderError(provider, "timeout", "не дождались ответа"));
      return;
    }

    const request = client.request(
      target,
      {
        method: "POST",
        headers: {
          ...options.headers,
          "Content-Length": String(Buffer.byteLength(options.body)),
        },
        ...(options.ca && target.protocol === "https:" ? { ca: options.ca } : {}),
      },
      (response) => {
        const chunks: Buffer[] = [];
        let size = 0;
        response.on("data", (chunk: Buffer) => {
          size += chunk.length;
          if (size > MAX_RESPONSE_BYTES) {
            request.destroy(new Error("RESPONSE_TOO_LARGE"));
            return;
          }
          chunks.push(chunk);
        });
        response.on("end", () => {
          resolve({ status: response.statusCode ?? 0, text: Buffer.concat(chunks).toString("utf8") });
        });
        response.on("error", (error) => request.destroy(error));
      },
    );

    const onAbort = () => request.destroy(new Error("ABORTED"));
    options.signal.addEventListener("abort", onAbort, { once: true });

    request.on("error", (error: NodeJS.ErrnoException) => {
      options.signal.removeEventListener("abort", onAbort);
      if (error.message === "ABORTED" || options.signal.aborted) {
        reject(new AiProviderError(provider, "timeout", "не дождались ответа"));
      } else if (error.code && CERT_ERRORS.has(error.code)) {
        reject(
          // Ошибка сертификата сама не пройдёт — повторять бессмысленно
          new AiProviderError(provider, "network", `сертификат сервера не прошёл проверку (${error.code})`, undefined, false),
        );
      } else if (error.message === "RESPONSE_TOO_LARGE") {
        reject(new AiProviderError(provider, "bad_response", "слишком большой ответ"));
      } else {
        reject(
          new AiProviderError(provider, "network", `нет связи с сервером (${error.code ?? error.message})`),
        );
      }
    });
    request.on("close", () => options.signal.removeEventListener("abort", onAbort));

    request.end(options.body);
  });
}

/** Тип ошибки по коду ответа сервера. */
export function errorKindForStatus(status: number) {
  if (status === 401 || status === 403) return "auth" as const;
  if (status === 402) return "quota" as const;
  if (status === 429) return "busy" as const;
  if (status === 408) return "timeout" as const;
  if (status >= 500) return "server" as const;
  return "request" as const;
}

/** Короткий фрагмент ответа для журнала ошибок — без переводов строк. */
export function snippet(text: string, length = 200): string {
  return text.replace(/\s+/g, " ").trim().slice(0, length);
}
