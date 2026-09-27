/** Вход, регистрация и выход из браузера. Запросы уходят на /api/auth текущего сайта. */
import { createAuthClient } from "better-auth/client";

export const authClient = createAuthClient();

type AuthError = { code?: string; status?: number } | null | undefined;

/** Переводит ошибку входа или регистрации в понятный текст на русском. */
export function getAuthErrorMessage(error: AuthError): string {
  if (!error) return "Что-то пошло не так. Попробуй ещё раз.";
  if (error.status === 429) {
    return "Слишком много попыток. Подожди минуту и попробуй снова.";
  }
  switch (error.code) {
    case "USER_ALREADY_EXISTS":
    case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL":
      return "Этот e-mail уже зарегистрирован. Попробуй войти.";
    case "INVALID_EMAIL_OR_PASSWORD":
    case "INVALID_PASSWORD":
    case "USER_NOT_FOUND":
    case "CREDENTIAL_ACCOUNT_NOT_FOUND":
      return "Неверный e-mail или пароль.";
    case "INVALID_EMAIL":
      return "Проверь e-mail: похоже, в нём опечатка.";
    case "PASSWORD_TOO_SHORT":
      return "Пароль слишком короткий — нужно минимум 8 символов.";
    case "PASSWORD_TOO_LONG":
      return "Пароль слишком длинный — не больше 128 символов.";
    case "INVALID_ORIGIN":
    case "MISSING_OR_NULL_ORIGIN":
      return "Вход с этого адреса не разрешён. Открой сайт по основной ссылке.";
    default:
      return "Что-то пошло не так. Попробуй ещё раз через минуту.";
  }
}
