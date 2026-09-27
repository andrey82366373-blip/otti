/**
 * Русское множественное число: plural(5, ["день", "дня", "дней"]) → «дней».
 */
export function plural(count: number, forms: [one: string, few: string, many: string]): string {
  const n = Math.abs(count) % 100;
  const last = n % 10;
  if (n > 10 && n < 20) return forms[2];
  if (last > 1 && last < 5) return forms[1];
  if (last === 1) return forms[0];
  return forms[2];
}

/** «5 дней», «1 урок», «3 слова» */
export function withPlural(count: number, forms: [string, string, string]): string {
  return `${count} ${plural(count, forms)}`;
}

export const DAYS: [string, string, string] = ["день", "дня", "дней"];
export const LESSONS: [string, string, string] = ["урок", "урока", "уроков"];
export const WORDS: [string, string, string] = ["слово", "слова", "слов"];
export const MISTAKES: [string, string, string] = ["ошибка", "ошибки", "ошибок"];
