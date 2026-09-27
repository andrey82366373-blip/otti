/**
 * Достаёт JSON-объект из ответа ИИ. Модели иногда оборачивают его в ```json … ```
 * или добавляют текст до и после — такое тоже понимаем.
 */
export function extractJsonObject(text: string): Record<string, unknown> | null {
  const cleaned = text
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/```(?:json)?/gi, "")
    .trim();

  const candidates = [cleaned];
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start !== -1 && end > start) candidates.push(cleaned.slice(start, end + 1));

  for (const candidate of candidates) {
    try {
      const value: unknown = JSON.parse(candidate);
      if (value && typeof value === "object" && !Array.isArray(value)) {
        return value as Record<string, unknown>;
      }
    } catch {
      // пробуем следующий вариант
    }
  }
  return null;
}

/** Строка из поля ответа ИИ: обрезает пробелы и слишком длинный текст. */
export function readString(value: unknown, maxLength = 1000): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maxLength) : undefined;
}

/** Список строк из поля ответа ИИ. Одна строка тоже превращается в список. */
export function readStringList(value: unknown, maxItems: number, maxLength = 300): string[] {
  const list = Array.isArray(value) ? value : typeof value === "string" ? [value] : [];
  return list
    .map((item) => readString(item, maxLength))
    .filter((item): item is string => Boolean(item))
    .slice(0, maxItems);
}
