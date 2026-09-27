import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { getTableName, is, sql } from "drizzle-orm";
import { PgTable } from "drizzle-orm/pg-core";
import {
  CircleAlert,
  CircleCheck,
  CircleX,
  Database,
  Globe,
  KeyRound,
  RefreshCw,
  Sparkles,
  Table2,
  type LucideIcon,
} from "lucide-react";

import { DatabaseNotConfiguredError, getDatabaseKind, getDb } from "@/db";
import * as schema from "@/db/schema";
import { Logo } from "@/components/logo";
import { Otti } from "@/components/otti";
import { AiCheck } from "@/components/status/ai-check";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAiStatus, type AiStatus } from "@/lib/ai";
import type { AiProviderId } from "@/lib/ai/types";
import { isAdminEmail } from "@/lib/admin";
import { isAuthSecretConfigured } from "@/lib/auth";
import { getSession } from "@/lib/session";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Состояние сайта",
  robots: { index: false, follow: false },
};

// Проверка ИИ может занять до минуты (основной и запасной провайдер)
export const maxDuration = 60;

/** Все таблицы, которые описаны в src/db/schema.ts. */
const EXPECTED_TABLES = (Object.values(schema) as unknown[])
  .filter((value): value is PgTable => is(value, PgTable))
  .map((table) => getTableName(table))
  .sort();

type DbCheck =
  | { ok: true; ms: number; foundCount: number; missing: string[]; users: number | null }
  | { ok: false; message: string };

async function checkDatabase(): Promise<DbCheck> {
  const onVercel = Boolean(process.env.VERCEL);
  const started = performance.now();

  try {
    const db = getDb();
    const result = await db.execute(
      sql`select table_name from information_schema.tables where table_schema = 'public'`,
    );
    const ms = Math.round(performance.now() - started);
    const rows = (result as unknown as { rows: { table_name: string }[] }).rows;
    const existing = new Set(rows.map((row) => row.table_name));
    const missing = EXPECTED_TABLES.filter((name) => !existing.has(name));
    const users = existing.has("user") ? await db.$count(schema.user) : null;

    return { ok: true, ms, foundCount: EXPECTED_TABLES.length - missing.length, missing, users };
  } catch (error) {
    console.error("[status] Проверка базы данных не прошла:", error);

    if (error instanceof DatabaseNotConfiguredError) {
      return { ok: false, message: error.message };
    }
    const details =
      !onVercel && error instanceof Error ? ` Ошибка: ${error.message}.` : "";
    const where = onVercel
      ? "Подробности — в разделе Logs проекта на Vercel."
      : "Подробности — в терминале, где запущен сайт.";
    return { ok: false, message: `Не удалось подключиться к базе данных.${details} ${where}` };
  }
}

type RowState = "ok" | "warn" | "fail";

const KEY_NAMES: Record<AiProviderId, string> = {
  gigachat: "GIGACHAT_AUTH_KEY",
  openrouter: "OPENROUTER_API_KEY",
  yandex: "YANDEX_API_KEY и YANDEX_FOLDER_ID",
  mock: "",
};

