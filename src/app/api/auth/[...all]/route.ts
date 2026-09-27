/**
 * Все запросы входа и регистрации: /api/auth/sign-up/email, /api/auth/sign-in/email и другие.
 * Их обрабатывает библиотека Better Auth.
 */
import { getAuth } from "@/lib/auth";

export async function GET(request: Request) {
  return getAuth().handler(request);
}

export async function POST(request: Request) {
  return getAuth().handler(request);
}
