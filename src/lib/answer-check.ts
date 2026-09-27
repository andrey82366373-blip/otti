/**
 * Проверка ответов, которые ученик вводит с клавиатуры.
 * Регистр, знаки препинания, лишние пробелы и сокращения (I'm / I am) не влияют на результат.
 */

/** Строчные буквы, без знаков препинания, одинарные пробелы. */
export function normalizeAnswer(text: string): string {
  return text
    .toLowerCase()
    .replace(/[’‘`´]/g, "'")
    .replace(/ё/g, "е")
    .replace(/[^\p{L}\p{N}' -]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const IS_CONTRACTIONS = ["he", "she", "it", "what", "that", "where", "who", "how", "there", "here"];

/** Нормализованный текст с раскрытыми сокращениями: I'm → i am, don't → do not. */
export function canonicalAnswer(text: string): string {
  let result = normalizeAnswer(text);
  result = result
    .replace(/\bcan't\b/g, "can not")
    .replace(/\bcannot\b/g, "can not")
    .replace(/\bwon't\b/g, "will not")
    .replace(/n't\b/g, " not")
    .replace(/'m\b/g, " am")
    .replace(/'re\b/g, " are")
    .replace(/'ve\b/g, " have")
    .replace(/'ll\b/g, " will");
  for (const word of IS_CONTRACTIONS) {
    result = result.replace(new RegExp(`\\b${word}'s\\b`, "g"), `${word} is`);
  }
  // Частый вариант «im» без апострофа
  result = result.replace(/^im\b/, "i am");
  return result.replace(/\s+/g, " ").trim();
}

/** Совпадает ли ответ с одним из правильных вариантов. */
export function matchesAccepted(answer: string, accepted: string[]): boolean {
  const user = canonicalAnswer(answer);
  if (!user) return false;
  return accepted.some((variant) => canonicalAnswer(variant) === user);
}

/** Сокращение в самом конце фразы — ошибка: «Yes, I'm.» (нужно «Yes, I am.»). */
function endsWithContraction(answer: string): boolean {
  return /\b(i'm|you're|he's|she's|it's|we're|they're)$/.test(normalizeAnswer(answer));
}

/** Подходит ли ответ под один из шаблонов (для открытых вопросов). */
export function matchesPatterns(answer: string, patterns: string[]): boolean {
  const user = canonicalAnswer(answer);
  if (!user || endsWithContraction(answer)) return false;
  return patterns.some((pattern) => new RegExp(pattern, "u").test(user));
}

/**
 * Сколько правок (вставка, удаление, замена, перестановка соседних букв)
 * нужно, чтобы из одной строки получить другую.
 */
export function editDistance(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const d: number[][] = Array.from({ length: rows }, (_, i) =>
    Array.from({ length: cols }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[a.length][b.length];
}

/** Похоже на опечатку: отличается от правильного варианта на 1–2 буквы. */
export function isNearMiss(answer: string, accepted: string[]): boolean {
  const user = canonicalAnswer(answer);
  if (!user) return false;
  return accepted.some((variant) => {
    const target = canonicalAnswer(variant);
    const allowed = target.length <= 6 ? 1 : 2;
    return editDistance(user, target) <= allowed;
  });
}
