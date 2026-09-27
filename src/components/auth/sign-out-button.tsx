"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

/** Кнопка «Выйти»: завершает сессию и возвращает на главную. */
export function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  async function handleClick() {
    setPending(true);
    setFailed(false);
    try {
      const { error } = await authClient.signOut();
      if (error) throw error;
      router.replace("/");
      router.refresh();
    } catch {
      setFailed(true);
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button variant="outline" onClick={handleClick} disabled={pending} className="w-full sm:w-auto">
        {pending ? <LoaderCircle className="animate-spin" aria-hidden /> : <LogOut aria-hidden />}
        {pending ? "Выходим…" : "Выйти из аккаунта"}
      </Button>
      {failed && (
        <p role="alert" className="text-sm font-semibold text-destructive">
          Не получилось выйти. Проверь интернет и попробуй ещё раз.
        </p>
      )}
    </div>
  );
}
