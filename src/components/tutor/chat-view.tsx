"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Flag, LoaderCircle, SendHorizontal, WifiOff, X } from "lucide-react";

import { Otti } from "@/components/otti";
import {
  OttiMessage,
  OutboxMessage,
  SummaryCard,
  TypingIndicator,
  UserMessage,
  type OutboxStatus,
} from "@/components/tutor/chat-parts";
import { VoiceInputButton } from "@/components/tutor/voice-input";
import { Button } from "@/components/ui/button";
import type { SessionSummary, SuggestedWord } from "@/db/schema";
import {
  addChatWord,
  answerGoalSwitch,
  finishConversation,
  sendChatMessage,
  type ChatErrorKind,
  type SendResult,
} from "@/lib/actions/tutor";
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
  /** Куда ведёт кнопка после согласия перейти к IELTS. */
  examHref?: string | null;
};

/** Сообщение, которое ещё не доставлено: отправляется, ждёт повтора или не отправилось. */
type Outbox = {
  /** Ключ отправки: одинаковый у всех повторов, поэтому сервер не создаст дубль. */
  id: string;
  text: string;
  status: OutboxStatus;
  kind: ChatErrorKind | null;
  error: string | null;
  requestId?: string;
  retryable: boolean;
  /** Когда браузер повторит отправку сам (мс), или null. */
  retryAt: number | null;
  /** Сколько раз браузер уже повторил сам после обрыва связи с сервером. */
  autoTries: number;
};

/** Сколько раз браузер сам повторяет отправку, если сервер не ответил (обрыв связи). */
const CLIENT_AUTO_RETRIES = 2;

function newClientRequestId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  // Сайт открыт не по HTTPS (например, по адресу в локальной сети) — randomUUID недоступен
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

/* ── Черновик и неотправленное сообщение переживают перезагрузку страницы ── */

function storageKey(threadId: string, kind: "draft" | "pending") {
  return `otti:chat-${kind}:${threadId}`;
}

function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string | null) {
  try {
    if (value) window.localStorage.setItem(key, value);
    else window.localStorage.removeItem(key);
  } catch {
    // хранилище недоступно (приватный режим) — просто не сохраняем
  }
}

/* ── Есть ли интернет ── */

