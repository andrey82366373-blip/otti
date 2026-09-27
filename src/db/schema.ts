/**
 * Структура базы данных Otti.
 *
 * Таблицы user, session, account, verification и rate_limit нужны для входа и регистрации
 * (их формат задаёт библиотека Better Auth). Остальные таблицы хранят прогресс ученика.
 *
 * Файлы миграций в папке drizzle/ создаются по этому описанию и применяются командой
 * npm run db:migrate (на Vercel — автоматически при каждой публикации).
 */
import { relations } from "drizzle-orm";
import {
  bigint,
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import type { CefrLevel, LearningGoal } from "@/lib/learning";

/* ─────────────────────────── Справочные значения ─────────────────────────── */

// Уровни и цели описаны в src/lib/learning.ts (их используют и страницы, и база)
export type { CefrLevel, LearningGoal };

export type LessonStatus = "in_progress" | "completed";
export type WordStatus = "new" | "learning" | "learned";
export type WordSource = "lesson" | "chat";
export type ChatRole = "user" | "assistant";

/** Карточка исправления от ИИ-репетитора. */
export type Correction = {
  original: string;
  corrected: string;
  explanation: string;
  natural?: string;
};

/** Итог занятия с репетитором. */
export type SessionSummary = {
  /** Что получилось — 1–2 предложения. */
  wentWell: string;
  /** Над чем поработать — 1–3 пункта. */
  focusOn: string[];
  /** Домашнее задание — 1–3 коротких задания. */
  homework: string[];
  /** Посчитано сайтом, а не ИИ: сообщений ученика, исправлений и слов в словарь. */
  stats: { messages: number; corrections: number; words: number };
  createdAt: string;
};

/** Слово, которое Отти предложил добавить в словарь. */
export type SuggestedWord = { en: string; ru: string };

/* Общие поля «когда создано» и «когда изменено» */
const createdAt = () =>
  timestamp("created_at", { withTimezone: true }).defaultNow().notNull();
const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull();

/* ───────────────────── Вход и регистрация (Better Auth) ──────────────────── */

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

/** Счётчики запросов ко входу и регистрации — защита от подбора пароля. */
export const rateLimit = pgTable("rate_limit", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  count: integer("count").notNull(),
  lastRequest: bigint("last_request", { mode: "number" }).notNull(),
});

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}));

/* ──────────────────────────────── Ученик ──────────────────────────────── */

/** Настройки ученика и общие счётчики: уровень, цель, XP, серия дней. */
export const profiles = pgTable("profiles", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  level: text("level").$type<CefrLevel>().notNull().default("A1"),
  goal: text("goal").$type<LearningGoal>().notNull().default("conversation"),
  dailyGoalXp: integer("daily_goal_xp").notNull().default(30),
  dailyMinutes: integer("daily_minutes").notNull().default(10),
  explanationLanguage: text("explanation_language").notNull().default("ru"),
  timezone: text("timezone").notNull().default("Europe/Moscow"),
  totalXp: integer("total_xp").notNull().default(0),
  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  lastActiveDate: date("last_active_date"),
  onboardingCompleted: boolean("onboarding_completed").notNull().default(false),
  /** Тариф: пока всегда "free". Задел под будущую подписку. */
  plan: text("plan").notNull().default("free"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

/** Результаты мини-теста на определение уровня. */
export const placementResults = pgTable(
  "placement_results",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    score: integer("score").notNull(),
    total: integer("total").notNull(),
    recommendedLevel: text("recommended_level").$type<CefrLevel>().notNull(),
    createdAt: createdAt(),
  },
  (table) => [index("placement_results_user_idx").on(table.userId)],
);

/* ──────────────────────────── Уроки и задания ──────────────────────────── */

/** Прохождение уроков. Сами уроки лежат в файлах проекта, здесь только прогресс. */
export const lessonProgress = pgTable(
  "lesson_progress",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    lessonId: text("lesson_id").notNull(),
    status: text("status").$type<LessonStatus>().notNull().default("in_progress"),
    bestScore: integer("best_score").notNull().default(0),
    attempts: integer("attempts").notNull().default(0),
    xpEarned: integer("xp_earned").notNull().default(0),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    /** День, когда за повтор урока последний раз дали опыт (опыт за повтор — раз в день). */
    lastReplayXpOn: date("last_replay_xp_on"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.lessonId] })],
);

/** Каждый ответ ученика в заданиях — для точности и статистики. */
export const exerciseAttempts = pgTable(
  "exercise_attempts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    lessonId: text("lesson_id").notNull(),
    exerciseId: text("exercise_id").notNull(),
    exerciseType: text("exercise_type").notNull(),
    topic: text("topic").notNull(),
    isCorrect: boolean("is_correct").notNull(),
    userAnswer: text("user_answer"),
    createdAt: createdAt(),
  },
  (table) => [index("exercise_attempts_user_created_idx").on(table.userId, table.createdAt)],
);

