"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";

import { Field, FormError, PasswordField, focusFirstError } from "@/components/auth/form-parts";
import { Button } from "@/components/ui/button";
import { authClient, getAuthErrorMessage } from "@/lib/auth-client";
import { signUpSchema, validateForm, type FieldErrors } from "@/lib/validation/auth";

export function SignUpForm() {
  const router = useRouter();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));

    const check = validateForm(signUpSchema, values);
    if (!check.ok) {
      setErrors(check.errors);
      setFormError(null);
      focusFirstError(form, check.errors);
      return;
    }

    setErrors({});
    setFormError(null);
    setPending(true);

    try {
      const { error } = await authClient.signUp.email(check.data);
      if (error) {
        setFormError(getAuthErrorMessage(error));
        setPending(false);
        return;
      }
      router.replace("/onboarding");
      router.refresh();
    } catch {
      setFormError("Нет связи с сервером. Проверь интернет и попробуй ещё раз.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <Field
        name="name"
        label="Имя"
        autoComplete="given-name"
        placeholder="Например, Аня"
        maxLength={50}
        error={errors.name}
        disabled={pending}
      />
      <Field
        name="email"
        label="E-mail"
        type="email"
        inputMode="email"
        autoComplete="email"
        autoCapitalize="none"
        spellCheck={false}
        placeholder="you@example.com"
        error={errors.email}
        disabled={pending}
      />
      <PasswordField
        name="password"
        label="Пароль"
        autoComplete="new-password"
        hint="Минимум 8 символов"
        maxLength={128}
        error={errors.password}
        disabled={pending}
      />

      <FormError message={formError} />

      <Button type="submit" size="lg" disabled={pending} className="mt-1 w-full">
        {pending && <LoaderCircle className="size-5 animate-spin" aria-hidden />}
        {pending ? "Создаём аккаунт…" : "Создать аккаунт"}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Создавая аккаунт, ты соглашаешься с тем,{" "}
        <Link href="/privacy" className="font-bold text-primary hover:underline">
          как Otti обрабатывает данные
        </Link>
        .
      </p>
    </form>
  );
}
