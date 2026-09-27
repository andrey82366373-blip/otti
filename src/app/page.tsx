import Link from "next/link";
import { MessageCircle, RotateCcw, Route, Sparkles } from "lucide-react";

import { Logo } from "@/components/logo";
import { Otti } from "@/components/otti";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const features = [
  {
    icon: Route,
    title: "Понятный маршрут",
    text: "Уровень → раздел → тема → урок. Следующий урок открывается, когда пройден предыдущий.",
    iconClass: "bg-secondary text-primary",
  },
  {
    icon: MessageCircle,
    title: "Репетитор Отти",
    text: "Говорит на твоём уровне, мягко исправляет ошибки и задаёт следующий вопрос.",
    iconClass: "bg-river-soft text-river",
  },
  {
    icon: RotateCcw,
    title: "Работа над ошибками",
    text: "Каждая ошибка сохраняется, чтобы потренировать её ещё раз.",
    iconClass: "bg-streak/15 text-streak",
  },
];

/** Пример занятия с репетитором — показывает формат исправления ошибок. */
function TutorPreview() {
  return (
    <div className="relative">
      <div
        aria-hidden
        className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-linear-to-br from-secondary via-river-soft to-transparent opacity-80 blur-2xl"
      />
      <Card className="gap-3 p-4 md:p-5">
        <p className="sr-only">Пример занятия с репетитором</p>

        <div className="flex items-end gap-2">
          <Otti size={44} />
          <p className="rounded-2xl rounded-bl-md bg-muted px-4 py-2.5 font-semibold">
            How was your weekend?
          </p>
        </div>

        <p className="ml-auto max-w-[80%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 font-semibold text-primary-foreground">
          I am go to the park.
        </p>

        <dl className="grid gap-2 rounded-xl border-2 border-dashed border-river/40 bg-river-soft/60 p-3.5 text-sm">
          <div>
            <dt className="text-xs font-extrabold text-muted-foreground uppercase">Твой ответ</dt>
            <dd className="line-through decoration-destructive/70 decoration-2">I am go to the park.</dd>
          </div>
          <div>
            <dt className="text-xs font-extrabold text-muted-foreground uppercase">Правильный вариант</dt>
            <dd className="font-bold text-success">I went to the park.</dd>
          </div>
          <div>
            <dt className="text-xs font-extrabold text-muted-foreground uppercase">Почему</dt>
            <dd>Выходные уже прошли — нужно прошедшее время: go → went. Слово am здесь лишнее.</dd>
          </div>
          <div>
            <dt className="text-xs font-extrabold text-muted-foreground uppercase">Более естественно</dt>
            <dd className="font-bold">I went for a walk in the park.</dd>
          </div>
        </dl>

        <div className="flex items-end gap-2">
          <Otti size={44} mood="wink" />
          <p className="rounded-2xl rounded-bl-md bg-muted px-4 py-2.5 font-semibold">
            Nice! What did you do there?
          </p>
        </div>
      </Card>
    </div>
  );
}

export default function WelcomePage() {
  return (
    <div className="flex min-h-dvh flex-col overflow-x-clip">
      <header className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 md:px-8">
        <Logo />
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Button asChild variant="ghost">
            <Link href="/sign-in">Войти</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 pt-8 pb-16 md:grid-cols-2 md:px-8 md:pt-16 md:pb-24">
          <div>
            <Badge variant="river">
              <Sparkles aria-hidden />
              От A1 до B2 · бесплатно
            </Badge>
            <h1 className="mt-4 text-4xl leading-[1.05] font-extrabold tracking-tight text-balance md:text-6xl">
              Английский <span className="text-primary">маленькими шагами</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground">
              Уроки на 5–10 минут, понятный маршрут и ИИ-репетитор Отти: он говорит
              с тобой по-английски, а ошибки объясняет по-русски.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/sign-up">Начать бесплатно</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/sign-in">У меня есть аккаунт</Link>
              </Button>
            </div>
          </div>

          <TutorPreview />
        </section>

        <section aria-labelledby="features-title" className="mx-auto w-full max-w-6xl px-4 pb-20 md:px-8">
          <h2 id="features-title" className="sr-only">
            Что есть в Otti
          </h2>
          <ul className="grid gap-4 md:grid-cols-3">
            {features.map(({ icon: Icon, title, text, iconClass }) => (
              <li key={title}>
                <Card className="h-full">
                  <span className={`flex size-11 items-center justify-center rounded-xl ${iconClass}`}>
                    <Icon className="size-6" aria-hidden />
                  </span>
                  <div>
                    <h3 className="text-lg font-extrabold">{title}</h3>
                    <p className="mt-1 text-muted-foreground">{text}</p>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        Otti · учебный проект · 2026 ·{" "}
        <Link href="/status" className="underline-offset-4 hover:text-foreground hover:underline">
          Состояние сайта
        </Link>{" "}
        ·{" "}
        <Link href="/privacy" className="underline-offset-4 hover:text-foreground hover:underline">
          Персональные данные
        </Link>
      </footer>
    </div>
  );
}
