/**
 * OpenRouter — запасной вариант с бесплатными моделями.
 * По умолчанию модель openrouter/free: OpenRouter сам выбирает одну из бесплатных моделей.
 */
import "server-only";

import { cleanSecret } from "@/lib/ai/config";
import { completeOpenAiCompatible } from "@/lib/ai/providers/openai-compatible";
import type { AiProvider } from "@/lib/ai/types";

const DEFAULT_BASE_URL = "https://openrouter.ai/api/v1";
const DEFAULT_MODEL = "openrouter/free";

function siteUrl(): string {
  const host = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  return host ? `https://${host}` : "http://localhost:3000";
}

export function createOpenRouterProvider(): AiProvider {
  const apiKey = cleanSecret(process.env.OPENROUTER_API_KEY) ?? "";
  const baseUrl = (cleanSecret(process.env.OPENROUTER_BASE_URL) ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
  const model = cleanSecret(process.env.OPENROUTER_MODEL) ?? DEFAULT_MODEL;

  return {
    id: "openrouter",
    model,
    complete(request, signal) {
      return completeOpenAiCompatible({
        provider: "openrouter",
        url: `${baseUrl}/chat/completions`,
        model,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": siteUrl(),
          "X-Title": "Otti",
        },
        request,
        signal,
        // Рассуждающим моделям — поменьше «размышлений», чтобы хватило места на ответ
        extraBody: { reasoning: { effort: "low", exclude: true } },
      });
    },
  };
}
