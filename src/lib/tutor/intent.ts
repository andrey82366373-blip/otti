/**
 * Распознавание намерения сменить учебную цель прямо в чате: «Я хочу готовиться к IELTS»,
 * «I want to prepare for IELTS», «помоги сдать айелтс». Работает без ИИ — поэтому
 * не тратит лимит и одинаково понимает русский, английский и смешанный текст.
 */

export type ExamIntent = { exam: "ielts" } | { exam: "other"; title: string };

const IELTS = /\b(i\s?e\s?l\s?t\s?s|ilets|ielst)\b|ielts|айелтс|айлтс|аелтс|иелтс|илтс|айeлтс/iu;

const OTHER_EXAMS: { pattern: RegExp; title: string }[] = [
  { pattern: /\btoefl\b|тоефл|тойфл|тофл/iu, title: "TOEFL" },
  {
    pattern: /(cambridge|кембридж)\S*\s+(english|exam|test|экзамен|сертификат)|\b(fce|cae|cpe)\b|экзамен\S*\s+(cambridge|кембридж)/iu,
    title: "Cambridge English",
  },
  { pattern: /(^|[^\p{L}])(огэ|егэ)($|[^\p{L}])|вступительн/iu, title: "школьных и вступительных экзаменов" },
];

/** Слова, которые говорят о желании готовиться, а не просто упоминают экзамен. */
const INTENT =
  /(хочу|хотел|хотела|буду|нуж|надо|экзамен|exam|готов|подгот|сдава|сдать|сдам|сдаю|помоги|помочь|начать|начнём|давай|переключ|режим|want|would like|'d like|need|prepar|practi[cs]e|study|studying|train|pass|take|taking|help|switch|start|mode|going to|plan)/iu;

/** Короткое сообщение целиком об экзамене («IELTS», «айелтс?») — тоже считаем намерением. */
function isBareMention(text: string): boolean {
  return text.replace(/[^\p{L}\p{N}]+/gu, " ").trim().split(" ").length <= 2;
}

export function detectExamIntent(text: string): ExamIntent | null {
  const value = text.trim();
  if (!value || value.length > 300) return null;
  const hasIntent = INTENT.test(value) || isBareMention(value);
  if (!hasIntent) return null;
  if (IELTS.test(value)) return { exam: "ielts" };
  for (const other of OTHER_EXAMS) {
    if (other.pattern.test(value)) return { exam: "other", title: other.title };
  }
  return null;
}

/** Ответ Отти на желание готовиться к IELTS — по-русски, с вопросами для настройки подготовки. */
export const IELTS_SWITCH_REPLY = [
  "Отличная цель! Давай готовиться к IELTS 🎯",
  "Я могу переключить тебя в режим подготовки к IELTS: там диагностика, учебный план и задания Reading, Listening, Writing и Speaking в формате экзамена.",
  "Чтобы составить план, мне нужно знать:",
  "1) какой модуль ты сдаёшь — Academic или General Training;",
  "2) твой текущий уровень английского;",
  "3) какой балл тебе нужен;",
  "4) когда примерно экзамен.",
  "Перейти в режим подготовки к IELTS? Ответить на вопросы можно будет на следующем шаге. Учебная цель изменится только после твоего подтверждения.",
].join("\n");

export function otherExamReply(title: string): string {
  return [
    `Подготовка к ${title} в Отти появится позже — я пока не хочу давать задания, которые не соответствуют формату экзамена.`,
    "Уже сейчас есть полноценная подготовка к IELTS, а разговорная практика здесь поможет с любым экзаменом.",
    "Хочешь перейти в режим IELTS или продолжим разговор?",
  ].join("\n");
}
