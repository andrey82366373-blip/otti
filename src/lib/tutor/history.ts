/**
 * Контекст разговора для ИИ: последние сообщения целиком и краткое содержание начала.
 * Так длинный разговор не раздувает запрос (и не упирается в лимиты модели),
 * но Отти помнит, о чём шла речь.
 */
import type { ChatMessage } from "@/lib/ai/types";

type StoredMessage = { role: "user" | "assistant"; content: string };

/** Самое длинное сообщение, которое уходит ИИ целиком. */
const MAX_MESSAGE_CHARS = 800;
/** Сколько ранних реплик ученика попадает в краткое содержание. */
const EARLIER_USER_LINES = 8;

function clip(text: string, max: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

export function buildChatHistory(
  messages: StoredMessage[],
  recentCount: number,
): { history: ChatMessage[]; earlierContext: string | null } {
  const recent = messages.slice(-recentCount);
  const earlier = messages.slice(0, Math.max(0, messages.length - recentCount));

  const history: ChatMessage[] = recent.map((message) => ({
    role: message.role,
    content: clip(message.content, MAX_MESSAGE_CHARS),
  }));

  if (earlier.length === 0) return { history, earlierContext: null };

  const studentLines = earlier
    .filter((message) => message.role === "user")
    .slice(-EARLIER_USER_LINES)
    .map((message) => `«${clip(message.content, 100)}»`);
  const earlierContext =
    studentLines.length > 0
      ? `до последних сообщений было ещё ${earlier.length}; ученик писал: ${studentLines.join("; ")}.`
      : `до последних сообщений было ещё ${earlier.length}.`;
  return { history, earlierContext };
}
