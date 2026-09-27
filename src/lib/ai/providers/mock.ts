/**
 * Тестовый режим: ответы-заготовки без настоящего ИИ.
 * Работает без ключей и интернета — чтобы проверять сайт на компьютере.
 * Отвечает в том же формате, что и настоящий ИИ, но содержание — шаблонное.
 */
import "server-only";

import type { AiProvider, CompletionRequest } from "@/lib/ai/types";

/** Примерная длина в токенах: около 4 символов на токен. */
function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

function wait(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => {
      clearTimeout(timer);
      resolve();
    });
  });
}

/** Текст ученика из последнего сообщения (без служебной обёртки). */
function lastStudentText(request: CompletionRequest): string {
  const last = [...request.messages].reverse().find((message) => message.role === "user")?.content ?? "";
  const quoted = last.match(/"""\n?([\s\S]*?)\n?"""/);
  return (quoted ? quoted[1] : last).trim();
}

/** Форма глагола для he/she/it: go → goes, have → has, like → likes. */
function thirdPerson(verb: string): string {
  const lower = verb.toLowerCase();
  if (lower === "have") return "has";
  if (lower === "go" || lower === "do") return `${verb}es`;
  return `${verb}s`;
}

/** Несколько типичных ошибок, которые тестовый режим «замечает». */
const MOCK_MISTAKES: { pattern: RegExp; fix: (...groups: string[]) => string; explanation: string }[] = [
  {
    pattern: /\b(he|she|it) (go|like|want|have|play|do)\b/i,
    fix: (subject, verb) => `${subject} ${thirdPerson(verb)}`,
    explanation: "С he, she, it к глаголу в Present Simple добавляется -s (-es).",
  },
  { pattern: /\bi is\b/i, fix: () => "I am", explanation: "С I используется am: I am." },
  { pattern: /\b(you|we|they) is\b/i, fix: (subject) => `${subject} are`, explanation: "С you, we, they используется are." },
];

function mockChat(text: string): string {
  let correction: Record<string, string> | null = null;
  for (const mistake of MOCK_MISTAKES) {
    if (mistake.pattern.test(text)) {
      const corrected = text.replace(mistake.pattern, (_match, ...groups: string[]) => mistake.fix(...groups));
      correction = { original: text, corrected, explanation: mistake.explanation, natural: "" };
      break;
    }
  }
  const russian = /[а-яё]/i.test(text);
  const reply = russian
    ? "In English, please! Try to say it with simple words. What did you want to say?"
    : "Nice! Tell me more, please. What do you like to do at the weekend?";
  const translation = russian
    ? "По-английски, пожалуйста! Попробуй сказать простыми словами. Что ты хотел(а) сказать?"
    : "Отлично! Расскажи ещё, пожалуйста. Что ты любишь делать на выходных?";
  return JSON.stringify({
    reply: `${reply} (Test mode)`,
    translation: `${translation} (Тестовый режим: ответ-заготовка без настоящего ИИ.)`,
    correction,
    words: russian ? [] : [{ en: "weekend", ru: "выходные" }],
  });
}

function mockSummary(request: CompletionRequest): string {
  const transcript = request.messages.map((message) => message.content).join("\n");
  const count = (transcript.match(/^Ученик:/gm) ?? []).length;
  return JSON.stringify({
    went_well: `Тестовый режим: ты написал(а) ${count} сообщ. на английском — это настоящая практика.`,
    focus_on: ["Тестовый режим: здесь настоящий ИИ перечислит, над чем поработать."],
    homework: ["Напиши 3 предложения о своём дне по-английски."],
  });
}

function mockCheck(text: string): string {
  const english = !/[а-яё]/i.test(text) && (text.match(/[A-Za-z]+/g) ?? []).length >= 2;
  const mistake = MOCK_MISTAKES.find((item) => item.pattern.test(text));
  const correct = english && !mistake;
  return JSON.stringify({
    correct,
    corrected: text,
    comment: correct
      ? "Тестовый режим: ответ принят."
      : mistake
        ? `Тестовый режим: ${mistake.explanation}`
        : "Тестовый режим: ответ нужен по-английски, хотя бы из двух слов.",
  });
}

export function createMockProvider(): AiProvider {
  return {
    id: "mock",
    model: "otti-mock",
    async complete(request, signal) {
      await wait(400, signal);
      const said = lastStudentText(request);

      let text: string;
      switch (request.purpose) {
        case "chat":
          text = mockChat(said);
          break;
        case "summary":
          text = mockSummary(request);
          break;
        case "check":
          text = mockCheck(said);
          break;
        default:
          text = "Hi! I'm Otti, your English tutor. (Привет! Я Отти, твой репетитор английского.)";
      }

      const input = request.messages.map((message) => message.content).join("\n");
      return { text, model: "otti-mock", tokensIn: estimateTokens(input), tokensOut: estimateTokens(text) };
    },
  };
}