/** Строка «ИИ-репетитор»: только настройки и расход, без запроса к ИИ. */
function describeAi(ai: AiStatus, onVercel: boolean): { state: RowState; value: string; hint: string } {
  const where = onVercel
    ? "в Settings → Environment Variables на Vercel и сделайте Redeploy"
    : "в файл .env.local и перезапустите сайт";

  if (!ai.enabled) {
    return {
      state: "warn",
      value: "Выключен",
      hint: "Выключен настройкой AI_ENABLED=false. Уроки, словарь и ошибки работают как обычно.",
    };
  }
  if (!ai.provider) {
    return { state: "warn", value: "Не настроен", hint: `Добавьте ключ GIGACHAT_AUTH_KEY ${where}.` };
  }
  if (!ai.provider.configured) {
    return {
      state: "fail",
      value: "Нет ключа",
      hint: `Для ${ai.provider.title} нужен ${KEY_NAMES[ai.provider.id]}. Добавьте его ${where}.`,
    };
  }
  if (ai.provider.id === "mock") {
    return {
      state: "warn",
      value: "Тестовый режим",
      hint: `Ответы-заготовки без настоящего ИИ. Чтобы подключить GigaChat, добавьте ключ GIGACHAT_AUTH_KEY ${where}.`,
    };
  }

  if (ai.today && ai.today.globalRequests >= ai.limits.globalDaily) {
    return {
      state: "warn",
      value: "Лимит исчерпан",
      hint: `Сегодня запросов: ${ai.today.globalRequests} из ${ai.limits.globalDaily}. Лимит обновится в полночь по Москве. Изменить его можно переменной AI_GLOBAL_DAILY_LIMIT.`,
    };
  }

  const parts = [`Модель ${ai.provider.model}`];
  if (ai.fallback) {
    parts.push(`запасной: ${ai.fallback.title}${ai.fallback.configured ? "" : " (нет ключа)"}`);
  }
  if (ai.today) {
    parts.push(`сегодня запросов: ${ai.today.globalRequests} из ${ai.limits.globalDaily}`);
  }
  return { state: "ok", value: ai.provider.title, hint: `${parts.join(" · ")}.` };
}

const stateIcon: Record<RowState, { icon: LucideIcon; className: string; label: string }> = {
  ok: { icon: CircleCheck, className: "text-success", label: "в порядке" },
  warn: { icon: CircleAlert, className: "text-streak-text", label: "есть замечание" },
  fail: { icon: CircleX, className: "text-destructive", label: "ошибка" },
};

function StatusRow({
  icon: Icon,
  title,
  state,
  value,
  hint,
}: {
  icon: LucideIcon;
  title: string;
  state: RowState;
  value: string;
  hint: string;
}) {
  const { icon: StateIcon, className, label } = stateIcon[state];
  return (
    <li className="flex gap-3 py-4 first:pt-0 last:pb-0">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        <Icon className="size-5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5">
          <p className="font-extrabold whitespace-nowrap">{title}</p>
          <p className={cn("flex items-center gap-1.5 font-bold whitespace-nowrap", className)}>
            <StateIcon className="size-5" aria-hidden />
            {value}
            <span className="sr-only"> — {label}</span>
          </p>
        </div>
        <p className="mt-0.5 text-sm break-words text-muted-foreground">{hint}</p>
      </div>
    </li>
  );
}

