"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck, LoaderCircle, Trash2 } from "lucide-react";

import { FormError, PasswordField } from "@/components/auth/form-parts";
import { Button } from "@/components/ui/button";
import { authClient, getAuthErrorMessage } from "@/lib/auth-client";

const NETWORK_ERROR = "Нет связи с сервером. Проверь интернет и попробуй ещё раз.";

/** Смена пароля и удаление аккаунта. */
export function AccountSecurity() {
  return (
    <div className="flex flex-col gap-6">
      <ChangePasswordForm />
      <div className="border-t pt-5">
        <DeleteAccount />
      </div>
    </div>
  );
}

function ChangePasswordForm() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const currentPassword = String(data.get("currentPassword") ?? "");
    const newPassword = String(data.get("newPassword") ?? "");

    setDone(false);
    if (!currentPassword) {
      setError("Введи текущий пароль.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Новый пароль слишком короткий — нужно минимум 8 символов.");
      return;
    }
    if (newPassword === currentPassword) {
      setError("Новый пароль совпадает с текущим.");
      return;
    }

    setPending(true);
    setError(null);
    try {
      const { error: authError } = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      });
      if (authError) {
        setError(
          authError.code === "INVALID_PASSWORD" ? "Текущий пароль указан неверно." : getAuthErrorMessage(authError),
        );
      } else {
        setDone(true);
        form.reset();
      }
    } catch {
      setError(NETWORK_ERROR);
    }
    setPending(false);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <h3 className="font-extrabold">Сменить пароль</h3>
      <PasswordField
        name="currentPassword"
        label="Текущий пароль"
        autoComplete="current-password"
        maxLength={128}
        disabled={pending}
      />
      <PasswordField
        name="newPassword"
        label="Новый пароль"
        autoComplete="new-password"
        hint="Минимум 8 символов. На других устройствах нужно будет войти заново."
        maxLength={128}
        disabled={pending}
      />
      <FormError message={error} />
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="outline" disabled={pending}>
          {pending && <LoaderCircle className="animate-spin" aria-hidden />}
          {pending ? "Меняем…" : "Сменить пароль"}
        </Button>
        <p role="status" className="flex items-center gap-1.5 text-sm font-bold text-success">
          {done && (
            <>
              <CircleCheck className="size-4" aria-hidden />
              Пароль изменён
            </>
          )}
        </p>
      </div>
    </form>
  );
}

function DeleteAccount() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleted, setDeleted] = useState(false);

  async function handleDelete(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const password = String(new FormData(event.currentTarget).get("deletePassword") ?? "");
    if (!password) {
      setError("Введи пароль, чтобы подтвердить удаление.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const { error: authError } = await authClient.deleteUser({ password });
      if (authError) {
        setError(authError.code === "INVALID_PASSWORD" ? "Пароль указан неверно." : getAuthErrorMessage(authError));
        setPending(false);
        return;
      }
      setDeleted(true);
      setTimeout(() => {
        router.replace("/");
        router.refresh();
      }, 2500);
    } catch {
      setError(NETWORK_ERROR);
      setPending(false);
    }
  }

  if (deleted) {
    return (
      <p role="status" className="font-bold">
        Аккаунт и все данные удалены. Спасибо, что учился с Отти!
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <h3 className="font-extrabold">Удалить аккаунт</h3>
      <p className="text-sm text-muted-foreground">
        Удалятся прогресс, словарь, ошибки и все разговоры с Отти. Восстановить их будет нельзя.
      </p>
      {!open ? (
        <Button
          type="button"
          variant="outline"
          className="self-start text-destructive"
          onClick={() => setOpen(true)}
          aria-expanded={false}
        >
          <Trash2 aria-hidden />
          Удалить аккаунт
        </Button>
      ) : (
        <form
          onSubmit={handleDelete}
          noValidate
          className="flex flex-col gap-4 rounded-2xl border-2 border-destructive/40 bg-destructive-soft p-4"
        >
          <p className="font-bold text-destructive">Точно удалить аккаунт навсегда?</p>
          <PasswordField
            name="deletePassword"
            label="Пароль для подтверждения"
            autoComplete="current-password"
            maxLength={128}
            disabled={pending}
          />
          <FormError message={error} />
          <div className="flex flex-wrap gap-3">
            <Button
              type="submit"
              disabled={pending}
              className="bg-destructive text-destructive-foreground shadow-[0_3px_0_0_color-mix(in_oklab,var(--destructive)_70%,black)] hover:bg-destructive/90"
            >
              {pending && <LoaderCircle className="animate-spin" aria-hidden />}
              {pending ? "Удаляем…" : "Удалить навсегда"}
            </Button>
            <Button type="button" variant="outline" disabled={pending} onClick={() => setOpen(false)}>
              Отмена
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
