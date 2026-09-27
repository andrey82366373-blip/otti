/** Правила проверки полей в формах входа и регистрации. */
import { z } from "zod";

const email = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Введи e-mail")
  .pipe(z.email("Проверь e-mail: похоже, в нём опечатка"));

export const signUpSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Как тебя зовут?")
    .max(50, "Имя слишком длинное — до 50 символов"),
  email,
  password: z
    .string()
    .min(8, "Пароль — минимум 8 символов")
    .max(128, "Пароль слишком длинный — до 128 символов"),
});

export const signInSchema = z.object({
  email,
  password: z.string().min(1, "Введи пароль"),
});

export type FieldErrors = Partial<Record<string, string>>;

/** Проверяет данные формы и возвращает первую ошибку для каждого поля. */
export function validateForm<T>(
  schema: z.ZodType<T>,
  values: Record<string, unknown>,
): { ok: true; data: T } | { ok: false; errors: FieldErrors } {
  const result = schema.safeParse(values);
  if (result.success) {
    return { ok: true, data: result.data };
  }
  const errors: FieldErrors = {};
  for (const issue of result.error.issues) {
    const field = String(issue.path[0] ?? "form");
    errors[field] ??= issue.message;
  }
  return { ok: false, errors };
}
