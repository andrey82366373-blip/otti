"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/** Включает светлую, тёмную и системную тему для всего приложения. */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
