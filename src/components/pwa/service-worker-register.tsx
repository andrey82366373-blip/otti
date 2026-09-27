"use client";

import { useEffect } from "react";

/**
 * Подключает service worker (public/sw.js). Он нужен только для одного:
 * если пропал интернет, показать страницу «Нет подключения» вместо ошибки браузера.
 * На компьютере при разработке (npm run dev) не подключается.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch((error: unknown) => {
      console.warn("Service worker не подключился:", error);
    });
  }, []);
  return null;
}
