import type { Metadata } from "next";
import Link from "next/link";

import { SignInForm } from "@/components/auth/sign-in-form";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Вход" };

export default function SignInPage() {
  return (
    <>
      <PageHeader title="С возвращением!" description="Войди, чтобы продолжить обучение." />
      <Card>
        <SignInForm />
      </Card>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Нет аккаунта?{" "}
        <Link href="/sign-up" className="font-bold text-primary hover:underline">
          Зарегистрироваться
        </Link>
      </p>
    </>
  );
}
