/**
 * YandexGPT (Yandex Cloud) — платный запасной вариант, дешёвая модель YandexGPT Lite.
 * Нужны API-ключ сервисного аккаунта и идентификатор каталога (folder ID).
 */
import "server-only";

import { cleanSecret } from "@/lib/ai/config";
import { completeOpenAiCompatible } from "@/lib/ai/providers/openai-compatible";
import type { AiProvider } from "@/lib/ai/types";

const DEFAULT_BASE_URL = "https://llm.api.cloud.yandex.net/v1";
const DEFAULT_MODEL = "yandexgpt-lite";

export function createYandexProvider(): AiProvider {
  const apiKey = cleanSecret(process.env.YANDEX_API_KEY) ?? "";
  const folderId = cleanSecret(process.env.YANDEX_FOLDER_ID) ?? "";
  const baseUrl = (cleanSecret(process.env.YANDEX_BASE_URL) ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
  const name = cleanSecret(process.env.YANDEX_MODEL) ?? DEFAULT_MODEL;
  // Полный адрес модели: gpt://<каталог>/yandexgpt-lite/latest
  const model = name.startsWith("gpt://")
    ? name
    : `gpt://${folderId}/${name.includes("/") ? name : `${name}/latest`}`;

  return {
    id: "yandex",
    model,
    complete(request, signal) {
      return completeOpenAiCompatible({
        provider: "yandex",
        url: `${baseUrl}/chat/completions`,
        model,
        headers: {
          Authorization: `Api-Key ${apiKey}`,
          "OpenAI-Project": folderId,
        },
        request,
        signal,
      });
    },
  };
}
