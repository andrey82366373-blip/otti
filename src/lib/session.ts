/** Проверка, вошёл ли ученик. Используется на сервере в страницах и макетах. */
import "server-only";

import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getAuth } from "@/lib/auth";

/** Текущая сессия или null, если ученик не вошёл. Один запрос на страницу. */
export const getSession = cache(async () => {
  // Сначала читаем заголовки запроса: так Next.js не пытается собрать страницу заранее
  const requestHeaders = await headers();
  return getAuth().api.getSession({ headers: requestHeaders });
});

/** Текущая сессия. Если ученик не вошёл — отправляет на страницу входа. */
export async function requireSession() {
  const session = await getSession();
  if (!session) {
    redirect("/sign-in");
  }
  return session;
}
