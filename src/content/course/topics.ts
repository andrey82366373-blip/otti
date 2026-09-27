/** Темы заданий. По ним считаются «слабые темы» в прогрессе и группируются ошибки. */
export const TOPICS = {
  greetings: "Приветствия и знакомство",
  "to-be": "Глагол to be",
  pronouns: "Местоимения",
  numbers: "Числа",
  age: "Возраст",
  countries: "Страны и национальности",
  family: "Семья",
  possessives: "Слова my, his, her…",
  "have-has": "Глагол have / has",
  "present-simple": "Present Simple",
  "daily-routine": "Распорядок дня",
} as const;

export type TopicId = keyof typeof TOPICS;

export function getTopicTitle(topic: string): string {
  return Object.hasOwn(TOPICS, topic) ? TOPICS[topic as TopicId] : topic;
}
