/** Можно ли сейчас разговаривать с Отти: включён ли ИИ и настроен ли провайдер. */
import "server-only";

import { getAiConfig, isProviderConfigured } from "@/lib/ai/config";

export type TutorAvailability =
  | { available: true; mock: boolean }
  | { available: false; message: string };

export function getTutorAvailability(): TutorAvailability {
  const config = getAiConfig();
  if (!config.enabled) {
    return {
      available: false,
      message: "Отти сейчас отдыхает: ИИ-репетитор выключен. Уроки, словарь и ошибки работают как обычно.",
    };
  }
  if (!config.provider || !isProviderConfigured(config.provider)) {
    return {
      available: false,
      message: "ИИ-репетитор ещё не настроен. Как только его подключат, здесь можно будет поговорить с Отти.",
    };
  }
  return { available: true, mock: config.provider === "mock" };
}
