import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Award, BookOpenText, GraduationCap, Landmark, School } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getIeltsProfile } from "@/lib/exams/store";
import { requireSession } from "@/lib/session";

export const metadata: Metadata = { title: "Подготовка к экзаменам" };

const FUTURE = [
  {
    icon: Landmark,
    title: "TOEFL iBT",
    text: "Для поступления в университеты США и Канады: чтение, аудирование, устная и письменная части.",
  },
  {
    icon: GraduationCap,
    title: "Cambridge English",
    text: "B2 First, C1 Advanced и другие экзамены Кембриджа с бессрочными сертификатами.",
  },
  {
    icon: School,
    title: "Школьные и вступительные экзамены",
    text: "ОГЭ, ЕГЭ и вступительные испытания в вузы: формат заданий и типичные ошибки.",
  },
];

export default async function ExamsPage() {
  const { user } = await requireSession();
  const ielts = await getIeltsProfile(user.id);

  return (
    <>
      <PageHeader
        title="Подготовка к экзаменам"
        description="Задания в формате международных экзаменов, учебный план и примерная оценка."
      />

      <Card className="animate-card-in gap-4 border-primary/40 bg-linear-to-br from-secondary to-card">
        <div className="flex items-start gap-4">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Award className="size-7" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-black">IELTS</h2>
              <Badge variant="river">Доступно</Badge>
            </div>
            <p className="mt-1 text-muted-foreground">
              Academic и General Training: диагностика, учебный план, Reading, Listening, Writing Task 1 и 2, Speaking
              Parts 1–3 и примерный Band Score.
            </p>
          </div>
        </div>
        <ul className="grid gap-1.5 text-sm sm:grid-cols-2">
          {[
            "Оригинальные задания в формате экзамена",
            "Подробное объяснение каждой ошибки",
            "Проверка эссе и устных ответов с помощью ИИ",
            "Прогресс по четырём навыкам",
          ].map((item) => (
            <li key={item} className="flex items-center gap-2">
              <BookOpenText className="size-4 shrink-0 text-primary" aria-hidden />
              {item}
            </li>
          ))}
        </ul>
        <Button asChild size="lg" className="sm:self-start">
          <Link href="/exams/ielts">
            {ielts ? "Продолжить подготовку" : "Начать подготовку к IELTS"}
            <ArrowRight aria-hidden />
          </Link>
        </Button>
      </Card>

      <h2 className="mt-8 mb-3 text-lg font-black">Скоро</h2>
      <ul className="grid gap-3 sm:grid-cols-3">
        {FUTURE.map((item, index) => {
          const Icon = item.icon;
          return (
            <li
              key={item.title}
              className="animate-card-in flex flex-col gap-2 rounded-2xl border-2 border-dashed bg-card/60 p-4"
              style={{ animationDelay: `${120 + index * 80}ms` }}
            >
              <div className="flex items-center justify-between gap-2">
                <Icon className="size-6 text-muted-foreground" aria-hidden />
                <Badge variant="muted">Скоро</Badge>
              </div>
              <h3 className="font-black">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.text}</p>
            </li>
          );
        })}
      </ul>
      <p className="mt-4 text-sm text-muted-foreground">
        Пока эти направления в разработке, разговорная практика с Отти и уроки помогут подготовиться к любому экзамену.
      </p>
    </>
  );
}
