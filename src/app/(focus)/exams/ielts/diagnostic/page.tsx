import type { Metadata } from "next";

import { DiagnosticFlow } from "@/components/exams/diagnostic-flow";
import { DIAGNOSTIC_LISTENING } from "@/content/ielts/listening";
import { DIAGNOSTIC_READING } from "@/content/ielts/reading";
import { DIAGNOSTIC_SPEAKING } from "@/content/ielts/speaking";
import { DIAGNOSTIC_WRITING } from "@/content/ielts/writing";
import { getAiConfig } from "@/lib/ai/config";
import { toPlayerTask } from "@/lib/exams/player-task";
import { requireIelts } from "@/lib/exams/require";

export const metadata: Metadata = { title: "Диагностика IELTS" };

export const maxDuration = 120;

export default async function DiagnosticPage() {
  const { profile } = await requireIelts();
  const limits = getAiConfig().limits;
  return (
    <DiagnosticFlow
      reading={toPlayerTask(DIAGNOSTIC_READING)}
      listening={toPlayerTask(DIAGNOSTIC_LISTENING)}
      writing={{
        id: DIAGNOSTIC_WRITING.id,
        task: 2,
        title: "Diagnostic",
        kindTitle: "Короткий ответ-мнение",
        prompt: DIAGNOSTIC_WRITING.prompt,
        minWords: DIAGNOSTIC_WRITING.minWords,
        minutes: DIAGNOSTIC_WRITING.minutes,
        structure: [
          { title: "1. Ответ на вопрос", text: "Сразу скажи, что предпочитаешь." },
          { title: "2. Две причины", text: "Каждая причина — с коротким примером из жизни." },
          { title: "3. Вывод", text: "Одно предложение, которое повторяет твою мысль." },
        ],
        phrases: ["I prefer … because …", "For example, …", "Another reason is that …", "That is why …"],
      }}
      speaking={{
        id: DIAGNOSTIC_SPEAKING.id,
        part: 1,
        topic: "About you",
        questions: DIAGNOSTIC_SPEAKING.questions,
        prepSeconds: 0,
        answerSeconds: DIAGNOSTIC_SPEAKING.answerSeconds,
        ideas: ["Отвечай 2–3 предложениями: ответ, причина, пример.", "I live in … . It's a … city.", "At the weekend I usually …"],
      }}
      writingRemaining={Math.max(1, limits.examWritingDaily)}
      speakingRemaining={Math.max(1, limits.examSpeakingDaily)}
      previous={profile.diagnostic ?? null}
    />
  );
}