function subscribeOnline(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function useOnline() {
  return useSyncExternalStore(
    subscribeOnline,
    () => navigator.onLine,
    () => true,
  );
}

/** Чат с Отти: сообщения, исправления, перевод, слова в словарь и итоги занятия. */
export function ChatView(props: ChatViewProps) {
  // Начальные данные запоминаются один раз: страница может обновиться после ответа сервера
  const [initial] = useState(props);
  const { threadId, title, level, unavailableMessage, mock, maxChars, maxMessages } = initial;
  const router = useRouter();
  const online = useOnline();

  const [messages, setMessages] = useState(initial.initialMessages);
  const [summary, setSummary] = useState(initial.initialSummary);
  const [summaryXp, setSummaryXp] = useState(0);
  const [outbox, setOutbox] = useState<Outbox | null>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);
  const [usedToday, setUsedToday] = useState(initial.usedToday);
  const [sessionXp, setSessionXp] = useState(0);
  const [dictionary, setDictionary] = useState(() => new Set(initial.dictionary));
  const [addingWord, setAddingWord] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [goalBusy, setGoalBusy] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  // Перевод по умолчанию открыт на уровнях A1–A2; ученик может переключать его у каждого сообщения
  const [translationToggled, setTranslationToggled] = useState<Record<string, boolean>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  // Защита от двойной отправки: пока запрос идёт, второй не начинается
  const deliveringRef = useRef(false);
  const outboxRef = useRef<Outbox | null>(null);
  const restoredRef = useRef(false);

  const defaultTranslation = level === "A1" || level === "A2";
  const studentMessages = messages.filter((message) => message.role === "user").length;
  // Пока сообщение отправляется или ждёт автоповтора, новое отправить нельзя
  const sending = outbox !== null && outbox.status !== "failed";
  const limitReached = messages.length >= maxMessages;
  const canFinish = !summary && studentMessages >= CHAT_MIN_MESSAGES_FOR_SUMMARY && !unavailableMessage;
  const hasCyrillic = /[а-яё]/i.test(text);

  const updateOutbox = useCallback(
    (next: Outbox | null) => {
      outboxRef.current = next;
      setOutbox(next);
      writeStorage(storageKey(threadId, "pending"), next ? JSON.stringify({ id: next.id, text: next.text }) : null);
    },
    [threadId],
  );

  const deliver = useCallback(
    async (item: Outbox) => {
      if (deliveringRef.current) return;
      if (!navigator.onLine) {
        updateOutbox({
          ...item,
          status: "waiting",
          kind: "offline",
          error: "Нет интернета. Сообщение отправится само, когда связь вернётся.",
          retryable: true,
          retryAt: null,
        });
        return;
      }

      deliveringRef.current = true;
      updateOutbox({ ...item, status: "sending", error: null, requestId: undefined, retryAt: null });
      let result: SendResult | null = null;
      try {
        result = await sendChatMessage({ threadId, text: item.text, clientRequestId: item.id });
      } catch {
        result = null;
      } finally {
        deliveringRef.current = false;
      }

      // Сервер не ответил: пропал интернет или оборвалась связь
      if (!result) {
        if (!navigator.onLine) {
          updateOutbox({
            ...item,
            status: "waiting",
            kind: "offline",
            error: "Нет интернета. Сообщение отправится само, когда связь вернётся.",
            retryable: true,
            retryAt: null,
          });
        } else if (item.autoTries < CLIENT_AUTO_RETRIES) {
          updateOutbox({
            ...item,
            status: "waiting",
            kind: "unknown",
            error: "Связь с сервером прервалась. Повторяю отправку…",
            retryable: true,
            retryAt: Date.now() + 2500 * (item.autoTries + 1),
            autoTries: item.autoTries + 1,
          });
        } else {
          updateOutbox({
            ...item,
            status: "failed",
            kind: "unknown",
            error: "Не удалось связаться с сервером. Проверь интернет и нажми «Повторить отправку».",
            retryable: true,
            retryAt: null,
          });
        }
        return;
      }

      if (result.ok) {
        const { userMessage, reply } = result;
        // Повтор мог вернуть уже показанные сообщения — дубли не добавляем
        setMessages((list) => {
          const ids = new Set(list.map((message) => message.id));
          return [...list, ...[userMessage, reply].filter((message) => !ids.has(message.id))];
        });
        setUsedToday(result.usedToday);
        if (!result.duplicate) setSessionXp((xp) => xp + result.xpEarned);
        updateOutbox(null);
        return;
      }

      const base = { ...item, kind: result.kind, error: result.error, requestId: result.requestId, retryAt: null };
      switch (result.kind) {
        case "invalid":
          // Такое сообщение отправить нельзя — возвращаем текст в поле ввода
          updateOutbox(null);
          setText((current) => current || item.text);
          setError(result.error);
          break;
        case "limit":
          updateOutbox(
            result.retryAfterSec
              ? { ...base, status: "waiting", retryable: true, retryAt: Date.now() + result.retryAfterSec * 1000 }
              : { ...base, status: "failed", retryable: false },
          );
          break;
        default:
          updateOutbox({ ...base, status: "failed", retryable: result.retryable });
      }
    },
    [threadId, updateOutbox],
  );

  // Связь вернулась — отправляем ждущее сообщение сами, без повторного нажатия
  useEffect(() => {
    if (!online) return;
    const pending = outboxRef.current;
    if (pending && pending.status === "waiting" && pending.kind === "offline") {
      void deliver({ ...pending, autoTries: 0 });
    }
  }, [online, deliver]);

  // Запланированный автоповтор (обрыв связи с сервером, минутный лимит)
  const retryAt = outbox?.retryAt ?? null;
  useEffect(() => {
    if (retryAt === null) return;
    const tick = window.setInterval(() => setNow(Date.now()), 1000);
    const timer = window.setTimeout(
      () => {
        const pending = outboxRef.current;
        if (pending && pending.retryAt === retryAt) void deliver(pending);
      },
      Math.max(0, retryAt - Date.now()),
    );
    return () => {
      window.clearInterval(tick);
      window.clearTimeout(timer);
    };
  }, [retryAt, deliver]);

  // После перезагрузки страницы: возвращаем черновик и досылаем неотправленное сообщение
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    const draft = readStorage(storageKey(threadId, "draft"));
    const rawPending = readStorage(storageKey(threadId, "pending"));
    let pending: { id?: unknown; text?: unknown } | null = null;
    try {
      pending = rawPending ? (JSON.parse(rawPending) as { id?: unknown; text?: unknown }) : null;
    } catch {
      pending = null;
    }
    queueMicrotask(() => {
      if (draft) setText(draft.slice(0, maxChars));
      if (pending && typeof pending.id === "string" && typeof pending.text === "string" && pending.text.trim()) {
        void deliver({
          id: pending.id,
          text: pending.text,
          status: "sending",
          kind: null,
          error: null,
          retryable: true,
          retryAt: null,
          autoTries: 0,
        });
      }
    });
  }, [threadId, maxChars, deliver]);

  // Черновик сохраняется, пока ученик печатает
  useEffect(() => {
    writeStorage(storageKey(threadId, "draft"), text.trim() ? text : null);
  }, [text, threadId]);

  // Новое сообщение — прокручиваем вниз
  useEffect(() => {
    const box = scrollRef.current;
    if (box) box.scrollTo({ top: box.scrollHeight, behavior: "smooth" });
  }, [messages.length, outbox?.status, summary, finishing]);

  // Поле ввода растёт вместе с текстом (до 5 строк)
  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    input.style.height = "auto";
    input.style.height = `${Math.min(input.scrollHeight, 160)}px`;
  }, [text]);

  function send() {
    const value = text.trim();
    if (!value || sending || finishing || deliveringRef.current) return;
    setError(null);
    setText("");
    void deliver({
      id: newClientRequestId(),
      text: value,
      status: "sending",
      kind: null,
      error: null,
      retryable: true,
      retryAt: null,
      autoTries: 0,
    });
    inputRef.current?.focus();
  }

  function retry() {
    const pending = outboxRef.current;
    if (pending) void deliver({ ...pending, autoTries: 0 });
  }

  function editPending() {
    const pending = outboxRef.current;
    if (!pending || pending.status === "sending") return;
    setText(pending.text);
    updateOutbox(null);
    inputRef.current?.focus();
  }

  async function answerGoal(messageId: string, accept: boolean) {
    if (goalBusy) return;
    setGoalBusy(messageId);
    setError(null);
    try {
      const result = await answerGoalSwitch({ messageId, accept });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setMessages((list) =>
        list.map((message) =>
          message.id === messageId && message.action
            ? { ...message, action: { ...message.action, status: result.status } }
            : message,
        ),
      );
      if (result.redirectTo) router.push(result.redirectTo);
    } catch {
      setError("Нет связи с сервером. Проверь интернет и попробуй ещё раз.");
    } finally {
      setGoalBusy(null);
    }
  }

  async function finish() {
    if (finishing || sending) return;
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
      send();
    }
  }

  const countdown = outbox?.retryAt ? Math.max(0, Math.ceil((outbox.retryAt - now) / 1000)) : null;
  const loginHref = outbox?.kind === "auth" ? `/sign-in?next=${encodeURIComponent(`/tutor/${threadId}`)}` : null;

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
          {sessionXp > 0 && (
            <span
              key={sessionXp}
              aria-hidden
              className="animate-float-up pointer-events-none rounded-full bg-xp px-2 py-0.5 text-xs font-black text-otti-ink opacity-0"
            >
              +XP
            </span>
          )}
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
                goalAction={{
                  busy: goalBusy === message.id,
                  onAnswer: (accept) => void answerGoal(message.id, accept),
                  href: initial.examHref ?? null,
                }}
              />
            ) : (
              <UserMessage key={message.id} message={message} />
            ),
          )}

          {outbox && (
            <>
              <OutboxMessage
                text={outbox.text}
                status={outbox.status}
                error={outbox.error}
                requestId={outbox.requestId}
                offline={outbox.kind === "offline"}
                countdown={outbox.retryAt ? countdown : null}
                canRetry={outbox.retryable && outbox.kind !== "offline"}
                loginHref={loginHref}
                onRetry={retry}
                onEdit={editPending}
              />
              {outbox.status === "sending" && <TypingIndicator label="Отти печатает…" />}
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
          {!online && !outbox && (
            <p role="status" className="mb-2 flex items-center gap-2 rounded-xl bg-muted px-3 py-2 text-sm font-semibold">
              <WifiOff className="size-4" aria-hidden />
              Нет интернета. Можно писать — сообщение уйдёт, когда связь вернётся.
            </p>
          )}
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
                send();
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
