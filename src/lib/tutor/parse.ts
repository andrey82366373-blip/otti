/** Разбор ответов ИИ в чате: реплика, перевод, исправление, слова, итоги занятия. */
import type { Correction, SuggestedWord } from "@/db/schema";
import { extractJsonObject, readString, readStringList } from "@/lib/ai/json";

export type TutorReply = {
  reply: string;
  translation: string | null;
  correction: Correction | null;
  words: SuggestedWord[];
};

/** Для сравнения фраз: без регистра, знаков препинания и лишних пробелов. */
function simplify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[’`]/g, "'")
    .replace(/[^\p{L}\p{N}' ]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseCorrection(value: unknown): Correction | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const original = readString(raw.original, 400);
  const corrected = readString(raw.corrected, 400);
  const explanation = readString(raw.explanation, 500);
  if (!original || !corrected || !explanation) return null;
  // «Исправление», которое ничего не меняет (или только знаки препинания), не показываем
  if (simplify(original) === simplify(corrected)) return null;
  const natural = readString(raw.natural, 400);
  return {
    original,
    corrected,
    explanation,
    ...(natural && simplify(natural) !== simplify(corrected) ? { natural } : {}),
  };
}

function parseWords(value: unknown): SuggestedWord[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const words: SuggestedWord[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const raw = item as Record<string, unknown>;
    const en = readString(raw.en, 40);
    const ru = readString(raw.ru, 60);
    if (!en || !ru || !/^[A-Za-z][A-Za-z' -]*$/.test(en) || /[A-Za-z]/.test(ru)) continue;
    const key = en.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    words.push({ en, ru });
    if (words.length === 3) break;
  }
  return words;
}

/** Если ИИ ответил не JSON — показываем его текст как обычную реплику. */
function plainText(raw: string): string {
  return raw
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/```(?:json)?/gi, "")
    .trim()
    .slice(0, 1500);
}

/**
 * Значение строкового поля из JSON, даже если JSON обрезан посередине
 * (у модели кончилась длина ответа). Незакрытая строка берётся до конца текста.
 */
export function salvageJsonString(raw: string, field: string): string | undefined {
  const match = raw.match(new RegExp(`"${field}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)`));
  if (!match) return undefined;
  let body = match[1];
  // Обрезанная escape-последовательность в самом конце
  body = body.replace(/\\u[0-9a-fA-F]{0,3}$/, "").replace(/\\$/, "");
  try {
    return readString(JSON.parse(`"${body}"`), 1500);
  } catch {
    return readString(body.replace(/\\n/g, "\n").replace(/\\"/g, '"'), 1500);
  }
}

/** Похож ли текст на JSON (целый или обрезанный), а не на обычную реплику. */
function looksLikeJson(text: string): boolean {
  return /^\s*(```(?:json)?\s*)?[{[]/i.test(text) || /"reply"\s*:/.test(text);
}

/**
 * Можно ли показать ответ ученику: JSON с репликой, обрезанный JSON с репликой
 * или обычный текст. Непонятный обрывок JSON — нельзя (такой ответ повторяем).
 */
export function isUsableTutorReply(raw: string): boolean {
  const json = extractJsonObject(raw);
  if (json) return Boolean(readString(json.reply) ?? readString(json.message));
  if (salvageJsonString(raw, "reply")) return true;
  return !looksLikeJson(raw) && plainText(raw).length > 0;
}

export function parseTutorReply(raw: string): TutorReply {
  const json = extractJsonObject(raw);
  if (!json) {
    // JSON обрезан: достаём хотя бы реплику и перевод
    const salvaged = salvageJsonString(raw, "reply");
    if (salvaged) {
      return {
        reply: salvaged,
        translation: salvageJsonString(raw, "translation") ?? null,
        correction: null,
        words: [],
      };
    }
    return { reply: plainText(raw), translation: null, correction: null, words: [] };
  }
  const reply = readString(json.reply, 1500) ?? readString(json.message, 1500) ?? plainText(raw);
  return {
    reply,
    translation: readString(json.translation, 1500) ?? null,
    correction: parseCorrection(json.correction),
    words: parseWords(json.words),
  };
}

export type ParsedSummary = { wentWell: string; focusOn: string[]; homework: string[] };

export function parseSummary(raw: string): ParsedSummary | null {
  const json = extractJsonObject(raw);
  if (!json) return null;
  const wentWell = readString(json.went_well, 600) ?? readString(json.wentWell, 600);
  const focusOn = readStringList(json.focus_on ?? json.focusOn, 3);
  const homework = readStringList(json.homework, 3);
  if (!wentWell || homework.length === 0) return null;
  return { wentWell, focusOn, homework };
}

export type AnswerVerdict = { correct: boolean; corrected: string | null; comment: string | null };

export function parseAnswerVerdict(raw: string): AnswerVerdict | null {
  const json = extractJsonObject(raw);
  if (!json || typeof json.correct !== "boolean") return null;
  return {
    correct: json.correct,
    corrected: readString(json.corrected, 300) ?? null,
    comment: readString(json.comment, 300) ?? null,
  };
}
