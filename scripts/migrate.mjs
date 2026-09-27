/**
 * Создаёт и обновляет таблицы в базе данных по файлам из папки drizzle/.
 *
 * Запускается автоматически:
 * - перед `npm run dev` — для локальной базы в папке .data;
 * - при каждой публикации на Vercel — для облачной базы Neon.
 *
 * Можно запустить вручную: npm run db:migrate (когда сайт остановлен).
 */
import { mkdirSync } from "node:fs";
import nextEnv from "@next/env";

// Читаем .env.local и другие файлы настроек так же, как это делает Next.js
nextEnv.loadEnvConfig(process.cwd());

const MIGRATIONS_FOLDER = "./drizzle";
const LOCAL_DB_DIR = ".data/pglite";

const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

async function migrateNeon(connectionString) {
  const { Pool } = await import("pg");
  const { drizzle } = await import("drizzle-orm/node-postgres");
  const { migrate } = await import("drizzle-orm/node-postgres/migrator");

  const pool = new Pool({ connectionString, max: 1 });
  try {
    await migrate(drizzle(pool), { migrationsFolder: MIGRATIONS_FOLDER });
  } finally {
    await pool.end();
  }
  console.log("✓ База данных Neon: таблицы в порядке");
}

async function migrateLocal() {
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const { migrate } = await import("drizzle-orm/pglite/migrator");

  mkdirSync(LOCAL_DB_DIR, { recursive: true });
  const client = new PGlite(LOCAL_DB_DIR);
  try {
    await migrate(drizzle(client), { migrationsFolder: MIGRATIONS_FOLDER });
  } finally {
    await client.close();
  }
  console.log("✓ Локальная база данных: таблицы в порядке (папка .data)");
}

try {
  if (url) {
    await migrateNeon(url);
  } else if (process.env.RENDER) {
    console.error(
      "✗ На Render не задана переменная DATABASE_URL. Откройте сервис → Environment, добавьте строку " +
        "подключения из Neon (и DATABASE_URL_UNPOOLED), сохраните и нажмите Manual Deploy.",
    );
    process.exit(1);
  } else if (process.env.VERCEL) {
    console.warn(
      "⚠ База данных ещё не подключена к проекту Vercel (нет DATABASE_URL). " +
        "Сайт опубликуется, но без базы. Подключите Neon во вкладке Storage и сделайте Redeploy.",
    );
  } else {
    await migrateLocal();
  }
} catch (error) {
  console.error("✗ Не удалось обновить таблицы в базе данных.");
  console.error(error);
  process.exit(1);
}
