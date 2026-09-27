import Link from "next/link";

import { Otti } from "@/components/otti";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <Otti size={120} mood="confused" />
      <p className="text-sm font-extrabold tracking-wide text-river uppercase">Ошибка 404</p>
      <h1 className="text-3xl font-black tracking-tight">Такой страницы нет</h1>
      <p className="max-w-sm text-muted-foreground">
        Возможно, ссылка устарела или в адресе опечатка. Отти тоже поискал — не нашёл.
      </p>
      <Button asChild size="lg" className="mt-2">
        <Link href="/">На главную</Link>
      </Button>
    </main>
  );
}
