/**
 * Подключение к базе данных.
 *
 * - В интернете (на Vercel) используется облачная база Neon — адрес берётся из DATABASE_URL.
 * - На компьютере, если DATABASE_URL не задан, используется локальная база PGlite:
 *   это настоящий PostgreSQL, который хранится в папке .data и не требует настройки.
 */
import "server-only";

import { PGlite } from "@electric-sql/pglite";
import { attachDatabasePool } from "@vercel/functions";
import { drizzle as drizzleNodePg } from "drizzle-orm/node-postgres";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { Pool } from "pg";

import * as schema from "./schema";

export type Database = PgDatabase<PgQueryResultHKT, typeof schema>;
export type DatabaseKind = "neon" | "local";

/** Папка локальной базы. Тот же путь использует scripts/migrate.mjs. */
export const LOCAL_DB_DIR = ".data/pglite";

/** Понятная ошибка, если на сервере забыли подключить базу. */
export class DatabaseNotConfiguredError extends Error {
  constructor() {
    super(
      "База данных не подключена: в настройках проекта Vercel нет переменной DATABASE_URL. " +
        "Подключите базу Neon во вкладке Storage и сделайте Redeploy.",
    );
    this.name = "DatabaseNotConfiguredError";
  }
}

/** Какая база используется сейчас: облачная или локальная. */
export function getDatabaseKind(): DatabaseKind {
  return process.env.DATABASE_URL ? "neon" : "local";
}

function createDatabase(): Database {
  const url = process.env.DATABASE_URL;

  if (url) {
    const pool = new Pool({ connectionString: url, max: 5 });
    if (process.env.VERCEL) {
      // Корректно закрывает неиспользуемые соединения между запросами на Vercel
      attachDatabasePool(pool);
    }
    return drizzleNodePg(pool, { schema });
  }

  if (process.env.VERCEL) {
    throw new DatabaseNotConfiguredError();
  }

  const client = new PGlite(LOCAL_DB_DIR);
  return drizzlePglite(client, { schema }) as unknown as Database;
}

// Одно подключение на весь сервер (и при перезагрузке кода во время разработки)
const globalForDb = globalThis as unknown as { ottiDb?: Database };

/** Возвращает подключение к базе. Создаёт его при первом вызове. */
export function getDb(): Database {
  if (!globalForDb.ottiDb) {
    globalForDb.ottiDb = createDatabase();
  }
  return globalForDb.ottiDb;
}
