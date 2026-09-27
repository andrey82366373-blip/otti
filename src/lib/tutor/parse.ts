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

export function parseTutorReply(raw: string): TutorReply {
  const json = extractJsonObject(raw);
  if (!json) {
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
