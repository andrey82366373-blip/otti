"use client";

import { useEffect } from "react";
import Link from "next/link";

import { Otti } from "@/components/otti";
import { Button } from "@/components/ui/button";

/** Показывается, если на странице произошла непредвиденная ошибка. */
export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <Otti size={120} mood="confused" />
      <h1 className="text-3xl font-black tracking-tight">Что-то пошло не так</h1>
      <p className="max-w-sm text-muted-foreground">
        Попробуй ещё раз. Если ошибка повторится — обнови страницу или вернись на главную.
      </p>
      <div className="mt-2 flex flex-col gap-3 sm:flex-row">
        <Button size="lg" onClick={() => retry()}>
          Попробовать снова
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/">На главную</Link>
        </Button>
      </div>
    </main>
  );
}
