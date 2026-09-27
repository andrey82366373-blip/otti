/** Профиль ученика: уровень, цель, дневная цель, XP и серия дней. */
import "server-only";

import { cache } from "react";
import { eq } from "drizzle-orm";

import { getDb } from "@/db";
import { profiles } from "@/db/schema";

export type Profile = typeof profiles.$inferSelect;

async function findProfile(userId: string): Promise<Profile | undefined> {
  const [profile] = await getDb()
    .select()
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1);
  return profile;
}

/** Возвращает профиль ученика. Если его почему-то нет — создаёт с настройками по умолчанию. */
export const getProfile = cache(async (userId: string): Promise<Profile> => {
  const existing = await findProfile(userId);
  if (existing) return existing;

  await getDb().insert(profiles).values({ userId }).onConflictDoNothing();
  const created = await findProfile(userId);
  if (!created) {
    throw new Error("Не удалось создать профиль ученика");
  }
  return created;
});
