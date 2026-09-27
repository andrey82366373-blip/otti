/**
 * Владелец сайта. Подробности на странице /status и проверка ИИ видны только ему.
 * На Vercel задайте переменную ADMIN_EMAILS — свой e-mail (или несколько через запятую).
 * При разработке на компьютере (npm run dev) владельцем считается любой.
 */
import "server-only";

export function isAdminEmail(email: string | null | undefined): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  const admins = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  return Boolean(email && admins.includes(email.trim().toLowerCase()));
}
