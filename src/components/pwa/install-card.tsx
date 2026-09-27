"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { CircleCheck, Download, Smartphone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/** Событие браузера «можно установить приложение» (Chrome, Edge, Яндекс Браузер). */
type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type Platform = "server" | "installed" | "ios" | "other";

const noop = () => () => {};

function detectPlatform(): Platform {
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  if (standalone) return "installed";
  const ios =
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  return ios ? "ios" : "other";
}

/** Карточка «Установить Otti как приложение». */
export function InstallCard() {
  const platform = useSyncExternalStore(noop, detectPlatform, () => "server" as const);
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as InstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setPromptEvent(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function install() {
    if (!promptEvent) return;
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    if (choice.outcome === "accepted") setInstalled(true);
    setPromptEvent(null);
  }

  if (platform === "server") return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="size-5 text-primary" aria-hidden />
          Otti на телефоне
        </CardTitle>
        <CardDescription>
          Установи Otti как приложение: иконка на главном экране, открывается без адресной строки.
        </CardDescription>
      </CardHeader>

      {installed || platform === "installed" ? (
        <p className="flex items-center gap-2 font-bold text-success">
          <CircleCheck className="size-5" aria-hidden />
          Otti уже установлен на этом устройстве.
        </p>
      ) : promptEvent ? (
        <Button type="button" onClick={install} className="self-start">
          <Download aria-hidden />
          Установить Otti
        </Button>
      ) : platform === "ios" ? (
        <p className="text-sm">
          В Safari нажми кнопку <b>«Поделиться»</b> (квадрат со стрелкой вверх), затем{" "}
          <b>«На экран „Домой“»</b>.
        </p>
      ) : (
        <ul className="flex flex-col gap-1.5 text-sm">
          <li>
            <b>Android</b> (Chrome, Яндекс Браузер): меню браузера → <b>«Установить приложение»</b> или{" "}
            <b>«Добавить на главный экран»</b>.
          </li>
          <li>
            <b>Компьютер</b> (Chrome, Edge): значок установки справа в адресной строке.
          </li>
        </ul>
      )}
    </Card>
  );
}
