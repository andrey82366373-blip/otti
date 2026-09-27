import type { Metadata } from "next";
import Link from "next/link";

import { SignUpForm } from "@/components/auth/sign-up-form";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Регистрация" };

export default function SignUpPage() {
  return (
    <>
      <PageHeader title="Создай аккаунт" description="Прогресс, слова и ошибки будут сохраняться." />
      <Card>
        <SignUpForm />
      </Card>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Уже есть аккаунт?{" "}
        <Link href="/sign-in" className="font-bold text-primary hover:underline">
          Войти
        </Link>
      </p>
    </>
  );
}