export default async function StatusPage() {
  // Страница проверяется заново при каждом открытии
  await connection();

  const onVercel = Boolean(process.env.VERCEL);
  const commit = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7);
  const kind = getDatabaseKind();
  const db = await checkDatabase();
  const authConfigured = isAuthSecretConfigured();
  const ai = describeAi(await getAiStatus(), onVercel);
  const session = db.ok && authConfigured ? await getSession().catch(() => null) : null;
  // Подробности (адреса, модели, число учеников, расход ИИ) — только владельцу сайта
  const admin = isAdminEmail(session?.user.email);
  const allOk = db.ok && db.missing.length === 0 && authConfigured && ai.state !== "fail";

  const checkedAt = new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "long",
    timeStyle: "medium",
    timeZone: "Europe/Moscow",
  }).format(new Date());

  const siteHint = onVercel
    ? `Опубликован на Vercel${commit ? `, версия ${commit}` : ""}`
    : "Запущен на этом компьютере";

  const dbHint = db.ok
    ? `${kind === "neon" ? "Облачная база Neon" : "Локальная база в папке .data"} · ответ за ${db.ms} мс`
    : db.message;

  let tablesState: RowState = "fail";
  let tablesValue = "Не проверены";
  let tablesHint = "Сначала нужно подключить базу данных.";
  if (db.ok) {
    const total = EXPECTED_TABLES.length;
    if (db.missing.length === 0) {
      tablesState = "ok";
      tablesValue = `${total} из ${total}`;
      tablesHint = "Все таблицы на месте.";
    } else {
      tablesState = "warn";
      tablesValue = `${db.foundCount} из ${total}`;
      tablesHint =
        `Не хватает: ${db.missing.join(", ")}. ` +
        (onVercel ? "Сделайте Redeploy на Vercel." : "Перезапустите сайт командой npm run dev.");
    }
  }

  let authState: RowState = "ok";
  let authValue = "Работают";
  let authHint =
    db.ok && db.users !== null ? `Зарегистрировано учеников: ${db.users}` : "Готовы к работе.";
  if (!authConfigured) {
    authState = "fail";
    authValue = "Не настроены";
    authHint =
      "Нет секретного ключа BETTER_AUTH_SECRET. Добавьте его в Settings → Environment Variables на Vercel и сделайте Redeploy.";
  } else if (!db.ok) {
    authState = "fail";
    authValue = "Не работают";
    authHint = "Для входа нужна база данных.";
  }

  const rows = [
    { icon: Globe, title: "Сайт", state: "ok" as RowState, value: "Работает", hint: siteHint, publicHint: "Сайт открыт." },
    {
      icon: Database,
      title: "База данных",
      state: (db.ok ? "ok" : "fail") as RowState,
      value: db.ok ? "Подключена" : "Не подключена",
      hint: dbHint,
      publicHint: db.ok ? "Отвечает." : "Нет связи с базой данных.",
    },
    {
      icon: Table2,
      title: "Таблицы",
      state: tablesState,
      value: admin ? tablesValue : tablesState === "ok" ? "В порядке" : "Есть проблема",
      hint: tablesHint,
      publicHint: tablesState === "ok" ? "Всё на месте." : "Владелец сайта увидит подробности.",
    },
    {
      icon: KeyRound,
      title: "Вход и регистрация",
      state: authState,
      value: authValue,
      hint: authHint,
      publicHint: authState === "ok" ? "Готовы к работе." : "Вход временно не работает.",
    },
    {
      icon: Sparkles,
      title: "ИИ-репетитор",
      state: ai.state,
      value: admin || ai.state !== "ok" ? ai.value : "Работает",
      hint: ai.hint,
      publicHint:
        ai.state === "ok"
          ? "Отти на связи."
          : ai.value === "Тестовый режим"
            ? "Отти отвечает заготовками."
            : ai.value === "Лимит исчерпан"
              ? "Отти отдыхает до завтра."
              : "Отти сейчас недоступен.",
    },
  ];

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex h-16 w-full max-w-xl items-center justify-between px-4">
        <Logo />
        <ThemeToggle />
      </header>

      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 pt-4 pb-16">
        <div className="flex items-center gap-4">
          <Otti size={72} mood={allOk ? "happy" : "confused"} />
          <div>
            <h1 className="text-2xl font-black tracking-tight md:text-3xl">Состояние сайта</h1>
            <p className="text-muted-foreground">
              {allOk ? "Всё работает." : "Есть проблема — подробности ниже."}
            </p>
          </div>
        </div>

        <Card>
          <ul className="divide-y">
            {rows.map((row) => (
              <StatusRow
                key={row.title}
                icon={row.icon}
                title={row.title}
                state={row.state}
                value={row.value}
                hint={admin ? row.hint : row.publicHint}
              />
            ))}
          </ul>
        </Card>

        {admin ? (
          <Card>
            <CardHeader>
              <CardTitle>Проверка ИИ</CardTitle>
              <CardDescription>
                Отправляет ИИ короткий вопрос и показывает ответ — так видно, что ключ работает.
              </CardDescription>
            </CardHeader>
            <AiCheck signedIn={Boolean(session)} />
          </Card>
        ) : (
          <p className="text-center text-sm text-muted-foreground">
            Подробности и проверку ИИ видит только владелец сайта
            {session ? "." : " — после входа в свой аккаунт."}
          </p>
        )}

        <p className="text-center text-sm text-muted-foreground">Проверено: {checkedAt} (МСК)</p>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild>
            {/* Обычная ссылка: страница полностью перезагружается и проверяет всё заново */}
            <a href="/status">
              <RefreshCw aria-hidden />
              Проверить ещё раз
            </a>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">На главную</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
