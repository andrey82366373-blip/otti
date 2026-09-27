"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Flag, LoaderCircle, SendHorizontal, X } from "lucide-react";

import { Otti } from "@/components/otti";
import {
  OttiMessage,
  SummaryCard,
  TypingIndicator,
  UserMessage,
} from "@/components/tutor/chat-parts";
import { VoiceInputButton } from "@/components/tutor/voice-input";
import { Button } from "@/components/ui/button";
import type { SessionSummary, SuggestedWord } from "@/db/schema";
import { addChatWord, finishConversation, sendChatMessage } from "@/lib/actions/tutor";
import type { CefrLevel } from "@/lib/learning";
import { CHAT_MIN_MESSAGES_FOR_SUMMARY } from "@/lib/tutor/rules";
import type { ChatMessageView } from "@/lib/tutor/store";

type ChatViewProps = {
  threadId: string;
  title: string;
  initialMessages: ChatMessageView[];
  initialSummary: SessionSummary | null;
  level: CefrLevel;
  /** null — можно разговаривать; иначе — почему нельзя. */
  unavailableMessage: string | null;
  mock: boolean;
  usedToday: number;
  dailyLimit: number;
  maxChars: number;
  maxMessages: number;
  dictionary: string[];
};

/** Чат с Отти: сообщения, исправления, перевод, слова в словарь и итоги занятия. */
export function ChatView(props: ChatViewProps) {
  // Начальные данные запоминаются один раз: страница может обновиться после ответа сервера
  const [initial] = useState(props);
  const { threadId, title, level, unavailableMessage, mock, maxChars, maxMessages } = initial;

  const [messages, setMessages] = useState(initial.initialMessages);
  const [summary, setSummary] = useState(initial.initialSummary);
  const [summaryXp, setSummaryXp] = useState(0);
  const [pendingText, setPendingText] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);
  const [usedToday, setUsedToday] = useState(initial.usedToday);
  const [sessionXp, setSessionXp] = useState(0);
  const [dictionary, setDictionary] = useState(() => new Set(initial.dictionary));
  const [addingWord, setAddingWord] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  // Перевод по умолчанию открыт на уровнях A1–A2; ученик может переключать его у каждого сообщения
  const [translationToggled, setTranslationToggled] = useState<Record<string, boolean>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const defaultTranslation = level === "A1" || level === "A2";
  const studentMessages = messages.filter((message) => message.role === "user").length;
  const sending = pendingText !== null;
  const limitReached = messages.length >= maxMessages;
  const canFinish = !summary && studentMessages >= CHAT_MIN_MESSAGES_FOR_SUMMARY && !unavailableMessage;
  const hasCyrillic = /[а-яё]/i.test(text);

  // Новое сообщение — прокручиваем вниз
  useEffect(() => {
    const box = scrollRef.current;
    if (box) box.scrollTo({ top: box.scrollHeight, behavior: "smooth" });
  }, [messages.length, pendingText, summary, finishing]);

  // Поле ввода растёт вместе с текстом (до 5 строк)
  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    input.style.height = "auto";
    input.style.height = `${Math.min(input.scrollHeight, 160)}px`;
  }, [text]);

  async function send() {
    const value = text.trim();
    if (!value || sending || finishing) return;
    setError(null);
    setPendingText(value);
    setText("");
    try {
      const result = await sendChatMessage({ threadId, text: value });
      if (!result.ok) {
        setError(result.error);
        setText(value);
      } else {
        setMessages((list) => [...list, result.userMessage, result.reply]);
        setUsedToday(result.usedToday);
        setSessionXp((xp) => xp + result.xpEarned);
      }
    } catch {
      setError("Нет связи с сервером. Проверь интернет и попробуй ещё раз.");
      setText(value);
    } finally {
      setPendingText(null);
      inputRef.current?.focus();
    }
  }

  async function finish() {
    if (finishing) return;
    setFinishing(true);
    setError(null);
    try {
      const result = await finishConversation({ threadId });
      if (result.ok) {
        setSummary(result.summary);
        setSummaryXp(result.xpEarned);
      } else {
        setError(result.error);
      }
    } catch {
      setError("Нет связи с сервером. Проверь интернет и попробуй ещё раз.");
    } finally {
      setFinishing(false);
    }
  }

  async function addWord(messageId: string, word: SuggestedWord) {
    const key = word.en.toLowerCase();
    setAddingWord(key);
    try {
      const result = await addChatWord({ messageId, en: word.en });
      if (result.ok) setDictionary((set) => new Set(set).add(key));
      else setError(result.error);
    } catch {
      setError("Не удалось добавить слово. Проверь интернет.");
    } finally {
      setAddingWord(null);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void send();
    }
  }

  return (
    <div className="flex h-dvh flex-col">
      {/* Верх: назад, тема, завершить */}
      <header className="border-b bg-background">
        <div className="mx-auto flex w-full max-w-2xl items-center gap-2 px-2 py-2 sm:px-4">
          <Button asChild variant="ghost" size="icon" aria-label="Ко всем разговорам">
            <Link href="/tutor">
              <ArrowLeft className="size-5" />
            </Link>
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-extrabold">{title}</h1>
            <p className="truncate text-xs text-muted-foreground">
              {mock ? "Тестовый режим · " : ""}Сообщений сегодня: {usedToday} из {initial.dailyLimit}
              {sessionXp > 0 && ` · +${sessionXp} XP`}
            </p>
          </div>
          {canFinish && (
            <Button type="button" variant="outline" size="sm" onClick={finish} disabled={finishing || sending}>
              {finishing ? <LoaderCircle className="animate-spin" aria-hidden /> : <Flag aria-hidden />}
              Завершить
            </Button>
          )}
        </div>
      </header>

      {/* Сообщения */}
      <main ref={scrollRef} className="flex-1 overflow-y-auto" aria-live="polite" aria-relevant="additions">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-5">
          {mock && (
            <p className="rounded-xl bg-muted px-3 py-2 text-center text-xs text-muted-foreground">
              Тестовый режим: Отти отвечает заготовками — настоящий ИИ ещё не подключён.
            </p>
          )}

          {messages.map((message) =>
            message.role === "assistant" ? (
              <OttiMessage
                key={message.id}
                message={message}
                showTranslation={translationToggled[message.id] ?? defaultTranslation}
                onToggleTranslation={() =>
                  setTranslationToggled((map) => ({
                    ...map,
                    [message.id]: !(map[message.id] ?? defaultTranslation),
                  }))
                }
                dictionary={dictionary}
                addingWord={addingWord}
                onAddWord={(word) => addWord(message.id, word)}
              />
            ) : (
              <UserMessage key={message.id} message={message} />
            ),
          )}

          {pendingText !== null && (
            <>
              <UserMessage message={{ content: pendingText, correction: null }} pending />
              <TypingIndicator label="Отти печатает…" />
            </>
          )}
          {finishing && <TypingIndicator label="Отти подводит итоги…" />}

          {summary && (
            <>
              <SummaryCard summary={summary} xpEarned={summaryXp} />
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button asChild>
                  <Link href="/tutor">Новый разговор</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/learn">На главную</Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Низ: поле ввода или пояснение, почему писать нельзя */}
      <footer className="border-t bg-background pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto w-full max-w-2xl px-4 py-3">
          {error && (
            <div role="alert" className="mb-2 flex items-start gap-2 rounded-xl bg-destructive-soft px-3 py-2 text-sm">
              <p className="flex-1 font-semibold text-destructive">{error}</p>
              <button
                type="button"
                onClick={() => setError(null)}
                aria-label="Скрыть сообщение об ошибке"
                className="rounded p-0.5 text-destructive outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
          )}

          {summary ? (
            <p className="py-1 text-center text-sm text-muted-foreground">Разговор завершён.</p>
          ) : unavailableMessage ? (
            <div className="flex items-center gap-3 py-1">
              <Otti size={40} mood="confused" />
              <p className="text-sm text-muted-foreground">{unavailableMessage}</p>
            </div>
          ) : limitReached ? (
            <div className="flex flex-col items-center gap-2 py-1 text-center">
              <p className="text-sm text-muted-foreground">
                Разговор получился длинным! Подведи итоги — и начни новый.
              </p>
              {canFinish && (
                <Button type="button" onClick={finish} disabled={finishing}>
                  Подвести итоги
                </Button>
              )}
            </div>
          ) : (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void send();
              }}
              className="flex items-end gap-2"
            >
              <label htmlFor="chat-input" className="sr-only">
                Сообщение для Отти
              </label>
              <textarea
                id="chat-input"
                ref={inputRef}
                rows={1}
                value={text}
                onChange={(event) => setText(event.target.value)}
                onKeyDown={handleKeyDown}
                maxLength={maxChars}
                enterKeyHint="send"
                autoComplete="off"
                placeholder="Напиши по-английски…"
                disabled={finishing}
                className="max-h-40 min-h-11 flex-1 resize-none rounded-xl border-2 bg-card px-4 py-2.5 text-base outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              />
              <VoiceInputButton
                disabled={sending || finishing}
                getBaseText={() => text}
                onText={(value) => setText(value.slice(0, maxChars))}
                onError={setError}
                onListeningChange={setListening}
              />
              <Button
                type="submit"
                size="icon"
                className="size-11"
                aria-label="Отправить"
                disabled={sending || finishing || !text.trim()}
              >
                {sending ? <LoaderCircle className="animate-spin" aria-hidden /> : <SendHorizontal aria-hidden />}
              </Button>
            </form>
          )}

          {!summary && !unavailableMessage && !limitReached && (
            <div className="mt-1.5 flex justify-between gap-3 text-xs text-muted-foreground">
              {listening ? (
                <span className="font-bold text-primary" role="status">
                  Слушаю… Говори по-английски, потом нажми ■.
                </span>
              ) : hasCyrillic ? (
                <span>Не знаешь, как сказать? Можно по-русски — Отти подскажет по-английски.</span>
              ) : (
                <span className="hidden md:inline">Enter — отправить, Shift + Enter — новая строка</span>
              )}
              {text.length > maxChars * 0.8 && (
                <span className="shrink-0 tabular-nums">
                  {text.length}/{maxChars}
                </span>
              )}
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}
