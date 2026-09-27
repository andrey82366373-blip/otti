/**
 * Вход и регистрация (библиотека Better Auth). Работает только на сервере.
 *
 * Пароли хранятся в базе только в виде хеша. Сессия хранится в защищённом cookie.
 */
import "server-only";

import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";

import { getDb } from "@/db";
import { isHosted } from "@/lib/hosting";
import * as schema from "@/db/schema";

const isDev = process.env.NODE_ENV !== "production";

/** Максимальная длина имени — имя попадает в инструкции для ИИ, длинное имя тратило бы токены. */
export const MAX_NAME_LENGTH = 50;

/** Имя и фото проверяются на сервере: запрос к /api/auth можно отправить в обход формы. */
function assertSafeProfile(data: { name?: unknown; image?: unknown }) {
  if (typeof data.name === "string" && (data.name.trim().length === 0 || data.name.length > MAX_NAME_LENGTH)) {
    throw new APIError("BAD_REQUEST", { message: `Имя должно быть от 1 до ${MAX_NAME_LENGTH} символов` });
  }
  if (data.image !== undefined && data.image !== null && data.image !== "") {
    throw new APIError("BAD_REQUEST", { message: "Фото профиля не поддерживается" });
  }
}

/**
 * Ключ только для запуска на своём компьютере.
 * В интернете (на Render или Vercel) обязательно задаётся свой ключ BETTER_AUTH_SECRET.
 */
const LOCAL_DEV_SECRET = "otti-local-development-secret-do-not-use-in-production";

/** Адреса, с которых разрешено входить в приложение. */
function getAllowedHosts(): string[] {
  const hosts = [
    process.env.VERCEL_PROJECT_PRODUCTION_URL, // основной адрес: otti-….vercel.app
    process.env.VERCEL_BRANCH_URL,
    process.env.VERCEL_URL, // адрес конкретной публикации
    process.env.RENDER_EXTERNAL_HOSTNAME, // адрес на Render: otti-….onrender.com
  ];
  if (!isHosted()) {
    hosts.push("localhost:*", "127.0.0.1:*"); // запуск на своём компьютере
  }
  return hosts.filter((host): host is string => Boolean(host));
}

/** Проверяет, задан ли секретный ключ там, где он обязателен. */
export function isAuthSecretConfigured(): boolean {
  return Boolean(process.env.BETTER_AUTH_SECRET) || isDev;
}

function createAuth() {
  const db = getDb();

  return betterAuth({
    appName: "Otti",
    // Свой домен можно задать переменной BETTER_AUTH_URL, иначе адрес берётся из запроса
    baseURL: process.env.BETTER_AUTH_URL ?? { allowedHosts: getAllowedHosts() },
    secret: process.env.BETTER_AUTH_SECRET ?? (isDev ? LOCAL_DEV_SECRET : undefined),
    database: drizzleAdapter(db, { provider: "pg", schema }),

    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      maxPasswordLength: 128,
      autoSignIn: true, // после регистрации ученик сразу входит
    },

    session: {
      expiresIn: 60 * 60 * 24 * 30, // сессия живёт 30 дней
      updateAge: 60 * 60 * 24, // и продлевается раз в сутки
      cookieCache: { enabled: true, maxAge: 5 * 60 }, // меньше запросов к базе
    },

    // Защита от подбора пароля: ограничиваем число попыток с одного адреса.
    // Счётчики хранятся в базе, потому что на Vercel сервер может перезапускаться.
    rateLimit: {
      enabled: !isDev,
      storage: "database",
      window: 60,
      max: 100,
      customRules: {
        "/sign-in/email": { window: 60, max: 10 },
        // Не больше 5 регистраций в час с одного адреса — против массовых фальшивых аккаунтов
        "/sign-up/email": { window: 60 * 60, max: 5 },
        "/change-password": { window: 60, max: 5 },
        "/delete-user": { window: 60, max: 5 },
      },
    },

    user: {
      // Ученик может удалить аккаунт — вместе с ним удаляются все его данные
      deleteUser: { enabled: true },
    },

    databaseHooks: {
      user: {
        create: {
          before: async (user) => {
            assertSafeProfile(user);
          },
          // Сразу создаём профиль ученика с настройками по умолчанию
          after: async (user) => {
            await db
              .insert(schema.profiles)
              .values({ userId: user.id })
              .onConflictDoNothing();
          },
        },
        update: {
          before: async (user) => {
            assertSafeProfile(user);
          },
        },
      },
    },

    plugins: [nextCookies()],
  });
}

type Auth = ReturnType<typeof createAuth>;
export type AuthSession = Auth["$Infer"]["Session"];

let auth: Auth | undefined;

/** Возвращает настроенный объект входа. Создаётся при первом обращении. */
export function getAuth(): Auth {
  if (!auth) {
    auth = createAuth();
  }
  return auth;
}
