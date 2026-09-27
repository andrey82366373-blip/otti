"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";

import { FormError } from "@/components/auth/form-parts";
import { PlacementTest } from "@/components/learning/placement-test";
import { Otti } from "@/components/otti";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { PlacementResult, PublicPlacementQuestion } from "@/content/placement-test";
import { gradePlacementTest, setLevel } from "@/lib/actions/learning";
import { LEVEL_INFO, type CefrLevel } from "@/lib/learning";

type Stage = "intro" | "test" | "result";

/** Повторный мини-тест из профиля: показывает результат и предлагает сменить уровень. */
export function LevelTestFlow({
  questions,
  currentLevel,
}: {
  questions: PublicPlacementQuestion[];
  currentLevel: CefrLevel;
}) {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("intro");
  const [result, setResult] = useState<PlacementResult | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleComplete(answers: number[]) {
    setStage("result");
    setPending(true);
    setError(null);
    try {
      const response = await gradePlacementTest(answers);
      if (response.ok) setResult(response.result);
      else setError(response.error);
    } catch {
      setError("Нет связи с сервером. Проверь интернет и попробуй ещё раз.");
    }
    setPending(false);
  }

  async function applyLevel(level: CefrLevel) {
    setPending(true);
    setError(null);
    try {
      const response = await setLevel(level);
      if (!response.ok) {
        setError(response.error);
        setPending(false);
        return;
      }
      router.replace("/profile");
      router.refresh();
    } catch {
      setError("Нет связи с сервером. Проверь интернет и попробуй ещё раз.");
      setPending(false);
    }
  }

  if (stage === "intro") {
    return (
      <div className="flex flex-col gap-5">
        <Card className="items-center text-center">
          <Otti size={88} mood="wink" />
          <div>
            <h2 className="text-2xl font-black tracking-tight">10 вопросов, около 2 минут</h2>
            <p className="mt-2 text-muted-foreground">
              Сейчас у тебя уровень {currentLevel}. Если не знаешь ответ — нажимай «Не знаю».
            </p>
          </div>
        </Card>
        <Button size="lg" onClick={() => setStage("test")}>
          Начать тест
        </Button>
      </div>
    );
  }

  if (stage === "test") {
    return <PlacementTest questions={questions} onComplete={handleComplete} />;
  }

  return (
    <div className="flex flex-col gap-5">
      {pending && !result && (
        <div role="status" className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
          <LoaderCircle className="size-5 animate-spin" aria-hidden />
          Считаем результат…
        </div>
      )}

      {result && (
        <Card className="items-center text-center">
          <Otti size={88} mood="happy" />
          <div>
            <p className="text-sm font-extrabold tracking-wide text-river uppercase">
              Правильных ответов: {result.correct} из {result.total}
            </p>
            <h2 className="mt-1 text-2xl font-black tracking-tight">Тест показал {result.level}</h2>
            <p className="mt-1 text-muted-foreground">{LEVEL_INFO[result.level].title}</p>
          </div>
        </Card>
      )}

      <FormError message={error} />

      {result && result.level !== currentLevel && (
        <>
          <Button size="lg" onClick={() => applyLevel(result.level)} disabled={pending}>
            {pending && <LoaderCircle className="animate-spin" aria-hidden />}
            Сменить уровень на {result.level}
          </Button>
          <Button asChild variant="ghost">
            <Link href="/profile">Оставить {currentLevel}</Link>
          </Button>
        </>
      )}

      {result && result.level === currentLevel && (
        <>
          <p className="text-center font-bold text-success">Уровень {currentLevel} подтверждён.</p>
          <Button asChild size="lg">
            <Link href="/profile">Вернуться в профиль</Link>
          </Button>
        </>
      )}

      {!result && !pending && (
        <Button size="lg" onClick={() => setStage("intro")}>
          Попробовать ещё раз
        </Button>
      )}
    </div>
  );
}