/** Работа над ошибками: задания, в которых ученик ошибся. */
export const mistakes = pgTable(
  "mistakes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    lessonId: text("lesson_id").notNull(),
    exerciseId: text("exercise_id").notNull(),
    exerciseType: text("exercise_type").notNull(),
    topic: text("topic").notNull(),
    errorType: text("error_type").notNull(),
    userAnswer: text("user_answer"),
    correctAnswer: text("correct_answer").notNull(),
    timesWrong: integer("times_wrong").notNull().default(1),
    resolved: boolean("resolved").notNull().default(false),
    /** Когда ошибку исправили (задание решено правильно). */
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    lastWrongAt: timestamp("last_wrong_at", { withTimezone: true }).defaultNow().notNull(),
    createdAt: createdAt(),
  },
  (table) => [
    uniqueIndex("mistakes_user_exercise_idx").on(table.userId, table.exerciseId),
    index("mistakes_user_resolved_idx").on(table.userId, table.resolved),
  ],
);

/* ──────────────────────────────── Словарь ──────────────────────────────── */

/** Личный словарь ученика с расписанием повторений. */
export const userWords = pgTable(
  "user_words",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    word: text("word").notNull(),
    translation: text("translation").notNull(),
    example: text("example"),
    exampleRu: text("example_ru"),
    source: text("source").$type<WordSource>().notNull().default("lesson"),
    sourceId: text("source_id"),
    status: text("status").$type<WordStatus>().notNull().default("new"),
    intervalDays: integer("interval_days").notNull().default(0),
    correctStreak: integer("correct_streak").notNull().default(0),
    nextReviewAt: timestamp("next_review_at", { withTimezone: true }).defaultNow().notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("user_words_user_word_idx").on(table.userId, table.word),
    index("user_words_user_review_idx").on(table.userId, table.nextReviewAt),
  ],
);

/* ────────────────────────────── ИИ-репетитор ────────────────────────────── */

/** Диалоги с репетитором. */
export const chatThreads = pgTable(
  "chat_threads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull().default("Новый разговор"),
    topic: text("topic"),
    summary: jsonb("summary").$type<SessionSummary>(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [index("chat_threads_user_updated_idx").on(table.userId, table.updatedAt)],
);

/** Сообщения в диалогах. correction — карточка исправления, если была ошибка. */
export const chatMessages = pgTable(
  "chat_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    threadId: uuid("thread_id")
      .notNull()
      .references(() => chatThreads.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: text("role").$type<ChatRole>().notNull(),
    content: text("content").notNull(),
    correction: jsonb("correction").$type<Correction>(),
    /** Перевод ответа Отти на русский. */
    translation: text("translation"),
    /** Новые слова из ответа Отти — их можно добавить в словарь. */
    words: jsonb("words").$type<SuggestedWord[]>(),
    tokensIn: integer("tokens_in").notNull().default(0),
    tokensOut: integer("tokens_out").notNull().default(0),
    createdAt: createdAt(),
  },
  (table) => [index("chat_messages_thread_created_idx").on(table.threadId, table.createdAt)],
);

/**
 * Проверка ИИ открытых ответов в уроках («ответь своими словами»).
 * Сервер доверяет только этим записям, а не тому, что прислал браузер.
 */
export const aiAnswerChecks = pgTable(
  "ai_answer_checks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    exerciseId: text("exercise_id").notNull(),
    /** Ответ в нормализованном виде: строчные буквы, без знаков препинания. */
    answerKey: text("answer_key").notNull(),
    correct: boolean("correct").notNull(),
    comment: text("comment"),
    corrected: text("corrected"),
    createdAt: createdAt(),
  },
  (table) => [
    uniqueIndex("ai_answer_checks_user_exercise_answer_idx").on(
      table.userId,
      table.exerciseId,
      table.answerKey,
    ),
  ],
);

/** Учёт запросов к ИИ по дням — для дневных лимитов и контроля расходов. */
export const aiUsage = pgTable(
  "ai_usage",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    day: date("day").notNull(),
    requests: integer("requests").notNull().default(0),
    tokens: integer("tokens").notNull().default(0),
    /** Начало текущей минуты и число запросов в ней — для лимита «в минуту». */
    windowStart: timestamp("window_start", { withTimezone: true }),
    windowRequests: integer("window_requests").notNull().default(0),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.day] }),
    index("ai_usage_day_idx").on(table.day),
  ],
);

/* ─────────────────────────── Активность и награды ─────────────────────────── */

/** Активность по дням: для серии дней и графика XP. */
export const dailyActivity = pgTable(
  "daily_activity",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    day: date("day").notNull(),
    xp: integer("xp").notNull().default(0),
    /** Дневная цель в XP, которая действовала в этот день. */
    goalXp: integer("goal_xp").notNull().default(0),
    lessonsCompleted: integer("lessons_completed").notNull().default(0),
    exercisesDone: integer("exercises_done").notNull().default(0),
  },
  (table) => [primaryKey({ columns: [table.userId, table.day] })],
);

/** Полученные достижения. */
export const userAchievements = pgTable(
  "user_achievements",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    earnedAt: timestamp("earned_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.code] })],
);
