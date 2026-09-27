"use server";

/** Ответ на карточку словаря: «Помню» или «Не помню». */
import { revalidatePath } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/db";
import { userWords, type WordStatus } from "@/db/schema";
import { todayInTimezone } from "@/lib/dates";
import { getProfile } from "@/lib/profile";
import { recordXp } from "@/lib/progress-write";
import { requireSession } from "@/lib/session";
import { earnsReviewXp, scheduleNext } from "@/lib/words";

const reviewSchema = z.object({
  wordId: z.uuid(),
  remembered: z.boolean(),
});

export type ReviewWordResult =
  | { ok: true; xpEarned: number; status: WordStatus; goalReachedNow: boolean }
  | { ok: false; error: string };

/**
 * Сохраняет ответ и обновляет расписание слова.
 * 1 XP даётся за «Помню», только если у слова подошёл срок повторения.
 */
export async function reviewWord(input: {
  wordId: string;
  remembered: boolean;
}): Promise<ReviewWordResult> {
  const { user } = await requireSession();

  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Не удалось распознать ответ." };
  }
  const { wordId, remembered } = parsed.data;

  try {
    const db = getDb();
    const [word] = await db
      .select()
      .from(userWords)
      .where(and(eq(userWords.id, wordId), eq(userWords.userId, user.id)))
      .limit(1);
    if (!word) {
      return { ok: false, error: "Слово не найдено в словаре." };
    }

    const now = new Date();
    const next = scheduleNext(word, remembered, now);
    const profile = await getProfile(user.id);
    let xpEarned = 0;
    let goalReachedNow = false;

    await db.transaction(async (tx) => {
      // Обновляем, только если слово не изменилось с момента чтения —
      // два одновременных ответа не дадут опыт дважды
      const updated = await tx
        .update(userWords)
        .set({
          correctStreak: next.correctStreak,
          intervalDays: next.intervalDays,
          status: next.status,
          nextReviewAt: next.nextReviewAt,
          updatedAt: now,
        })
        .where(
          and(
            eq(userWords.id, word.id),
            // В базе время хранится точнее миллисекунд — сравниваем с точностью до них
            sql`date_trunc('milliseconds', ${userWords.updatedAt}) = ${word.updatedAt}`,
          ),
        )
        .returning({ id: userWords.id });

      if (updated.length > 0 && earnsReviewXp(word, remembered, next.due, now)) {
        xpEarned = 1;
      }

      if (xpEarned > 0) {
        const result = await recordXp(tx, {
          userId: user.id,
          profile,
          today: todayInTimezone(profile.timezone),
          xp: xpEarned,
        });
        goalReachedNow = result.goalReachedNow;
      }
    });

    revalidatePath("/", "layout");
    return { ok: true, xpEarned, status: next.status, goalReachedNow };
  } catch (error) {
    console.error("[words] Не удалось сохранить повторение:", error);
    return { ok: false, error: "Не удалось сохранить ответ. Проверь интернет." };
  }
}
