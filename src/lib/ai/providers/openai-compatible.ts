/**
 * Запрос в формате «chat/completions». Его понимают GigaChat, OpenRouter и YandexGPT,
 * поэтому провайдеры отличаются только адресом, ключом и названием модели.
 */
import "server-only";

import { errorKindForStatus, postRequest, snippet } from "@/lib/ai/http";
import {
  AiProviderError,
  type AiProviderId,
  type CompletionRequest,
  type CompletionResult,
} from "@/lib/ai/types";

type ApiResponse = {
  model?: string;
  choices?: { message?: { content?: unknown }; finish_reason?: string }[];
  usage?: { prompt_tokens?: number; completion_tokens?: number };
  message?: string;
  error?: { message?: string } | string;
};

function parseJson(text: string): ApiResponse | null {
  try {
    const value: unknown = JSON.parse(text);
    return value && typeof value === "object" ? (value as ApiResponse) : null;
  } catch {
    return null;
  }
}

/** Текст ошибки из ответа провайдера — разные провайдеры кладут его в разные поля. */
function errorMessage(json: ApiResponse | null, text: string): string {
  if (json?.error && typeof json.error === "object" && json.error.message) return json.error.message;
  if (typeof json?.error === "string") return json.error;
  if (json?.message) return json.message;
  return snippet(text) || "пустой ответ";
}

export async function completeOpenAiCompatible(input: {
  provider: AiProviderId;
  url: string;
  model: string;
  headers: Record<string, string>;
  request: CompletionRequest;
  signal: AbortSignal;
  ca?: string[];
  /** Дополнительные поля запроса для конкретного провайдера. */
  extraBody?: Record<string, unknown>;
}): Promise<CompletionResult> {
  const { provider, request } = input;

  const response = await postRequest(provider, input.url, {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...input.headers,
    },
    body: JSON.stringify({
      model: input.model,
      messages: request.messages,
      max_tokens: request.maxTokens,
      temperature: request.temperature,
      stream: false,
      ...input.extraBody,
    }),
    signal: input.signal,
    ca: input.ca,
  });

  const json = parseJson(response.text);

  if (response.status !== 200) {
    throw new AiProviderError(
      provider,
      errorKindForStatus(response.status),
      snippet(errorMessage(json, response.text)),
      response.status,
    );
  }

  const content = json?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || content.trim() === "") {
    throw new AiProviderError(provider, "bad_response", `ответ без текста: ${snippet(response.text)}`);
  }

  return {
    text: content.trim(),
    model: json?.model ?? input.model,
    tokensIn: Math.max(0, Math.round(json?.usage?.prompt_tokens ?? 0)),
    tokensOut: Math.max(0, Math.round(json?.usage?.completion_tokens ?? 0)),
  };
}
