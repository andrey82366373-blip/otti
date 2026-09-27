import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";
/** Сайт на хостинге с HTTPS (Render или Vercel). */
const onHttpsHost = Boolean(process.env.VERCEL || process.env.RENDER);

/**
 * Политика безопасности содержимого (CSP): браузер загружает скрипты, стили, картинки
 * и шрифты только с этого сайта и не даёт встроить сайт в чужую страницу.
 * Запросы к ИИ идут с сервера, поэтому браузеру внешние адреса не нужны.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "worker-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(onHttpsHost ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  // Не угадывать тип файла — защита от подмены
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Сайт нельзя открыть внутри чужой страницы (защита от «кликджекинга»)
  { key: "X-Frame-Options", value: "DENY" },
  // Чужим сайтам передаётся только адрес сайта, без страниц и параметров
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Микрофон — только для голосового ввода на этом сайте; камера и геолокация не нужны
  { key: "Permissions-Policy", value: "camera=(), microphone=(self), geolocation=(), payment=(), usb=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  // Только HTTPS (на Render и Vercel сайт и так работает по HTTPS)
  ...(onHttpsHost ? [{ key: "Strict-Transport-Security", value: "max-age=31536000" }] : []),
];

const nextConfig: NextConfig = {
  // Не сообщаем в заголовках ответа, на чём сделан сайт
  poweredByHeader: false,
  // Прячем служебный значок Next.js в углу (ошибки всё равно будут показываться)
  devIndicators: false,
  // Локальная база PGlite подключается как есть, без упаковки
  serverExternalPackages: ["@electric-sql/pglite"],

  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        // Service worker всегда берётся свежим — чтобы обновления сайта доходили сразу
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
