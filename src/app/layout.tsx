import type { Metadata, Viewport } from "next";
import "@fontsource-variable/nunito";
import "./globals.css";

import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: {
    default: "Otti — английский с ИИ-репетитором",
    template: "%s · Otti",
  },
  description:
    "Короткие уроки английского от A1 до B2 и ИИ-репетитор, который объясняет ошибки по-русски.",
  applicationName: "Otti",
  // Установка на iPhone: «Поделиться» → «На экран Домой»
  appleWebApp: { capable: true, title: "Otti", statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f6fb" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1022" },
  ],
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className="min-h-dvh">
        <ThemeProvider>{children}</ThemeProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
