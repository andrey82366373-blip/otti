import type { Metadata } from "next";
import Link from "next/link";

import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata: Metadata = {
  title: "Персональные данные",
  description: "Какие данные собирает Otti, зачем и как их удалить.",
};

/** Понятное описание того, как Otti обращается с данными учеников. */
export default function PrivacyPage() {
  const contact = process.env.CONTACT_EMAIL?.trim();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex h-16 w-full max-w-2xl items-center justify-between px-4">
        <Logo />
        <ThemeToggle />
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pt-4 pb-16">
        <h1 className="text-3xl font-black tracking-tight">Твои данные в Otti</h1>
        <p className="mt-2 text-muted-foreground">
          Коротко и по делу: что мы храним, зачем, кому передаём и как всё удалить.
        </p>

        <div className="mt-8 flex flex-col gap-7 leading-relaxed [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-extrabold [&_li]:ml-5 [&_li]:list-disc">
          <section>
            <h2>Что мы храним</h2>
            <ul className="flex flex-col gap-1">
              <li>Имя и e-mail — чтобы ты мог войти и Отти обращался к тебе по имени.</li>
              <li>Пароль — только в зашифрованном виде (хеш). Прочитать его не может никто, даже владелец сайта.</li>
              <li>Настройки обучения: уровень, цель, время в день, язык объяснений.</li>
              <li>Прогресс: пройденные уроки, ответы в заданиях, опыт, серия дней, достижения.</li>
              <li>Словарь, работа над ошибками и разговоры с Отти вместе с итогами занятий.</li>
              <li>
                Технические данные: cookie для входа и IP-адрес — только чтобы защищать аккаунты от подбора
                пароля и ограничивать число запросов.
              </li>
            </ul>
          </section>

          <section>
            <h2>Зачем</h2>
            <p>
              Только чтобы работало обучение: сохранялся прогресс, Отти помнил твои слова и ошибки, а аккаунт был
              защищён. Мы не показываем рекламу, не используем счётчики аналитики и не продаём данные.
            </p>
          </section>

          <section>
            <h2>Где хранятся</h2>
            <p>
              Сайт размещён на сервисе Vercel, данные хранятся в облачной базе данных Neon (серверы в Европе).
              Соединение с сайтом защищено (HTTPS).
            </p>
          </section>

          <section>
            <h2>ИИ-репетитор</h2>
            <p>
              Чтобы Отти мог ответить, твои сообщения в чате и ответы «своими словами» в уроках отправляются
              ИИ-сервису — GigaChat (ПАО «Сбербанк»), а при его сбое — запасному сервису, если он подключён
              (OpenRouter или YandexGPT). Вместе с сообщением передаются твоё имя, уровень и слова из словаря —
              чтобы ответ подходил именно тебе. E-mail и пароль ИИ не получает.
            </p>
            <p className="mt-2 font-bold">
              Не пиши Отти пароли, номера карт, адреса и другие личные данные.
            </p>
          </section>

          <section>
            <h2>Голосовой ввод</h2>
            <p>
              Речь распознаёт сам браузер (например, Chrome использует сервис Google). Otti получает только
              готовый текст — запись голоса не хранится.
            </p>
          </section>

          <section>
            <h2>Как удалить данные</h2>
            <p>
              В{" "}
              <Link href="/profile" className="font-bold text-primary hover:underline">
                профиле
              </Link>{" "}
              → «Безопасность» → «Удалить аккаунт». Аккаунт и все данные удаляются сразу и навсегда.
            </p>
          </section>

          <section>
            <h2>Вопросы</h2>
            <p>
              {contact ? (
                <>
                  Напиши владельцу сайта:{" "}
                  <a href={`mailto:${contact}`} className="font-bold text-primary hover:underline">
                    {contact}
                  </a>
                  .
                </>
              ) : (
                "Otti — учебный проект. Контакт для вопросов о данных владелец сайта добавит перед открытым запуском."
              )}
            </p>
          </section>
        </div>

        <p className="mt-10">
          <Link href="/" className="font-bold text-primary hover:underline">
            ← На главную
          </Link>
        </p>
      </main>
    </div>
  );
}
